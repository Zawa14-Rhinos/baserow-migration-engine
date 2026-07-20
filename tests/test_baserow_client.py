from unittest.mock import MagicMock

import pytest

from migration_engine.baserow import (
    BaserowAuthError,
    BaserowClient,
    BaserowConfigError,
    BaserowNotFoundError,
    BaserowServerError,
)


def _response(status_code: int, json_data=None, text: str = ""):
    resp = MagicMock()
    resp.status_code = status_code
    resp.ok = 200 <= status_code < 300
    resp.json.return_value = json_data
    resp.text = text
    return resp


def test_from_env_missing_token_raises(monkeypatch):
    monkeypatch.delenv("BASEROW_API_TOKEN", raising=False)
    with pytest.raises(BaserowConfigError):
        BaserowClient.from_env()


def test_direct_construction_without_token_raises():
    with pytest.raises(BaserowConfigError):
        BaserowClient(token="")


def test_from_env_reads_token_and_default_url(monkeypatch):
    monkeypatch.setenv("BASEROW_API_TOKEN", "secret-token")
    monkeypatch.delenv("BASEROW_API_URL", raising=False)
    client = BaserowClient.from_env()
    assert client.token == "secret-token"
    assert client.api_url == "https://api.baserow.io"


def test_from_env_reads_custom_api_url_and_strips_trailing_slash(monkeypatch):
    monkeypatch.setenv("BASEROW_API_TOKEN", "secret-token")
    monkeypatch.setenv("BASEROW_API_URL", "https://baserow.example.org/")
    client = BaserowClient.from_env()
    assert client.api_url == "https://baserow.example.org"


def test_request_success_returns_json():
    client = BaserowClient(token="t")
    client.session.request = MagicMock(return_value=_response(200, json_data={"id": 1}))
    assert client._request("GET", "/api/x/") == {"id": 1}
    client.session.request.assert_called_once()


def test_request_sends_token_header():
    client = BaserowClient(token="my-token")
    client.session.request = MagicMock(return_value=_response(200, json_data=[]))
    client._request("GET", "/api/x/")
    _, kwargs = client.session.request.call_args
    assert kwargs["headers"]["Authorization"] == "Token my-token"


def test_request_auth_error_no_retry():
    client = BaserowClient(token="t", max_retries=3)
    client.session.request = MagicMock(return_value=_response(401))
    with pytest.raises(BaserowAuthError):
        client._request("GET", "/api/x/")
    assert client.session.request.call_count == 1


def test_request_not_found_no_retry():
    client = BaserowClient(token="t", max_retries=3)
    client.session.request = MagicMock(return_value=_response(404))
    with pytest.raises(BaserowNotFoundError):
        client._request("GET", "/api/x/")
    assert client.session.request.call_count == 1


def test_request_retries_on_server_error_then_succeeds(monkeypatch):
    client = BaserowClient(token="t", max_retries=3, backoff_factor=0)
    monkeypatch.setattr("migration_engine.baserow.time.sleep", lambda s: None)
    client.session.request = MagicMock(
        side_effect=[_response(503), _response(503), _response(200, json_data=[1, 2, 3])]
    )
    result = client._request("GET", "/api/x/")
    assert result == [1, 2, 3]
    assert client.session.request.call_count == 3


def test_request_raises_after_exhausting_retries(monkeypatch):
    client = BaserowClient(token="t", max_retries=2, backoff_factor=0)
    monkeypatch.setattr("migration_engine.baserow.time.sleep", lambda s: None)
    client.session.request = MagicMock(return_value=_response(500))
    with pytest.raises(BaserowServerError):
        client._request("GET", "/api/x/")
    assert client.session.request.call_count == 3  # initial attempt + 2 retries


def test_list_tables_calls_expected_endpoint():
    client = BaserowClient(token="t")
    client.session.request = MagicMock(return_value=_response(200, json_data=[{"id": 10, "name": "Kontakte"}]))
    tables = client.list_tables(999)
    assert tables == [{"id": 10, "name": "Kontakte"}]
    args, _ = client.session.request.call_args
    assert args[0] == "GET"
    assert args[1].endswith("/api/database/tables/database/999/")


def test_list_fields_calls_expected_endpoint():
    client = BaserowClient(token="t")
    client.session.request = MagicMock(return_value=_response(200, json_data=[{"id": 1, "name": "Name"}]))
    fields = client.list_fields(10)
    assert fields == [{"id": 1, "name": "Name"}]
    args, _ = client.session.request.call_args
    assert args[1].endswith("/api/database/fields/table/10/")


def test_list_tables_unwraps_paginated_response():
    client = BaserowClient(token="t")
    client.session.request = MagicMock(return_value=_response(200, json_data={"results": [{"id": 10}], "next": None}))
    assert client.list_tables(999) == [{"id": 10}]
