INSERT INTO Channel(id, welcome_channel)
VALUES (?, ?)
ON CONFLICT(id) DO UPDATE SET welcome_channel = excluded.welcome_channel
