"""Internal, Baserow-version-agnostic schema model.

Built from the raw JSON that BaserowClient.list_tables()/list_fields() return.
Field access uses .get() defensively throughout, since not every Baserow
deployment/version exposes every key (e.g. `description` on tables).
"""

from dataclasses import dataclass, field

LINK_ROW_TYPE = "link_row"
SINGLE_SELECT_TYPE = "single_select"
MULTIPLE_SELECT_TYPE = "multiple_select"
DATE_TYPES = {"date", "created_on", "last_modified"}
NUMBER_TYPES = {"number", "rating", "duration"}
BOOLEAN_TYPE = "boolean"


@dataclass
class FieldSchema:
    id: int
    name: str
    type: str
    order: int = 0
    required: bool = False
    primary: bool = False
    select_options: list[dict] = field(default_factory=list)
    link_row_table_id: int | None = None

    @property
    def is_link_row(self) -> bool:
        return self.type == LINK_ROW_TYPE

    @property
    def is_select(self) -> bool:
        return self.type in (SINGLE_SELECT_TYPE, MULTIPLE_SELECT_TYPE)

    @property
    def is_multiple_select(self) -> bool:
        return self.type == MULTIPLE_SELECT_TYPE

    @property
    def is_date(self) -> bool:
        return self.type in DATE_TYPES

    @property
    def is_number(self) -> bool:
        return self.type in NUMBER_TYPES

    @property
    def is_boolean(self) -> bool:
        return self.type == BOOLEAN_TYPE


def parse_field(raw: dict) -> FieldSchema:
    return FieldSchema(
        id=raw["id"],
        name=raw["name"],
        type=raw["type"],
        order=raw.get("order", 0),
        required=bool(raw.get("required", False)),
        primary=bool(raw.get("primary", False)),
        select_options=raw.get("select_options") or [],
        link_row_table_id=raw.get("link_row_table_id"),
    )


@dataclass
class TableSchema:
    id: int
    name: str
    order: int = 0
    description: str | None = None
    fields: list[FieldSchema] = field(default_factory=list)

    @property
    def link_row_fields(self) -> list[FieldSchema]:
        return [f for f in self.fields if f.is_link_row]

    @property
    def select_fields(self) -> list[FieldSchema]:
        return [f for f in self.fields if f.is_select]

    @property
    def multiple_select_fields(self) -> list[FieldSchema]:
        return [f for f in self.fields if f.is_multiple_select]

    @property
    def date_fields(self) -> list[FieldSchema]:
        return [f for f in self.fields if f.is_date]

    @property
    def number_fields(self) -> list[FieldSchema]:
        return [f for f in self.fields if f.is_number]

    @property
    def boolean_fields(self) -> list[FieldSchema]:
        return [f for f in self.fields if f.is_boolean]


def parse_table(raw_table: dict, raw_fields: list[dict]) -> TableSchema:
    return TableSchema(
        id=raw_table["id"],
        name=raw_table["name"],
        order=raw_table.get("order", 0),
        description=raw_table.get("description"),
        fields=[parse_field(f) for f in raw_fields],
    )


@dataclass
class RelationshipEdge:
    source_table_id: int
    source_table_name: str
    field_name: str
    target_table_id: int


@dataclass
class DatabaseSchema:
    database_id: int
    tables: list[TableSchema] = field(default_factory=list)

    @property
    def relationships(self) -> list[RelationshipEdge]:
        edges = []
        for table in self.tables:
            for f in table.link_row_fields:
                if f.link_row_table_id is not None:
                    edges.append(
                        RelationshipEdge(
                            source_table_id=table.id,
                            source_table_name=table.name,
                            field_name=f.name,
                            target_table_id=f.link_row_table_id,
                        )
                    )
        return edges


def build_schema(client, database_id: int) -> DatabaseSchema:
    """Read-only: only calls client.list_tables()/client.list_fields() (both GET).

    `client` only needs to implement list_tables(database_id) and
    list_fields(table_id) — any object with that interface works, which
    keeps this function easy to unit-test without a real BaserowClient.
    """
    raw_tables = client.list_tables(database_id)
    tables = [
        parse_table(raw_table, client.list_fields(raw_table["id"]))
        for raw_table in sorted(raw_tables, key=lambda t: t.get("order", 0))
    ]
    return DatabaseSchema(database_id=database_id, tables=tables)
