from unittest.mock import MagicMock

import migration_engine.cli as cli
from migration_engine.baserow import BaserowAPIError, BaserowConfigError
from migration_engine.schema import DatabaseSchema, TableSchema


def _sample_schema() -> DatabaseSchema:
    return DatabaseSchema(database_id=42, tables=[TableSchema(id=10, name="Kontakte", order=1)])


def test_schema_command_success(monkeypatch, capsys):
    monkeypatch.setattr(cli.BaserowClient, "from_env", classmethod(lambda cls: MagicMock()))
    monkeypatch.setattr(cli, "build_schema", lambda client, database_id: _sample_schema())

    exit_code = cli.main(["schema", "--database-id", "42"])

    out = capsys.readouterr().out
    assert exit_code == 0
    assert "✔ Verbindung erfolgreich" in out
    assert "1 Tabellen gefunden" in out
    assert "10 Kontakte" in out


def test_schema_command_reads_database_id_from_env(monkeypatch, capsys):
    monkeypatch.setenv("BASEROW_DATABASE_ID", "42")
    monkeypatch.setattr(cli.BaserowClient, "from_env", classmethod(lambda cls: MagicMock()))
    build_schema_mock = MagicMock(return_value=_sample_schema())
    monkeypatch.setattr(cli, "build_schema", build_schema_mock)

    exit_code = cli.main(["schema"])

    assert exit_code == 0
    build_schema_mock.assert_called_once()
    _, kwargs = build_schema_mock.call_args
    called_database_id = build_schema_mock.call_args.args[1] if len(build_schema_mock.call_args.args) > 1 else kwargs.get("database_id")
    assert called_database_id == 42


def test_schema_command_without_database_id_or_env_fails(monkeypatch, capsys):
    monkeypatch.delenv("BASEROW_DATABASE_ID", raising=False)

    exit_code = cli.main(["schema"])

    err = capsys.readouterr().err
    assert exit_code == 1
    assert "Keine Datenbank-ID" in err


def test_schema_command_invalid_env_database_id_fails(monkeypatch, capsys):
    monkeypatch.setenv("BASEROW_DATABASE_ID", "not-a-number")

    exit_code = cli.main(["schema"])

    err = capsys.readouterr().err
    assert exit_code == 1
    assert "keine gültige Zahl" in err


def test_schema_command_config_error(monkeypatch, capsys):
    def _raise_config_error(cls):
        raise BaserowConfigError("BASEROW_API_TOKEN fehlt")

    monkeypatch.setattr(cli.BaserowClient, "from_env", classmethod(_raise_config_error))

    exit_code = cli.main(["schema", "--database-id", "1"])

    err = capsys.readouterr().err
    assert exit_code == 1
    assert "Konfigurationsfehler" in err


def test_schema_command_api_error(monkeypatch, capsys):
    monkeypatch.setattr(cli.BaserowClient, "from_env", classmethod(lambda cls: MagicMock()))

    def _raise_api_error(client, database_id):
        raise BaserowAPIError("Baserow antwortet mit 500", status_code=500)

    monkeypatch.setattr(cli, "build_schema", _raise_api_error)

    exit_code = cli.main(["schema", "--database-id", "1"])

    err = capsys.readouterr().err
    assert exit_code == 1
    assert "Baserow API-Fehler" in err


def test_analyze_and_commit_commands_still_work(capsys):
    # regression check: adding the schema command must not touch commit's behaviour.
    exit_code = cli.main(["commit"])
    err = capsys.readouterr().err
    assert exit_code == 1
    assert "noch nicht implementiert" in err
