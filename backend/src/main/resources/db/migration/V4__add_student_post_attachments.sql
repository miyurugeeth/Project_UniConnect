CREATE TABLE dbo.student_post_attachments (
    attachment_id UNIQUEIDENTIFIER NOT NULL,
    post_id UNIQUEIDENTIFIER NOT NULL,
    media_type VARCHAR(10) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    storage_key VARCHAR(80) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL,
    CONSTRAINT pk_student_post_attachments PRIMARY KEY (attachment_id),
    CONSTRAINT uq_student_post_attachments_storage_key UNIQUE (storage_key),
    CONSTRAINT ck_student_post_attachments_media_type
        CHECK (media_type IN ('IMAGE', 'VIDEO')),
    CONSTRAINT ck_student_post_attachments_file_size
        CHECK (file_size_bytes > 0),
    CONSTRAINT fk_student_post_attachments_posts
        FOREIGN KEY (post_id)
        REFERENCES dbo.student_posts (post_id)
        ON DELETE CASCADE
);

CREATE INDEX ix_student_post_attachments_post_created
    ON dbo.student_post_attachments (post_id, created_at, attachment_id);
