from migration_engine.quality import AnalysisReport
from migration_engine.schema import DatabaseSchema


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


def format_schema_report(schema: DatabaseSchema) -> str:
    lines = ["✔ Verbindung erfolgreich", "", f"{len(schema.tables)} Tabellen gefunden", ""]

    for table in schema.tables:
        lines.append(f"{table.id} {table.name}")
        lines.append(f" • {len(table.fields)} Felder")
        if table.link_row_fields:
            lines.append(f" • {len(table.link_row_fields)} LinkRow-Felder")
        if table.select_fields:
            lines.append(f" • {len(table.select_fields)} Select-Felder ({len(table.multiple_select_fields)} davon Mehrfachauswahl)")
        if table.date_fields:
            lines.append(f" • {len(table.date_fields)} Datumsfelder")
        if table.number_fields:
            lines.append(f" • {len(table.number_fields)} Zahlenfelder")
        if table.boolean_fields:
            lines.append(f" • {len(table.boolean_fields)} Boolesche Felder")
        lines.append("")

    relationships = schema.relationships
    lines.append(f"{len(relationships)} Beziehungen (LinkRow-Verknüpfungen) gefunden")
    for edge in relationships:
        lines.append(f" • {edge.source_table_name} ({edge.source_table_id}) --[{edge.field_name}]--> {edge.target_table_id}")

    return "\n".join(lines).rstrip() + "\n"
