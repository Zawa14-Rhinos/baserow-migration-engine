import argparse
import sys
from pathlib import Path

from migration_engine.engine import analyze_file
from migration_engine.report import format_report

DEFAULT_RULES_PATH = Path("config/rules.yaml")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="migration")
    parser.add_argument("--rules", type=Path, default=DEFAULT_RULES_PATH, help="Pfad zur rules.yaml")
    subparsers = parser.add_subparsers(dest="command", required=True)

    analyze_parser = subparsers.add_parser("analyze", help="Quelldatei analysieren, ohne zu schreiben")
    analyze_parser.add_argument("csv_path", type=Path)

    commit_parser = subparsers.add_parser("commit", help="Freigegebenen Import schreiben (Phase 2)")
    commit_parser.add_argument("csv_path", type=Path, nargs="?")

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

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
