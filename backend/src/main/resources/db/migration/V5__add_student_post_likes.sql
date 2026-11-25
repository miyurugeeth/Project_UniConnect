CREATE TABLE dbo.student_post_likes (
    like_id UNIQUEIDENTIFIER NOT NULL,
    post_id UNIQUEIDENTIFIER NOT NULL,
    student_user_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 NOT NULL,
    CONSTRAINT pk_student_post_likes PRIMARY KEY (like_id),
    CONSTRAINT uq_student_post_likes_post_student
        UNIQUE (post_id, student_user_id),
    CONSTRAINT fk_student_post_likes_posts
        FOREIGN KEY (post_id)
        REFERENCES dbo.student_posts (post_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_student_post_likes_students
        FOREIGN KEY (student_user_id)
        REFERENCES dbo.student_profiles (user_id)
);

CREATE INDEX ix_student_post_likes_student_post
    ON dbo.student_post_likes (student_user_id, post_id);
