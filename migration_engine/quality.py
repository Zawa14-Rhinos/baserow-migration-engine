from dataclasses import dataclass, field

import pandas as pd

from migration_engine.importer import SourceFile


@dataclass
class AnalysisReport:
    entity_name: str
    row_count: int
    encoding: str
    missing_required_columns: list[str] = field(default_factory=list)
    duplicate_key_values: list[str] = field(default_factory=list)
    empty_required_values: dict[str, int] = field(default_factory=dict)
    plugin_findings: dict = field(default_factory=dict)
    open_questions: list[str] = field(default_factory=list)

    @property
    def import_possible(self) -> bool:
        return not self.missing_required_columns


def analyze(source: SourceFile, plugin, rules: dict) -> AnalysisReport:
    df: pd.DataFrame = source.dataframe
    entity_name = plugin.ENTITY_NAME
    required_columns: list[str] = getattr(plugin, "REQUIRED_COLUMNS", [])
    dedup_key: str | None = getattr(plugin, "DEDUPLICATION_KEY", None)

    missing_columns = [c for c in required_columns if c not in df.columns]

    empty_required_values = {}
    for column in required_columns:
        if column in df.columns:
            empty_count = int((df[column].astype(str).str.strip() == "").sum())
            if empty_count:
                empty_required_values[column] = empty_count

    duplicate_key_values: list[str] = []
    if dedup_key and dedup_key in df.columns:
        non_empty = df[df[dedup_key].astype(str).str.strip() != ""]
        counts = non_empty[dedup_key].value_counts()
        duplicate_key_values = counts[counts > 1].index.tolist()

    plugin_findings = plugin.analyze(df, rules) if hasattr(plugin, "analyze") else {}

    open_questions = []
    if entity_name not in rules.get("entities", {}):
        open_questions.append(
            f"Entität '{entity_name}' ist noch nicht in rules.yaml -> entities hinterlegt (keine Ziel-Tabellen-ID bekannt)."
        )

    return AnalysisReport(
        entity_name=entity_name,
        row_count=len(df),
        encoding=source.encoding,
        missing_required_columns=missing_columns,
        duplicate_key_values=duplicate_key_values,
        empty_required_values=empty_required_values,
        plugin_findings=plugin_findings,
        open_questions=open_questions,
    )
