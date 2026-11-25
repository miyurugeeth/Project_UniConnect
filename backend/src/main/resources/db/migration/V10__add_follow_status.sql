ALTER TABLE dbo.student_follows
    ADD status NVARCHAR(20) NOT NULL DEFAULT 'PENDING';

GO

UPDATE dbo.student_follows
SET status = 'ACCEPTED';

GO

CREATE INDEX ix_student_follows_following_status
    ON dbo.student_follows (following_user_id, status, created_at, follow_id);

GO

CREATE INDEX ix_student_follows_follower_status
    ON dbo.student_follows (follower_user_id, status, created_at, follow_id);

GO
