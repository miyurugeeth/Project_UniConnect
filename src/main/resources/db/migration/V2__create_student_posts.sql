CREATE TABLE dbo.student_posts (
    post_id UNIQUEIDENTIFIER NOT NULL,
    author_user_id UNIQUEIDENTIFIER NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    image_url NVARCHAR(2048) NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    CONSTRAINT pk_student_posts PRIMARY KEY (post_id),
    CONSTRAINT fk_student_posts_student_profiles
        FOREIGN KEY (author_user_id)
        REFERENCES dbo.student_profiles (user_id)
        ON DELETE CASCADE
);

CREATE INDEX ix_student_posts_feed
    ON dbo.student_posts (created_at DESC, post_id DESC);

CREATE INDEX ix_student_posts_author_created_at
    ON dbo.student_posts (author_user_id, created_at DESC);
