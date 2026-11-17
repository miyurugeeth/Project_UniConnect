package com.uniconnect.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.uniconnect.entity.PostCategory;
import com.uniconnect.entity.PostMediaType;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.StudentPost;
import com.uniconnect.entity.StudentPostAttachment;
import com.uniconnect.entity.StudentPostComment;
import com.uniconnect.entity.StudentPostLike;
import com.uniconnect.entity.StudentProfile;
import com.uniconnect.entity.User;
import com.uniconnect.config.SocialMediaProperties;
import com.uniconnect.service.SocialMediaStorageService;
import com.uniconnect.service.StudentSocialService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.UUID;
import java.util.List;
import org.hibernate.TransientObjectException;
import org.mockito.Mockito;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;

@DataJpaTest(
        properties = {
            "spring.datasource.url=jdbc:h2:mem:student-post-delete;MODE=MSSQLServer;DB_CLOSE_DELAY=-1;INIT=CREATE SCHEMA IF NOT EXISTS dbo",
            "spring.datasource.driver-class-name=org.h2.Driver",
            "spring.datasource.username=sa",
            "spring.datasource.password=",
            "spring.flyway.enabled=false",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "spring.jpa.properties.hibernate.hbm2ddl.create_namespaces=true"
        })
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({StudentSocialService.class, StudentPostDeleteJpaTest.TestBeans.class})
class StudentPostDeleteJpaTest {

    @PersistenceContext private EntityManager entityManager;

    @Autowired private JdbcTemplate jdbcTemplate;

    @Autowired private StudentPostRepository postRepository;

    @Autowired private StudentPostAttachmentRepository attachmentRepository;

    @Autowired private StudentPostLikeRepository likeRepository;

    @Autowired private StudentPostCommentRepository commentRepository;

    @Autowired private StudentSocialService studentSocialService;

    @BeforeEach
    void mirrorPostChildDatabaseCascades() {
        enableDeleteCascade(
                "student_post_attachments", "fk_student_post_attachments_posts");
        enableDeleteCascade("student_post_likes", "fk_student_post_likes_posts");
        enableDeleteCascade("student_post_comments", "fk_student_post_comments_posts");
    }

    @Test
    void deletesPostWithoutLoadedChildrenAndFlushes() {
        PostFixture fixture = persistPost(false, false, false);
        entityManager.clear();

        StudentPost post = postRepository.findWithAuthorById(fixture.postId()).orElseThrow();

        postRepository.delete(post);
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM dbo.student_posts", Integer.class))
                .isZero();
    }

    @Test
    void loadedAttachmentReferencingDeletedPostCausesTransientObjectExceptionAtFlush() {
        PostFixture fixture = persistPost(true, false, false);
        entityManager.clear();

        StudentPost post = postRepository.findWithAuthorById(fixture.postId()).orElseThrow();
        List<StudentPostAttachment> attachments =
                attachmentRepository.findAllByPost_IdOrderByCreatedAtAscIdAsc(fixture.postId());
        assertThat(attachments).hasSize(1);
        assertThat(entityManager.contains(attachments.get(0))).isTrue();

        postRepository.delete(post);
        assertThatThrownBy(entityManager::flush)
                .hasRootCauseInstanceOf(TransientObjectException.class);
    }

    @Test
    void deleteServiceRemovesLoadedAttachmentsBeforeDeletingPost() {
        PostFixture fixture = persistPost(true, false, false);
        entityManager.clear();

        studentSocialService.deletePost(fixture.studentId(), fixture.postId());
        entityManager.flush();

        assertThat(jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM dbo.student_posts", Integer.class))
                .isZero();
        assertThat(jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM dbo.student_post_attachments", Integer.class))
                .isZero();
    }

    @Test
    void loadedLikeReferencingDeletedPostCausesTransientObjectExceptionAtFlush() {
        PostFixture fixture = persistPost(false, true, false);
        entityManager.clear();

        StudentPost post = postRepository.findWithAuthorById(fixture.postId()).orElseThrow();
        StudentPostLike like =
                likeRepository
                        .findByPost_IdAndStudent_Id(fixture.postId(), fixture.studentId())
                        .orElseThrow();
        assertThat(entityManager.contains(like)).isTrue();

        postRepository.delete(post);
        assertThatThrownBy(entityManager::flush)
                .hasRootCauseInstanceOf(TransientObjectException.class);
    }

    @Test
    void loadedCommentReferencingDeletedPostCausesTransientObjectExceptionAtFlush() {
        PostFixture fixture = persistPost(false, false, true);
        entityManager.clear();

        StudentPost post = postRepository.findWithAuthorById(fixture.postId()).orElseThrow();
        List<StudentPostComment> comments =
                commentRepository
                        .findAllByPost_IdOrderByCreatedAtAscIdAsc(
                                fixture.postId(), PageRequest.of(0, 10))
                        .getContent();
        assertThat(comments).hasSize(1);
        assertThat(entityManager.contains(comments.get(0))).isTrue();

        postRepository.delete(post);
        assertThatThrownBy(entityManager::flush)
                .hasRootCauseInstanceOf(TransientObjectException.class);
    }

    private PostFixture persistPost(
            boolean withAttachment, boolean withLike, boolean withComment) {
        Role role = new Role(RoleCode.STUDENT);
        entityManager.persist(role);

        User user = new User("Test Student", "student@example.test", "test-hash", role);
        entityManager.persist(user);

        StudentProfile student =
                new StudentProfile(user, "Test University", "Test Faculty", "Test Field", 2024, 1);
        entityManager.persist(student);

        PostCategory category = new PostCategory("TEST_CATEGORY", "Test category", 1, true);
        entityManager.persist(category);

        StudentPost post = new StudentPost(student, "Disposable test post", null, category);
        entityManager.persist(post);

        if (withAttachment) {
            entityManager.persist(
                    new StudentPostAttachment(
                            post, PostMediaType.IMAGE, "image/png", "test-storage-key", 1));
        }
        if (withLike) {
            entityManager.persist(new StudentPostLike(post, student));
        }
        if (withComment) {
            entityManager.persist(new StudentPostComment(post, student, "Test comment"));
        }

        entityManager.flush();
        return new PostFixture(post.getId(), student.getId());
    }

    private void enableDeleteCascade(String table, String constraint) {
        jdbcTemplate.execute(
                "ALTER TABLE dbo."
                        + table
                        + " DROP CONSTRAINT IF EXISTS "
                        + constraint);
        jdbcTemplate.execute(
                "ALTER TABLE dbo."
                        + table
                        + " ADD CONSTRAINT "
                        + constraint
                        + " FOREIGN KEY (post_id) REFERENCES dbo.student_posts (post_id) ON DELETE CASCADE");
    }

    private record PostFixture(UUID postId, UUID studentId) {}

    @TestConfiguration(proxyBeanMethods = false)
    static class TestBeans {

        @Bean
        SocialMediaProperties socialMediaProperties() {
            return new SocialMediaProperties();
        }

        @Bean
        SocialMediaStorageService socialMediaStorageService() {
            return Mockito.mock(SocialMediaStorageService.class);
        }
    }
}
