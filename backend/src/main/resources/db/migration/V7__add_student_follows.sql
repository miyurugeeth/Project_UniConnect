CREATE TABLE dbo.student_follows (
    follow_id UNIQUEIDENTIFIER NOT NULL,
    follower_user_id UNIQUEIDENTIFIER NOT NULL,
    following_user_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 NOT NULL,
    CONSTRAINT pk_student_follows PRIMARY KEY (follow_id),
    CONSTRAINT uq_student_follows_follower_following
        UNIQUE (follower_user_id, following_user_id),
    CONSTRAINT ck_student_follows_not_self
        CHECK (follower_user_id <> following_user_id),
    CONSTRAINT fk_student_follows_follower
        FOREIGN KEY (follower_user_id)
        REFERENCES dbo.student_profiles (user_id),
    CONSTRAINT fk_student_follows_following
        FOREIGN KEY (following_user_id)
        REFERENCES dbo.student_profiles (user_id)
);

CREATE INDEX ix_student_follows_following_created
    ON dbo.student_follows (following_user_id, created_at, follow_id);

CREATE INDEX ix_student_follows_follower_created
    ON dbo.student_follows (follower_user_id, created_at, follow_id);
