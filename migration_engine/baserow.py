"""Minimal, read-only Baserow API client.

Configuration comes exclusively from environment variables — no credentials
are ever read from or written to a file in this repository:

- BASEROW_API_TOKEN (required): Baserow API token, see Baserow -> Settings -> API tokens.
- BASEROW_API_URL (optional): defaults to https://api.baserow.io (self-hosted instances
  set this to their own URL, e.g. https://baserow.example.org).
"""

import os
import time

import requests

DEFAULT_API_URL = "https://api.baserow.io"
DEFAULT_TIMEOUT = 10.0
DEFAULT_MAX_RETRIES = 3
DEFAULT_BACKOFF_FACTOR = 0.5

_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


class BaserowError(Exception):
    """Base class for all Baserow client errors."""


class BaserowConfigError(BaserowError):
    """Required configuration (e.g. the API token) is missing or invalid."""


class BaserowAPIError(BaserowError):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class BaserowAuthError(BaserowAPIError):
    """401/403 — invalid, missing or insufficiently scoped API token."""


class BaserowNotFoundError(BaserowAPIError):
    """404 — database/table does not exist or the token has no access to it."""


class BaserowServerError(BaserowAPIError):
    """Transient error (5xx, 429, network failure) that persisted across all retries."""


class BaserowClient:
    """Read-only client. Only ever issues GET requests."""

    def __init__(
        self,
        token: str,
        api_url: str = DEFAULT_API_URL,
        timeout: float = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        backoff_factor: float = DEFAULT_BACKOFF_FACTOR,
        session: requests.Session | None = None,
    ):
        if not token:
            raise BaserowConfigError(
                "Kein API-Token übergeben. BASEROW_API_TOKEN setzen oder BaserowClient.from_env() verwenden."
            )
        self.token = token
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.session = session or requests.Session()

    @classmethod
    def from_env(cls) -> "BaserowClient":
        token = os.environ.get("BASEROW_API_TOKEN", "")
        if not token:
            raise BaserowConfigError(
                "Umgebungsvariable BASEROW_API_TOKEN ist nicht gesetzt. "
                "Zugangsdaten werden ausschließlich über Umgebungsvariablen konfiguriert, nie im Repository."
            )
        api_url = os.environ.get("BASEROW_API_URL", DEFAULT_API_URL)
        return cls(token=token, api_url=api_url)

    def _headers(self) -> dict:
        return {"Authorization": f"Token {self.token}"}

    def _sleep_before_retry(self, attempt: int) -> None:
        time.sleep(self.backoff_factor * (2 ** (attempt - 1)))

    def _request(self, method: str, path: str, **kwargs) -> dict | list:
        url = f"{self.api_url}{path}"
        attempt = 0
        while True:
            attempt += 1
            try:
                response = self.session.request(
                    method, url, headers=self._headers(), timeout=self.timeout, **kwargs
                )
            except requests.exceptions.RequestException as exc:
                if attempt > self.max_retries:
                    raise BaserowServerError(f"Verbindung zu {url} fehlgeschlagen: {exc}") from exc
                self._sleep_before_retry(attempt)
                continue

            if response.status_code in (401, 403):
                raise BaserowAuthError(
                    f"Authentifizierung fehlgeschlagen ({response.status_code}) für {url}. "
                    "BASEROW_API_TOKEN prüfen.",
                    status_code=response.status_code,
                )
            if response.status_code == 404:
                raise BaserowNotFoundError(f"Nicht gefunden: {url}", status_code=404)
            if response.status_code in _RETRYABLE_STATUS_CODES:
                if attempt > self.max_retries:
                    raise BaserowServerError(
                        f"Baserow API antwortet dauerhaft mit Fehler {response.status_code} ({url})",
                        status_code=response.status_code,
                    )
                self._sleep_before_retry(attempt)
                continue
            if not response.ok:
                raise BaserowAPIError(
                    f"Baserow API-Fehler {response.status_code} für {url}: {response.text}",
                    status_code=response.status_code,
                )
            return response.json()

    @staticmethod
    def _as_list(data: dict | list) -> list:
        if isinstance(data, dict) and "results" in data:
            return data["results"]
        return data

    def list_tables(self, database_id: int) -> list[dict]:
        """GET /api/database/tables/database/{database_id}/ — read-only."""
        return self._as_list(self._request("GET", f"/api/database/tables/database/{database_id}/"))

    def list_fields(self, table_id: int) -> list[dict]:
        """GET /api/database/fields/table/{table_id}/ — read-only."""
        return self._as_list(self._request("GET", f"/api/database/fields/table/{table_id}/"))
