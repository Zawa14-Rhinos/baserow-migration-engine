from pathlib import Path

from migration_engine.engine import analyze_file

REPO_ROOT = Path(__file__).resolve().parent.parent
SAMPLE_CSV = REPO_ROOT / "sample_data" / "sporthallen_sample.csv"
EXAMPLE_RULES = REPO_ROOT / "config" / "rules.example.yaml"


def test_analyze_sporthallen_sample():
    report = analyze_file(SAMPLE_CSV, EXAMPLE_RULES)

    assert report.entity_name == "sporthallen"
    assert report.row_count == 10
    assert report.missing_required_columns == []
    assert report.duplicate_key_values == ["H001"]
    assert report.empty_required_values == {"Externe Hallen-ID": 1}
    assert report.plugin_findings["Adressen mit eindeutigem Hausnummern-Muster"] == "8/10"
    assert any("entities" in q for q in report.open_questions)
    assert report.import_possible is True
