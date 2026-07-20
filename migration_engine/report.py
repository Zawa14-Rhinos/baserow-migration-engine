from migration_engine.quality import AnalysisReport


def format_report(report: AnalysisReport) -> str:
    lines = [f"✔ {report.row_count} Datensätze", f"✔ Kodierung: {report.encoding}"]

    if report.missing_required_columns:
        lines.append(f"✗ fehlende Pflichtspalten: {', '.join(report.missing_required_columns)}")
    else:
        lines.append("✔ alle Pflichtspalten vorhanden")

    if report.duplicate_key_values:
        lines.append(f"⚠ {len(report.duplicate_key_values)} doppelte Schlüsselwerte in der Quelldatei: {', '.join(report.duplicate_key_values[:10])}")
    else:
        lines.append("✔ keine doppelten Schlüsselwerte in der Quelldatei")

    for column, count in report.empty_required_values.items():
        lines.append(f"⚠ {count} leere Werte in Pflichtspalte '{column}'")

    for key, value in report.plugin_findings.items():
        lines.append(f"✔ {key}: {value}")

    for question in report.open_questions:
        lines.append(f"⚠ {question}")

    lines.append("")
    lines.append("Import möglich." if report.import_possible else "Import NICHT möglich — fehlende Pflichtspalten zuerst klären.")
    return "\n".join(lines)
