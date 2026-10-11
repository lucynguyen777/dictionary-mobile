import base64
import json
import logging
import os
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


MAX_INPUT_BYTES = int(os.getenv("CHANDRA_MAX_INPUT_BYTES", str(10 * 1024 * 1024)))
CHANDRA_TIMEOUT_SECONDS = int(os.getenv("CHANDRA_TIMEOUT_SECONDS", "180"))
CHANDRA_CLI = os.getenv("CHANDRA_CLI", "chandra")
CHANDRA_METHOD = os.getenv("CHANDRA_METHOD", "vllm")
DAILY_REQUESTS_PER_USER = int(os.getenv("CHANDRA_DAILY_REQUESTS_PER_USER", "20"))

# Requests carry the app user's Supabase access token; the service checks it with Supabase Auth.
# Only the public project URL and publishable key are needed, no service-role secret.
SUPABASE_URL = os.getenv("CHANDRA_SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.getenv("CHANDRA_SUPABASE_PUBLISHABLE_KEY", "").strip()
# Local development only: skips auth entirely. Never set this on a public host.
ALLOW_UNAUTHENTICATED = os.getenv("CHANDRA_ALLOW_UNAUTHENTICATED") == "1"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CHANDRA_ALLOWED_ORIGINS", "https://dictionaire-mobile.vercel.app,http://localhost:8081"
    ).split(",")
    if origin.strip()
]

logger = logging.getLogger("chandra-service")


class OcrRequest(BaseModel):
    # Unknown fields (including the removed server-side `filePath`) are rejected, not ignored.
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    file_base64: str = Field(alias="fileBase64", min_length=1)
    file_name: str | None = Field(default=None, alias="fileName", max_length=255)
    language_code: str | None = Field(default=None, alias="languageCode", max_length=35)


app = FastAPI(title="Dictionary Mobile Chandra OCR Service", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_headers=["Authorization", "Content-Type"],
    allow_methods=["POST"],
    allow_origins=ALLOWED_ORIGINS,
)


def verify_user_token(token: str) -> str | None:
    """Returns the Supabase user id for a valid access token, else None."""
    request = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_PUBLISHABLE_KEY},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            user = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        if error.code in (401, 403):
            return None
        raise
    user_id = user.get("id") if isinstance(user, dict) else None
    return user_id if isinstance(user_id, str) and user_id else None


