import base64
import importlib
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

PDF_BYTES = b"%PDF-1.4 scanned page"
VALID_TOKEN = "valid-user-token"


def load_service(monkeypatch, **env):
    for key in (
        "CHANDRA_ALLOW_UNAUTHENTICATED",
        "CHANDRA_SUPABASE_URL",
        "CHANDRA_SUPABASE_PUBLISHABLE_KEY",
        "CHANDRA_MAX_INPUT_BYTES",
        "CHANDRA_DAILY_REQUESTS_PER_USER",
    ):
        monkeypatch.delenv(key, raising=False)
    defaults = {
        "CHANDRA_SUPABASE_URL": "https://project.supabase.co",
        "CHANDRA_SUPABASE_PUBLISHABLE_KEY": "sb_publishable_test",
    }
    for key, value in {**defaults, **env}.items():
        if value is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, value)
    import app.main as main

    main = importlib.reload(main)
    monkeypatch.setattr(main, "verify_user_token", lambda token: "user-1" if token == VALID_TOKEN else None)
    return main


def fake_chandra(monkeypatch, main, calls):
    def run(command, **_kwargs):
        calls.append(command)
        output_dir = Path(command[2])
        (output_dir / "doc.md").write_text("# Title\nHello world", encoding="utf-8")
        return subprocess.CompletedProcess(command, 0, "", "")

    monkeypatch.setattr(main.subprocess, "run", run)


def pdf_request(**overrides):
    return {"fileBase64": base64.b64encode(PDF_BYTES).decode(), "fileName": "scan.pdf", **overrides}


def auth(token=VALID_TOKEN):
    return {"Authorization": f"Bearer {token}"}


def test_ocr_requires_a_signed_in_user(monkeypatch):
    main = load_service(monkeypatch)
    client = TestClient(main.app)

    assert client.post("/ocr/pdf", json=pdf_request()).status_code == 401
    assert client.post("/ocr/pdf", json=pdf_request(), headers=auth("forged")).status_code == 401


def test_ocr_fails_closed_without_auth_configuration(monkeypatch):
    main = load_service(monkeypatch, CHANDRA_SUPABASE_URL=None)
    response = TestClient(main.app).post("/ocr/pdf", json=pdf_request(), headers=auth())

    assert response.status_code == 503


def test_ocr_fails_closed_when_supabase_is_unreachable(monkeypatch):
    main = load_service(monkeypatch)

    def unreachable(_token):
        raise OSError("connection refused")

    monkeypatch.setattr(main, "verify_user_token", unreachable)
    response = TestClient(main.app).post("/ocr/pdf", json=pdf_request(), headers=auth())

    assert response.status_code == 503


def test_signed_in_user_gets_plain_text(monkeypatch):
    main = load_service(monkeypatch)
    calls = []
    fake_chandra(monkeypatch, main, calls)
    response = TestClient(main.app).post("/ocr/pdf", json=pdf_request(), headers=auth())

    assert response.status_code == 200
    assert response.json()["text"] == "Title\nHello world"
    assert Path(calls[0][1]).name == "scan.pdf"


def test_server_side_file_paths_are_rejected(monkeypatch):
    main = load_service(monkeypatch)
    calls = []
    fake_chandra(monkeypatch, main, calls)
    response = TestClient(main.app).post(
        "/ocr/pdf", json={"filePath": "/etc/passwd", "fileName": "x.pdf"}, headers=auth()
    )

    assert response.status_code == 422
    assert calls == []


def test_oversized_input_is_rejected_before_decoding(monkeypatch):
    main = load_service(monkeypatch, CHANDRA_MAX_INPUT_BYTES="16")
    decoded = []
    monkeypatch.setattr(main.base64, "b64decode", lambda *args, **kwargs: decoded.append(args) or b"")
    response = TestClient(main.app).post(
        "/ocr/pdf", json=pdf_request(fileBase64=base64.b64encode(b"x" * 64).decode()), headers=auth()
    )

    assert response.status_code == 413
    assert decoded == []


def test_input_at_the_limit_is_accepted(monkeypatch):
    main = load_service(monkeypatch, CHANDRA_MAX_INPUT_BYTES=str(len(PDF_BYTES)))
    fake_chandra(monkeypatch, main, [])
    response = TestClient(main.app).post("/ocr/pdf", json=pdf_request(), headers=auth())

    assert response.status_code == 200


def test_file_names_cannot_escape_the_temp_directory(monkeypatch):
    main = load_service(monkeypatch)
    calls = []
    fake_chandra(monkeypatch, main, calls)
    TestClient(main.app).post("/ocr/pdf", json=pdf_request(fileName="../../etc/cron.d/job"), headers=auth())

    input_path = Path(calls[0][1])
    assert input_path.parent.name.startswith("chandra-ocr-")
    assert input_path.name == "etccron.djob"


def test_cli_errors_do_not_reach_the_client(monkeypatch):
    main = load_service(monkeypatch)

    def failing(command, **_kwargs):
        raise subprocess.CalledProcessError(1, command, stderr="Traceback: /secret/path page text leaked")

    monkeypatch.setattr(main.subprocess, "run", failing)
    response = TestClient(main.app).post("/ocr/pdf", json=pdf_request(), headers=auth())

    assert response.status_code == 502
    assert "leaked" not in response.text
    assert "/secret/path" not in response.text


def test_daily_limit_per_user(monkeypatch):
    main = load_service(monkeypatch, CHANDRA_DAILY_REQUESTS_PER_USER="2")
    fake_chandra(monkeypatch, main, [])
    client = TestClient(main.app)

    statuses = [client.post("/ocr/pdf", json=pdf_request(), headers=auth()).status_code for _ in range(3)]
    assert statuses == [200, 200, 429]


@pytest.mark.parametrize("origin, allowed", [("https://dictionaire-mobile.vercel.app", True), ("https://evil.example", False)])
def test_cors_only_allows_app_origins(monkeypatch, origin, allowed):
    main = load_service(monkeypatch)
    response = TestClient(main.app).options(
        "/ocr/pdf",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization"},
    )

    assert (response.headers.get("access-control-allow-origin") == origin) is allowed


def test_ready_requires_auth_config_and_model_server(monkeypatch):
    main = load_service(monkeypatch, CHANDRA_SUPABASE_URL=None)
    assert TestClient(main.app).get("/ready").status_code == 503

    main = load_service(monkeypatch)
    monkeypatch.setattr(main, "model_server_ready", lambda: False)
    assert TestClient(main.app).get("/ready").status_code == 503

    monkeypatch.setattr(main, "model_server_ready", lambda: True)
    response = TestClient(main.app).get("/ready")
    assert response.status_code == 200
    assert TestClient(main.app).get("/health").json() == {"status": "ok"}


def test_model_server_check_targets_vllm_models_endpoint(monkeypatch):
    main = load_service(monkeypatch)
    monkeypatch.setattr(main, "VLLM_API_BASE", "http://vllm:8000/v1")
    seen = []

    class Response:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    def fake_urlopen(url, timeout):
        seen.append(url)
        return Response()

    monkeypatch.setattr(main.urllib.request, "urlopen", fake_urlopen)
    assert main.model_server_ready() is True
    assert seen == ["http://vllm:8000/v1/models"]

    def failing(url, timeout):
        raise OSError("connection refused")

    monkeypatch.setattr(main.urllib.request, "urlopen", failing)
    assert main.model_server_ready() is False
