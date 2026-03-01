SELECT 
    c.id AS channel_id, 
    w.webhook_url, 
    w.username, 
    w.avatar
FROM 
    Channel c
JOIN 
    Webhook w ON c.changelog_webhook = w.id
WHERE 
    c.changelog_webhook IS NOT NULL;