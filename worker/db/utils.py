def row_to_dict(cursor, row):
    return dict(zip([desc[0] for desc in cursor.description], row))
