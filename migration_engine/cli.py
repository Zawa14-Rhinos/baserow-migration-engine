import argparse
import os
import sys
from pathlib import Path

from migration_engine.baserow import BaserowAPIError, BaserowClient, BaserowConfigError
from migration_engine.engine import analyze_file
from migration_engine.report import format_report, format_schema_report
from migration_engine.schema import build_schema

DEFAULT_RULES_PATH = Path("config/rules.yaml")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="migration")
    parser.add_argument("--rules", type=Path, default=DEFAULT_RULES_PATH, help="Pfad zur rules.yaml")
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze_parser = subparsers.add_parser("analyze", help="Quelldatei analysieren, ohne zu schreiben")
    analyze_parser.add_argument("csv_path", type=Path)

    commit_parser = subparsers.add_parser("commit", help="Freigegebenen Import schreiben (Phase 2)")
    commit_parser.add_argument("csv_path", type=Path, nargs="?")

    schema_parser = subparsers.add_parser(
        "schema", help="Baserow-Schema lesen und zusammenfassen (read-only, keine Schreibzugriffe)"
    )
    schema_parser.add_argument(
        "--database-id",
        type=int,
        default=None,
        help="Datenbank-ID (Default: Umgebungsvariable BASEROW_DATABASE_ID). "
        "API-Zugangsdaten kommen ausschließlich aus BASEROW_API_TOKEN / BASEROW_API_URL.",
    )

    args = parser.parse_args(argv)

    if args.command == "analyze":
        if not args.rules.exists():
            print(f"rules.yaml nicht gefunden unter {args.rules} (config/rules.example.yaml kopieren und anpassen).", file=sys.stderr)
            return 1
        report = analyze_file(args.csv_path, args.rules)
        print(format_report(report))
        return 0 if report.import_possible else 1

    if args.command == "commit":
        print("commit ist noch nicht implementiert (Phase 2 der Roadmap: Baserow API, Mapping, Dublettenprüfung, Commit).", file=sys.stderr)
        return 1

    if args.command == "schema":
        return _run_schema(args)

    return 1


def _run_schema(args) -> int:
    database_id = args.database_id
    if database_id is None:
        raw_database_id = os.environ.get("BASEROW_DATABASE_ID")
        if not raw_database_id:
            print(
                "Keine Datenbank-ID angegeben. --database-id setzen oder BASEROW_DATABASE_ID exportieren.",
                file=sys.stderr,
            )
            return 1
        try:
            database_id = int(raw_database_id)
        except ValueError:
            print(f"BASEROW_DATABASE_ID ist keine gültige Zahl: '{raw_database_id}'", file=sys.stderr)
            return 1

    try:
        client = BaserowClient.from_env()
        schema = build_schema(client, database_id)
    except BaserowConfigError as exc:
        print(f"Konfigurationsfehler: {exc}", file=sys.stderr)
        return 1
    except BaserowAPIError as exc:
        print(f"Baserow API-Fehler: {exc}", file=sys.stderr)
        return 1

    print(format_schema_report(schema))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
