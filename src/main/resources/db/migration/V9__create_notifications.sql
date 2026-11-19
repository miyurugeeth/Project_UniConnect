CREATE TABLE dbo.notifications (
    notification_id UNIQUEIDENTIFIER NOT NULL,
    recipient_user_id UNIQUEIDENTIFIER NOT NULL,
    actor_user_id UNIQUEIDENTIFIER NOT NULL,
    type NVARCHAR(30) NOT NULL,
    message NVARCHAR(1000) NOT NULL,
    link_target NVARCHAR(500),
    is_read BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL,
    read_at DATETIME2,
    CONSTRAINT pk_notifications PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_recipient
        FOREIGN KEY (recipient_user_id) REFERENCES dbo.users (user_id),
    CONSTRAINT fk_notifications_actor
        FOREIGN KEY (actor_user_id) REFERENCES dbo.users (user_id)
);

CREATE INDEX ix_notifications_recipient_created
    ON dbo.notifications (recipient_user_id, created_at, notification_id);

CREATE INDEX ix_notifications_recipient_read_created
    ON dbo.notifications (recipient_user_id, is_read, created_at, notification_id);