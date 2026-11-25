CREATE TABLE dbo.direct_messages (
    message_id UNIQUEIDENTIFIER NOT NULL,
    sender_user_id UNIQUEIDENTIFIER NOT NULL,
    recipient_user_id UNIQUEIDENTIFIER NOT NULL,
    content NVARCHAR(2000) NOT NULL,
    sent_at DATETIME2 NOT NULL,
    CONSTRAINT pk_direct_messages PRIMARY KEY (message_id),
    CONSTRAINT ck_direct_messages_not_self
        CHECK (sender_user_id <> recipient_user_id),
    CONSTRAINT fk_direct_messages_sender
        FOREIGN KEY (sender_user_id) REFERENCES dbo.users (user_id),
    CONSTRAINT fk_direct_messages_recipient
        FOREIGN KEY (recipient_user_id) REFERENCES dbo.users (user_id)
);

CREATE INDEX ix_direct_messages_sender_recipient_sent
    ON dbo.direct_messages (sender_user_id, recipient_user_id, sent_at, message_id);

CREATE INDEX ix_direct_messages_recipient_sender_sent
    ON dbo.direct_messages (recipient_user_id, sender_user_id, sent_at, message_id);
