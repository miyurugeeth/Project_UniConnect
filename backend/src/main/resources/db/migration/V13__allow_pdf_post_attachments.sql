ALTER TABLE dbo.student_post_attachments
    DROP CONSTRAINT ck_student_post_attachments_media_type;

ALTER TABLE dbo.student_post_attachments
    ADD CONSTRAINT ck_student_post_attachments_media_type
        CHECK (media_type IN ('IMAGE', 'VIDEO', 'PDF'));
