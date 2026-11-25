CREATE TABLE dbo.roles (
    role_code VARCHAR(20) NOT NULL,
    CONSTRAINT pk_roles PRIMARY KEY (role_code),
    CONSTRAINT ck_roles_code CHECK (role_code IN ('STUDENT', 'PROFESSIONAL', 'ADMIN'))
);

INSERT INTO dbo.roles (role_code)
VALUES ('STUDENT'), ('PROFESSIONAL'), ('ADMIN');

CREATE TABLE dbo.users (
    user_id UNIQUEIDENTIFIER NOT NULL,
    full_name NVARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_image_url NVARCHAR(2048) NULL,
    role_code VARCHAR(20) NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT fk_users_roles FOREIGN KEY (role_code) REFERENCES dbo.roles (role_code)
);

CREATE INDEX ix_users_role_code ON dbo.users (role_code);

CREATE TABLE dbo.student_profiles (
    user_id UNIQUEIDENTIFIER NOT NULL,
    university_name NVARCHAR(200) NOT NULL,
    faculty NVARCHAR(150) NOT NULL,
    department_or_field NVARCHAR(150) NOT NULL,
    batch_year INT NOT NULL,
    current_academic_year INT NOT NULL,
    CONSTRAINT pk_student_profiles PRIMARY KEY (user_id),
    CONSTRAINT fk_student_profiles_users FOREIGN KEY (user_id) REFERENCES dbo.users (user_id),
    CONSTRAINT ck_student_profiles_batch_year CHECK (batch_year BETWEEN 1900 AND 2200),
    CONSTRAINT ck_student_profiles_current_academic_year CHECK (current_academic_year BETWEEN 1 AND 20)
);

CREATE TABLE dbo.student_profile_skills (
    user_id UNIQUEIDENTIFIER NOT NULL,
    skill NVARCHAR(80) NOT NULL,
    CONSTRAINT pk_student_profile_skills PRIMARY KEY (user_id, skill),
    CONSTRAINT fk_student_profile_skills_profile
        FOREIGN KEY (user_id) REFERENCES dbo.student_profiles (user_id) ON DELETE CASCADE
);

CREATE TABLE dbo.student_profile_interests (
    user_id UNIQUEIDENTIFIER NOT NULL,
    interest NVARCHAR(80) NOT NULL,
    CONSTRAINT pk_student_profile_interests PRIMARY KEY (user_id, interest),
    CONSTRAINT fk_student_profile_interests_profile
        FOREIGN KEY (user_id) REFERENCES dbo.student_profiles (user_id) ON DELETE CASCADE
);

CREATE TABLE dbo.professional_profiles (
    user_id UNIQUEIDENTIFIER NOT NULL,
    company_name NVARCHAR(200) NOT NULL,
    industry NVARCHAR(120) NOT NULL,
    job_position NVARCHAR(150) NOT NULL,
    CONSTRAINT pk_professional_profiles PRIMARY KEY (user_id),
    CONSTRAINT fk_professional_profiles_users FOREIGN KEY (user_id) REFERENCES dbo.users (user_id)
);

CREATE TABLE dbo.professional_profile_skills (
    user_id UNIQUEIDENTIFIER NOT NULL,
    skill NVARCHAR(80) NOT NULL,
    CONSTRAINT pk_professional_profile_skills PRIMARY KEY (user_id, skill),
    CONSTRAINT fk_professional_profile_skills_profile
        FOREIGN KEY (user_id) REFERENCES dbo.professional_profiles (user_id) ON DELETE CASCADE
);
