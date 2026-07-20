from dataclasses import dataclass
from pathlib import Path

import pandas as pd

_ENCODING_CANDIDATES = ["utf-8", "utf-8-sig", "latin-1"]


@dataclass
class SourceFile:
    path: Path
    encoding: str
    dataframe: pd.DataFrame


def read_source_file(path: Path) -> SourceFile:
    """Read a CSV source file, trying UTF-8 first and falling back on decode errors."""
    last_error: UnicodeDecodeError | None = None
    for encoding in _ENCODING_CANDIDATES:
        try:
            df = pd.read_csv(path, encoding=encoding, dtype=str, keep_default_na=False)
            return SourceFile(path=path, encoding=encoding, dataframe=df)
        except UnicodeDecodeError as exc:
            last_error = exc
            continue
    raise ValueError(f"Konnte {path} mit keiner der Kodierungen {_ENCODING_CANDIDATES} lesen") from last_error
