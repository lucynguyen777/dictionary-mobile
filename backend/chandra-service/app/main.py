import base64
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


MAX_INPUT_BYTES = int(os.getenv("CHANDRA_MAX_INPUT_BYTES", str(10 * 1024 * 1024)))
CHANDRA_TIMEOUT_SECONDS = int(os.getenv("CHANDRA_TIMEOUT_SECONDS", "180"))
CHANDRA_CLI = os.getenv("CHANDRA_CLI", "chandra")
CHANDRA_METHOD = os.getenv("CHANDRA_METHOD", "vllm")


class OcrRequest(BaseModel):
    file_base64: str | None = Field(default=None, alias="fileBase64")
    file_path: str | None = Field(default=None, alias="filePath")
    file_name: str | None = Field(default=None, alias="fileName")
    language_code: str | None = Field(default=None, alias="languageCode")


app = FastAPI(title="Dictionary Mobile Chandra OCR Service", version="1.0.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/ocr/image")
def ocr_image(request: OcrRequest) -> dict[str, Any]:
    return run_chandra_request(request, default_suffix=".png")


@app.post("/ocr/pdf")
def ocr_pdf(request: OcrRequest) -> dict[str, Any]:
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
            raise HTTPException(status_code=502, detail=safe_process_error(error)) from error

        return read_chandra_output(output_dir)


def materialize_input(request: OcrRequest, temp_dir: Path, default_suffix: str) -> Path:
    if request.file_base64:
        try:
            payload = base64.b64decode(request.file_base64, validate=True)
        except ValueError as error:
            raise HTTPException(status_code=400, detail="fileBase64 must be valid base64.") from error

        if len(payload) > MAX_INPUT_BYTES:
            raise HTTPException(status_code=413, detail="OCR input exceeds the configured size limit.")

        safe_name = sanitize_file_name(request.file_name or f"input{default_suffix}")
        input_path = temp_dir / safe_name
        input_path.write_bytes(payload)
        return input_path

    if request.file_path:
        source_path = Path(request.file_path)
        if not source_path.exists() or not source_path.is_file():
            raise HTTPException(status_code=400, detail="filePath must point to a readable file in the service container.")

        size = source_path.stat().st_size
        if size > MAX_INPUT_BYTES:
            raise HTTPException(status_code=413, detail="OCR input exceeds the configured size limit.")

        safe_name = sanitize_file_name(request.file_name or source_path.name or f"input{default_suffix}")
        input_path = temp_dir / safe_name
        shutil.copyfile(source_path, input_path)
        return input_path

    raise HTTPException(status_code=400, detail="Provide fileBase64 or filePath.")


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
    safe = "".join(character for character in file_name if character.isalnum() or character in "._-")
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
