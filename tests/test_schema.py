from migration_engine.schema import build_schema, parse_field, parse_table


def test_parse_field_basic_text_field():
    f = parse_field({"id": 1, "name": "Name", "type": "text", "order": 1, "primary": True})
    assert f.id == 1
    assert f.primary is True
    assert f.is_link_row is False
    assert f.is_select is False


def test_parse_field_link_row():
    f = parse_field({"id": 2, "name": "Zugehörige Tabelle", "type": "link_row", "order": 2, "link_row_table_id": 20})
    assert f.is_link_row is True
    assert f.link_row_table_id == 20


def test_parse_field_single_select_with_options():
    f = parse_field(
        {
            "id": 3,
            "name": "Status",
            "type": "single_select",
            "order": 3,
            "select_options": [{"id": 1, "value": "offen", "color": "green"}],
        }
    )
    assert f.is_select is True
    assert f.is_multiple_select is False
    assert len(f.select_options) == 1


def test_parse_field_multiple_select_date_number_boolean():
    assert parse_field({"id": 4, "name": "Tags", "type": "multiple_select", "order": 4}).is_multiple_select
    assert parse_field({"id": 5, "name": "Datum", "type": "date", "order": 5}).is_date
    assert parse_field({"id": 6, "name": "Anzahl", "type": "number", "order": 6}).is_number
    assert parse_field({"id": 7, "name": "Aktiv", "type": "boolean", "order": 7}).is_boolean


def test_parse_field_required_defaults_to_false_when_absent():
    f = parse_field({"id": 8, "name": "Notiz", "type": "long_text", "order": 8})
    assert f.required is False


def test_parse_table_builds_field_list():
    raw_table = {"id": 10, "name": "Kontakte", "order": 1, "description": "Beispieltabelle"}
    raw_fields = [
        {"id": 1, "name": "Name", "type": "text", "order": 1, "primary": True},
        {"id": 2, "name": "Firma", "type": "link_row", "order": 2, "link_row_table_id": 20},
    ]
    table = parse_table(raw_table, raw_fields)
    assert table.name == "Kontakte"
    assert table.description == "Beispieltabelle"
    assert len(table.fields) == 2
    assert len(table.link_row_fields) == 1


class _FakeClient:
    """Implements only the two read methods build_schema() needs."""

    def __init__(self, tables: list[dict], fields_by_table: dict[int, list[dict]]):
        self._tables = tables
        self._fields_by_table = fields_by_table

    def list_tables(self, database_id: int) -> list[dict]:
        return self._tables

    def list_fields(self, table_id: int) -> list[dict]:
        return self._fields_by_table[table_id]


def test_build_schema_orders_tables_and_derives_relationships():
    tables = [
        {"id": 20, "name": "Firmen", "order": 2},
        {"id": 10, "name": "Kontakte", "order": 1},
    ]
    fields_by_table = {
        10: [
            {"id": 1, "name": "Name", "type": "text", "order": 1, "primary": True},
            {"id": 2, "name": "Firma", "type": "link_row", "order": 2, "link_row_table_id": 20},
        ],
        20: [{"id": 3, "name": "Firmenname", "type": "text", "order": 1, "primary": True}],
    }
    client = _FakeClient(tables, fields_by_table)

    schema = build_schema(client, database_id=999)

    assert schema.database_id == 999
    # sorted by `order`, not by the order returned from the (fake) API
    assert [t.name for t in schema.tables] == ["Kontakte", "Firmen"]

    kontakte = schema.tables[0]
    assert len(kontakte.link_row_fields) == 1

    relationships = schema.relationships
    assert len(relationships) == 1
    assert relationships[0].source_table_name == "Kontakte"
    assert relationships[0].field_name == "Firma"
    assert relationships[0].target_table_id == 20


def test_table_schema_field_category_counts():
    tables = [{"id": 30, "name": "Beispiel", "order": 1}]
    fields_by_table = {
        30: [
            {"id": 1, "name": "Name", "type": "text", "order": 1, "primary": True},
            {"id": 2, "name": "Kategorie", "type": "single_select", "order": 2},
            {"id": 3, "name": "Tags", "type": "multiple_select", "order": 3},
            {"id": 4, "name": "Datum", "type": "date", "order": 4},
            {"id": 5, "name": "Anzahl", "type": "number", "order": 5},
            {"id": 6, "name": "Aktiv", "type": "boolean", "order": 6},
        ]
    }
    client = _FakeClient(tables, fields_by_table)
    schema = build_schema(client, database_id=1)
    table = schema.tables[0]

    assert len(table.select_fields) == 2  # single_select + multiple_select
    assert len(table.multiple_select_fields) == 1
    assert len(table.date_fields) == 1
    assert len(table.number_fields) == 1
    assert len(table.boolean_fields) == 1
