INSERT INTO Webhook(id, webhook_url, avatar, username)
VALUES (?,?,?,?)
ON CONFLICT(id) DO UPDATE SET webhook_url = excluded.webhook_url, avatar = excluded.avatar, username = excluded.username