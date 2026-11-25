CREATE TABLE dbo.post_categories (
    category_code VARCHAR(64) NOT NULL,
    display_name NVARCHAR(120) NOT NULL,
    display_order INT NOT NULL,
    is_active BIT NOT NULL
        CONSTRAINT df_post_categories_is_active DEFAULT (1),
    CONSTRAINT pk_post_categories PRIMARY KEY (category_code),
    CONSTRAINT uq_post_categories_display_name UNIQUE (display_name),
    CONSTRAINT ck_post_categories_display_order CHECK (display_order > 0)
);

INSERT INTO dbo.post_categories (category_code, display_name, display_order)
VALUES
    ('ICT_COMPUTING', N'ICT and Computing', 1),
    ('ENGINEERING_TECHNOLOGY', N'Engineering and Technology', 2),
    ('SCIENCE_RESEARCH', N'Science and Research', 3),
    ('BUSINESS_MANAGEMENT', N'Business and Management', 4),
    ('HUMANITIES_SOCIAL_SCIENCES', N'Humanities and Social Sciences', 5),
    ('APPLIED_SCIENCES', N'Applied Sciences', 6),
    ('AGRICULTURE_ENVIRONMENTAL_STUDIES', N'Agriculture and Environmental Studies', 7),
    ('HEALTH_MEDICAL_SCIENCES', N'Health and Medical Sciences', 8),
    ('EDUCATION', N'Education', 9),
    ('GENERAL_UNIVERSITY_LIFE', N'General University Life', 10),
    ('CAREER_INDUSTRY_OPPORTUNITIES', N'Career and Industry Opportunities', 11),
    ('EVENTS_ANNOUNCEMENTS', N'Events and Announcements', 12);

ALTER TABLE dbo.student_posts
    ADD category_code VARCHAR(64) NULL;
GO

UPDATE dbo.student_posts
SET category_code = 'GENERAL_UNIVERSITY_LIFE';

ALTER TABLE dbo.student_posts
    ALTER COLUMN category_code VARCHAR(64) NOT NULL;

ALTER TABLE dbo.student_posts
    ADD CONSTRAINT fk_student_posts_post_categories
        FOREIGN KEY (category_code)
        REFERENCES dbo.post_categories (category_code);

CREATE INDEX ix_student_posts_category_feed
    ON dbo.student_posts (category_code, created_at DESC, post_id DESC);
