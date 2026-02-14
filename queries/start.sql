CREATE TABLE IF NOT EXISTS Channel (
    id TEXT NOT NULL,
    welcome_channel TEXT,
    selected_template VARCHAR(255),
    configurator_webhook TEXT,
    welcomer_webhook TEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (configurator_webhook) REFERENCES Webhook(id),
    FOREIGN KEY (welcomer_webhook) REFERENCES Webhook(id)
);

CREATE TABLE IF NOT EXISTS Webhook (
    id TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    avatar TEXT NOT NULL,
    username TEXT NOT NULL,
    PRIMARY KEY (id)
);