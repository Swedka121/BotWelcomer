INSERT INTO Channel(id, selected_template)
VALUES (?, ?)
ON CONFLICT(id) DO UPDATE SET selected_template = excluded.selected_template