class DailyLimiter:
    """Per-user request cap for one service instance (OCR runs on a single GPU host)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counts: dict[tuple[str, str], int] = {}

    def consume(self, user_id: str, limit: int) -> bool:
        day = time.strftime("%Y-%m-%d", time.gmtime())
        with self._lock:
            self._counts = {key: count for key, count in self._counts.items() if key[1] == day}
            used = self._counts.get((user_id, day), 0)
            if used >= limit:
                return False
            self._counts[(user_id, day)] = used + 1
            return True


daily_limiter = DailyLimiter()


def require_user(authorization: str | None = Header(default=None)) -> str:
    if ALLOW_UNAUTHENTICATED:
        return "local-development"
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise HTTPException(status_code=503, detail="OCR authentication is not configured.")
    if not authorization or not authorization.startswith("Bearer ") or not authorization[7:].strip():
        raise HTTPException(status_code=401, detail="Sign in to use OCR.")
    try:
        user_id = verify_user_token(authorization[7:].strip())
    except Exception as error:  # noqa: BLE001 - any auth backend failure must fail closed
        logger.warning("Supabase token check failed: %s", type(error).__name__)
        raise HTTPException(status_code=503, detail="OCR authentication is unavailable.") from error
    if not user_id:
        raise HTTPException(status_code=401, detail="Sign in to use OCR.")
    if not daily_limiter.consume(user_id, DAILY_REQUESTS_PER_USER):
        raise HTTPException(status_code=429, detail="Daily OCR limit reached.")
    return user_id


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ocr/image")
def ocr_image(request: OcrRequest, _user_id: str = Depends(require_user)) -> dict[str, Any]:
    return run_chandra_request(request, default_suffix=".png")


@app.post("/ocr/pdf")
def ocr_pdf(request: OcrRequest, _user_id: str = Depends(require_user)) -> dict[str, Any]:
    return run_chandra_request(request, default_suffix=".pdf")


def run_chandra_request(request: OcrRequest, default_suffix: str) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="chandra-ocr-") as temp_root:
        temp_dir = Path(temp_root)
        input_path = materialize_input(request, temp_dir, default_suffix)
        output_dir = temp_dir / "output"
        output_dir.mkdir(parents=True, exist_ok=True)

        command = [
            CHANDRA_CLI,
            str(input_path),
            str(output_dir),
            "--method",
            CHANDRA_METHOD,
            "--no-images",
        ]

        try:
            subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
                timeout=CHANDRA_TIMEOUT_SECONDS,
            )
        except FileNotFoundError as error:
            raise HTTPException(status_code=503, detail="Chandra CLI is not installed in this service image.") from error
        except subprocess.TimeoutExpired as error:
            raise HTTPException(status_code=504, detail="Chandra OCR timed out.") from error
        except subprocess.CalledProcessError as error:
            # stderr can echo document text or file paths, so it stays in the service log.
            logger.warning("Chandra CLI failed: %s", safe_process_error(error))
            raise HTTPException(status_code=502, detail="Chandra OCR failed.") from error

        return read_chandra_output(output_dir)


def materialize_input(request: OcrRequest, temp_dir: Path, default_suffix: str) -> Path:
    # Reject oversized input from the encoded length, before allocating the decoded bytes.
    encoded = request.file_base64.strip()
    if len(encoded) // 4 * 3 > MAX_INPUT_BYTES + 2:
        raise HTTPException(status_code=413, detail="OCR input exceeds the configured size limit.")
    try:
        payload = base64.b64decode(encoded, validate=True)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="fileBase64 must be valid base64.") from error
    if len(payload) > MAX_INPUT_BYTES:
        raise HTTPException(status_code=413, detail="OCR input exceeds the configured size limit.")

    safe_name = sanitize_file_name(request.file_name or f"input{default_suffix}")
    if "." not in safe_name.lstrip("."):
        safe_name = f"{safe_name}{default_suffix}"
    input_path = temp_dir / safe_name
    input_path.write_bytes(payload)
    return input_path


def read_chandra_output(output_dir: Path) -> dict[str, Any]:
    markdown = read_first_matching_text(output_dir, "*.md")
    metadata = read_first_matching_json(output_dir, "*metadata.json")
    text = markdown_to_plain_text(markdown)

    return {
        "text": text,
        "markdown": markdown,
        "pages": metadata.get("pages", []) if isinstance(metadata, dict) else [],
        "metadata": metadata if isinstance(metadata, dict) else {},
    }


def read_first_matching_text(output_dir: Path, pattern: str) -> str:
    for path in sorted(output_dir.rglob(pattern)):
        return path.read_text(encoding="utf-8").strip()
    return ""


def read_first_matching_json(output_dir: Path, pattern: str) -> dict[str, Any]:
    for path in sorted(output_dir.rglob(pattern)):
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            return value if isinstance(value, dict) else {}
        except json.JSONDecodeError:
            return {}
    return {}


def markdown_to_plain_text(markdown: str) -> str:
    return "\n".join(line.strip(" #*\t") for line in markdown.splitlines() if line.strip()).strip()


def sanitize_file_name(file_name: str) -> str:
    safe = "".join(character for character in file_name if character.isascii() and (character.isalnum() or character in "._-"))
    safe = safe.lstrip(".")[:120]
    return safe or "input"


def safe_process_error(error: subprocess.CalledProcessError) -> str:
    stderr = (error.stderr or "").strip().splitlines()
    if not stderr:
        return "Chandra OCR failed."

    return stderr[-1][:500]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("CHANDRA_SERVICE_HOST", "0.0.0.0"),
        port=int(os.getenv("CHANDRA_SERVICE_PORT", "8080")),
    )
