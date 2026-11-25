ALTER TABLE dbo.student_posts
    DROP CONSTRAINT fk_student_posts_student_profiles;

ALTER TABLE dbo.student_posts
    ADD CONSTRAINT fk_student_posts_users
        FOREIGN KEY (author_user_id)
        REFERENCES dbo.users (user_id)
        ON DELETE CASCADE;

ALTER TABLE dbo.student_post_likes
    DROP CONSTRAINT fk_student_post_likes_students;

ALTER TABLE dbo.student_post_likes
    ADD CONSTRAINT fk_student_post_likes_users
        FOREIGN KEY (student_user_id)
        REFERENCES dbo.users (user_id);

ALTER TABLE dbo.student_post_comments
    DROP CONSTRAINT fk_student_post_comments_authors;

ALTER TABLE dbo.student_post_comments
    ADD CONSTRAINT fk_student_post_comments_users
        FOREIGN KEY (author_user_id)
        REFERENCES dbo.users (user_id);
