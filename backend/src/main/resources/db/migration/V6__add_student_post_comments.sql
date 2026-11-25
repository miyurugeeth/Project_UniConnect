CREATE TABLE dbo.student_post_comments (
    comment_id UNIQUEIDENTIFIER NOT NULL,
    post_id UNIQUEIDENTIFIER NOT NULL,
    author_user_id UNIQUEIDENTIFIER NOT NULL,
    content NVARCHAR(2000) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    CONSTRAINT pk_student_post_comments PRIMARY KEY (comment_id),
    CONSTRAINT ck_student_post_comments_content
        CHECK (DATALENGTH(content) <= 4000 AND LEN(LTRIM(RTRIM(content))) > 0),
    CONSTRAINT fk_student_post_comments_posts
        FOREIGN KEY (post_id)
        REFERENCES dbo.student_posts (post_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_student_post_comments_authors
        FOREIGN KEY (author_user_id)
        REFERENCES dbo.student_profiles (user_id)
);

CREATE INDEX ix_student_post_comments_post_created
    ON dbo.student_post_comments (post_id, created_at, comment_id);
