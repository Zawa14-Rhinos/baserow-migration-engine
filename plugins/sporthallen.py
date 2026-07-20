"""Example plugin for a generic 'Sporthallen' (sports facility) entity.

This is a reference implementation showing the plugin contract. Adapt the
column names and checks to your own project's source format.
"""

import re

import pandas as pd

ENTITY_NAME = "sporthallen"
REQUIRED_COLUMNS = ["Name", "Externe Hallen-ID", "Adresse"]
DEDUPLICATION_KEY = "Externe Hallen-ID"

_ADDRESS_WITH_NUMBER = re.compile(r"\d+[a-zA-Z]?$")


def analyze(df: pd.DataFrame, rules: dict) -> dict:
    """Entity-specific checks beyond the generic column/duplicate checks."""
    findings = {}

    if "Adresse" in df.columns:
        addresses = df["Adresse"].astype(str).str.strip()
        splittable = addresses.apply(lambda a: bool(_ADDRESS_WITH_NUMBER.search(a)))
        findings["Adressen mit eindeutigem Hausnummern-Muster"] = f"{int(splittable.sum())}/{len(df)}"

    return findings
