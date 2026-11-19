package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uniconnect.dto.social.PostCategoryResponse;
import com.uniconnect.dto.social.PostLikeResponse;
import com.uniconnect.dto.social.StudentPostCommentRequest;
import com.uniconnect.dto.social.StudentPostCommentResponse;
import com.uniconnect.dto.social.StudentPostRequest;
import com.uniconnect.dto.social.StudentPostResponse;
import com.uniconnect.dto.social.StudentProfileResponse;
import com.uniconnect.dto.social.StudentSummaryResponse;
import com.uniconnect.dto.social.StudentFollowResponse;
import com.uniconnect.dto.notification.NotificationResponse;
import com.uniconnect.entity.PostCategory;
import com.uniconnect.entity.PostMediaType;
import com.uniconnect.entity.ProfessionalProfile;
import com.uniconnect.entity.FollowStatus;
import com.uniconnect.entity.NotificationType;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.StudentPost;
import com.uniconnect.entity.StudentPostAttachment;
import com.uniconnect.entity.StudentPostComment;
import com.uniconnect.entity.StudentPostLike;
import com.uniconnect.entity.StudentFollow;
import com.uniconnect.entity.StudentProfile;
import com.uniconnect.entity.User;
import com.uniconnect.exception.ProfileNotFoundException;
import com.uniconnect.config.SocialMediaProperties;
import com.uniconnect.repository.StudentPostAttachmentRepository;
import com.uniconnect.repository.StudentPostCommentRepository;
import com.uniconnect.repository.StudentPostLikeRepository;
import com.uniconnect.repository.PostCategoryRepository;
import com.uniconnect.repository.StudentPostRepository;
import com.uniconnect.repository.StudentProfileRepository;
import com.uniconnect.repository.ProfessionalProfileRepository;
import com.uniconnect.repository.StudentFollowRepository;
import com.uniconnect.service.NotificationService;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class StudentSocialServiceTest {

    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private ProfessionalProfileRepository professionalProfileRepository;
    @Mock private StudentPostRepository studentPostRepository;
    @Mock private PostCategoryRepository postCategoryRepository;
    @Mock private StudentPostAttachmentRepository attachmentRepository;
    @Mock private StudentPostLikeRepository likeRepository;
    @Mock private StudentPostCommentRepository commentRepository;
    @Mock private StudentFollowRepository followRepository;
    @Mock private SocialMediaStorageService mediaStorageService;
    @Mock private NotificationService notificationService;

    private StudentSocialService studentSocialService;

    @BeforeEach
    void setUp() {
        studentSocialService =
                new StudentSocialService(
                        studentProfileRepository,
                        professionalProfileRepository,
                        studentPostRepository,
                        postCategoryRepository,
                        attachmentRepository,
                        likeRepository,
                        commentRepository,
                        followRepository,
                        mediaStorageService,
                        new SocialMediaProperties(),
                        notificationService);
    }

    @Test
    void returnsStudentProfileAndSearchResultsWithoutAccountSensitiveFields() {
        StudentProfile profile = studentProfile(UUID.randomUUID(), "A Student");
        when(studentProfileRepository.findWithUserById(profile.getId()))
                .thenReturn(Optional.of(profile));
        UUID viewerId = UUID.randomUUID();
        when(followRepository.countByFollowing_Id(profile.getId())).thenReturn(3L);
        when(followRepository.countByFollower_Id(profile.getId())).thenReturn(2L);
        when(followRepository.existsByFollower_IdAndFollowing_Id(viewerId, profile.getId()))
                .thenReturn(true);
        when(studentProfileRepository.searchStudents(eq("Science"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(profile)));

        StudentProfileResponse publicProfile =
                studentSocialService.getStudentProfile(profile.getId(), viewerId);
        Page<StudentSummaryResponse> results =
                studentSocialService.searchStudents(" Science ", 0, 20);

        assertEquals(profile.getId(), publicProfile.id());
        assertEquals("A Student", publicProfile.fullName());
        assertEquals(Set.of("Java"), publicProfile.skills());
        assertEquals(3L, publicProfile.followerCount());
        assertEquals(2L, publicProfile.followingCount());
        assertTrue(publicProfile.followedByCurrentUser());
        assertEquals(1, results.getTotalElements());
        assertEquals("A Student", results.getContent().getFirst().fullName());
    }

    @Test
    void returnsActiveCategoriesInConfiguredOrder() {
        when(postCategoryRepository.findAllByActiveTrueOrderByDisplayOrderAsc())
                .thenReturn(
                        List.of(
                                category("ICT_COMPUTING", "ICT and Computing", 1),
                                category(
                                        "GENERAL_UNIVERSITY_LIFE",
                                        "General University Life",
                                        10)));

        List<PostCategoryResponse> categories = studentSocialService.getCategories();

        assertEquals(2, categories.size());
        assertEquals("ICT_COMPUTING", categories.getFirst().code());
        assertEquals("ICT and Computing", categories.getFirst().displayName());
        assertEquals("GENERAL_UNIVERSITY_LIFE", categories.getLast().code());
    }

    @Test
    void createsPostForAuthenticatedStudentAndUsesCappedFeedPaginationInLatestOrder() {
        UUID studentId = UUID.randomUUID();
        StudentProfile author = studentProfile(studentId, "A Student");
        PostCategory generalCategory =
                category(
                        "GENERAL_UNIVERSITY_LIFE",
                        "General University Life",
                        10);
        when(studentProfileRepository.findWithUserById(studentId))
                .thenReturn(Optional.of(author));
        when(postCategoryRepository.findByCodeAndActiveTrue(generalCategory.getCode()))
                .thenReturn(Optional.of(generalCategory));
        when(studentPostRepository.save(any(StudentPost.class)))
                .thenAnswer(
                        invocation -> {
                            StudentPost post = invocation.getArgument(0);
                            preparePost(post, UUID.randomUUID());
                            return post;
                        });

        StudentPostResponse created =
                studentSocialService.createPost(
                        studentId,
                        new StudentPostRequest(
                                "  Hello students  ",
                                "https://example.test/a.png",
                                generalCategory.getCode()));

        assertEquals("Hello students", created.content());
        assertEquals("https://example.test/a.png", created.imageUrl());
        assertEquals(studentId, created.author().id());
        assertEquals(generalCategory.getCode(), created.category().code());

        when(studentPostRepository.findAll(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(post(author, "Newest"))));
        Page<StudentPostResponse> feed =
                studentSocialService.getFeed(studentId, 1, 200, null);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(studentPostRepository).findAll(pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        assertEquals(1, pageable.getPageNumber());
        assertEquals(50, pageable.getPageSize());
        assertEquals(Sort.Direction.DESC, pageable.getSort().getOrderFor("createdAt").getDirection());
        assertEquals(Sort.Direction.DESC, pageable.getSort().getOrderFor("id").getDirection());
        assertEquals("Newest", feed.getContent().getFirst().content());
        assertEquals("GENERAL_UNIVERSITY_LIFE", feed.getContent().getFirst().category().code());
    }

    @Test
    void filtersFeedByAnActiveCategoryAndRejectsUnknownCategories() {
        UUID studentId = UUID.randomUUID();
        StudentProfile author = studentProfile(studentId, "A Student");
        PostCategory category = category("ICT_COMPUTING", "ICT and Computing", 1);
        StudentPost filteredPost = new StudentPost(author, "Filtered post", null, category);
        preparePost(filteredPost, UUID.randomUUID());
        when(postCategoryRepository.findByCodeAndActiveTrue(category.getCode()))
                .thenReturn(Optional.of(category));
        when(studentPostRepository.findAllByCategory_Code(
                        eq(category.getCode()), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(filteredPost)));

        Page<StudentPostResponse> feed =
                studentSocialService.getFeed(
                        UUID.randomUUID(), 0, 10, " ICT_COMPUTING ");

        assertEquals("Filtered post", feed.getContent().getFirst().content());
        assertEquals(category.getCode(), feed.getContent().getFirst().category().code());
        verify(studentPostRepository)
                .findAllByCategory_Code(eq(category.getCode()), any(Pageable.class));

        when(postCategoryRepository.findByCodeAndActiveTrue("UNKNOWN"))
                .thenReturn(Optional.empty());
        assertThrows(
                ResponseStatusException.class,
                () -> studentSocialService.getFeed(UUID.randomUUID(), 0, 10, "UNKNOWN"));
    }

    @Test
    void allowsOnlyThePostOwnerToUpdateOrDelete() {
        UUID ownerId = UUID.randomUUID();
        UUID otherStudentId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        StudentProfile author = studentProfile(ownerId, "Post Owner");
        StudentPost post = post(author, "Original content");
        ReflectionTestUtils.setField(post, "id", postId);
        when(studentPostRepository.findWithAuthorById(postId)).thenReturn(Optional.of(post));
        when(postCategoryRepository.findByCodeAndActiveTrue("GENERAL_UNIVERSITY_LIFE"))
                .thenReturn(Optional.of(generalCategory()));

        StudentPostResponse updated =
                studentSocialService.updatePost(
                        ownerId,
                        postId,
                        new StudentPostRequest(
                                "Edited content", null, "GENERAL_UNIVERSITY_LIFE"));
        assertEquals("Edited content", updated.content());

        assertThrows(
                AccessDeniedException.class,
                () ->
                        studentSocialService.updatePost(
                                otherStudentId,
                                postId,
                                new StudentPostRequest(
                                        "Not allowed", null, "GENERAL_UNIVERSITY_LIFE")));
        assertThrows(
                AccessDeniedException.class,
                () -> studentSocialService.deletePost(otherStudentId, postId));

        studentSocialService.deletePost(ownerId, postId);
        verify(studentPostRepository).delete(post);
    }

    @Test
    void removesAttachmentsBeforePostAndCleansFilesOnlyAfterCommit() throws IOException {
        UUID ownerId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        StudentPost post = post(studentProfile(ownerId, "Post Owner"), "Temporary test post");
        ReflectionTestUtils.setField(post, "id", postId);
        StudentPostAttachment attachment =
                new StudentPostAttachment(
                        post, PostMediaType.IMAGE, "image/png", "test-storage-key.png", 128);
        when(studentPostRepository.findWithAuthorById(postId)).thenReturn(Optional.of(post));
        when(attachmentRepository.findAllByPost_IdOrderByCreatedAtAscIdAsc(postId))
                .thenReturn(List.of(attachment));

        TransactionSynchronizationManager.initSynchronization();
        try {
            studentSocialService.deletePost(ownerId, postId);
            InOrder deletionOrder = inOrder(attachmentRepository, studentPostRepository);
            deletionOrder
                    .verify(attachmentRepository)
                    .findAllByPost_IdOrderByCreatedAtAscIdAsc(postId);
            deletionOrder.verify(attachmentRepository).deleteAll(List.of(attachment));
            deletionOrder.verify(attachmentRepository).flush();
            deletionOrder.verify(studentPostRepository).delete(post);
            verify(mediaStorageService, never()).delete(anyString());

            var synchronizations = TransactionSynchronizationManager.getSynchronizations();
            assertEquals(1, synchronizations.size());
            synchronizations
                    .getFirst()
                    .afterCompletion(TransactionSynchronization.STATUS_COMMITTED);
            verify(mediaStorageService).delete("test-storage-key.png");
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void rejectsBlankSearchAndInvalidPaginationAndReportsMissingProfiles() {
        assertThrows(
                ResponseStatusException.class,
                () -> studentSocialService.searchStudents(" ", 0, 20));
        assertThrows(
                ResponseStatusException.class,                 () -> studentSocialService.getFeed(UUID.randomUUID(), -1, 20, null));
        assertThrows(
                ResponseStatusException.class,                 () -> studentSocialService.getFeed(UUID.randomUUID(), 0, 0, null));

        UUID missingStudentId = UUID.randomUUID();
        when(studentProfileRepository.findWithUserById(missingStudentId))
                .thenReturn(Optional.empty());
        assertThrows(
                ProfileNotFoundException.class,
                () ->
                        studentSocialService.getStudentProfile(
                                missingStudentId, UUID.randomUUID()));
    }

    @Test
    void rejectsPostCreationWithAnUnknownOrInactiveCategory() {
        UUID studentId = UUID.randomUUID();
        when(studentProfileRepository.findWithUserById(studentId))
                .thenReturn(Optional.of(studentProfile(studentId, "A Student")));
        when(postCategoryRepository.findByCodeAndActiveTrue("INACTIVE_CATEGORY"))
                .thenReturn(Optional.empty());

        assertThrows(
                ResponseStatusException.class,
                () ->
                        studentSocialService.createPost(
                                studentId,
                                new StudentPostRequest(
                                        "Post text", null, "INACTIVE_CATEGORY")));
    }

    @Test
    void likesAreIdempotentAndUseTheAuthenticatedStudent() {
        UUID studentId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        StudentProfile student = studentProfile(studentId, "A Student");
        StudentPost post = post(student, "Post");
        ReflectionTestUtils.setField(post, "id", postId);
        when(studentProfileRepository.findWithUserById(studentId))
                .thenReturn(Optional.of(student));
        when(studentPostRepository.findWithAuthorById(postId)).thenReturn(Optional.of(post));
        when(likeRepository.existsByPost_IdAndActor_Id(postId, studentId))
                .thenReturn(false, true);
        when(likeRepository.countByPost_Id(postId)).thenReturn(1L);

        PostLikeResponse response = studentSocialService.likePost(studentId, postId);
        PostLikeResponse repeatedResponse = studentSocialService.likePost(studentId, postId);

        assertEquals(1L, response.likeCount());
        assertTrue(response.likedByCurrentUser());
        assertEquals(1L, repeatedResponse.likeCount());
        assertTrue(repeatedResponse.likedByCurrentUser());
        ArgumentCaptor<StudentPostLike> likeCaptor =
                ArgumentCaptor.forClass(StudentPostLike.class);
        verify(likeRepository).saveAndFlush(likeCaptor.capture());
        assertEquals(studentId, likeCaptor.getValue().getActor().getId());
        assertEquals(postId, likeCaptor.getValue().getPost().getId());
    }

    @Test
    void professionalsCanPublishAndLikePostsInTheSharedFeed() {
        UUID professionalId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        User professional =
                new User(
                        "A Professional",
                        "professional@example.lk",
                        "not-a-real-password-hash",
                        new Role(RoleCode.PROFESSIONAL));
        ReflectionTestUtils.setField(professional, "id", professionalId);
        ProfessionalProfile profile =
                new ProfessionalProfile(professional, "Example Company", "Technology", "Engineer");
        ReflectionTestUtils.setField(profile, "id", professionalId);
        PostCategory category = generalCategory();
        StudentPost post = new StudentPost(professional, "Professional update", null, category);

        when(professionalProfileRepository.findWithUserById(professionalId))
                .thenReturn(Optional.of(profile));
        when(professionalProfileRepository.findById(professionalId))
                .thenReturn(Optional.of(profile));
        when(postCategoryRepository.findByCodeAndActiveTrue(category.getCode()))
                .thenReturn(Optional.of(category));
        when(studentPostRepository.save(any(StudentPost.class)))
                .thenAnswer(
                        invocation -> {
                            StudentPost savedPost = invocation.getArgument(0);
                            preparePost(savedPost, postId);
                            return savedPost;
                        });
        when(attachmentRepository.findAllByPost_IdOrderByCreatedAtAscIdAsc(postId))
                .thenReturn(List.of());
        when(likeRepository.existsByPost_IdAndActor_Id(postId, professionalId))
                .thenReturn(false);
        when(likeRepository.countByPost_Id(postId)).thenReturn(1L);
        when(commentRepository.countByPost_Id(postId)).thenReturn(0L);
        when(studentPostRepository.findWithAuthorById(postId)).thenReturn(Optional.of(post));

        StudentPostResponse created =
                studentSocialService.createPost(
                        professionalId,
                        new StudentPostRequest(
                                "Professional update", null, category.getCode()));
        PostLikeResponse liked = studentSocialService.likePost(professionalId, postId);

        assertEquals("PROFESSIONAL", created.author().role());
        assertEquals("Example Company", created.author().companyName());
        assertEquals("Professional update", created.content());
        assertTrue(liked.likedByCurrentUser());

        ArgumentCaptor<StudentPostLike> likeCaptor =
                ArgumentCaptor.forClass(StudentPostLike.class);
        verify(likeRepository).saveAndFlush(likeCaptor.capture());
        assertEquals(professionalId, likeCaptor.getValue().getActor().getId());
    }

    @Test
    void commentsAreBoundToAuthenticatedAuthorAndOnlyTheirOwnerCanEditOrDelete() {
        UUID ownerId = UUID.randomUUID();
        UUID otherStudentId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        UUID commentId = UUID.randomUUID();
        StudentProfile owner = studentProfile(ownerId, "Comment Owner");
        StudentPost post = post(owner, "Post");
        ReflectionTestUtils.setField(post, "id", postId);
        StudentPostComment comment = new StudentPostComment(post, owner, "Original comment");
        ReflectionTestUtils.setField(comment, "id", commentId);
        ReflectionTestUtils.setField(
                comment, "createdAt", Instant.parse("2026-01-01T00:00:00Z"));
        ReflectionTestUtils.setField(
                comment, "updatedAt", Instant.parse("2026-01-01T00:00:00Z"));
        when(studentProfileRepository.findWithUserById(ownerId))
                .thenReturn(Optional.of(owner));
        when(studentPostRepository.findWithAuthorById(postId)).thenReturn(Optional.of(post));
        when(commentRepository.save(any(StudentPostComment.class)))
                .thenAnswer(
                        invocation -> {
                            StudentPostComment saved = invocation.getArgument(0);
                            ReflectionTestUtils.setField(saved, "id", commentId);
                            ReflectionTestUtils.setField(
                                    saved, "createdAt", Instant.parse("2026-01-01T00:00:00Z"));
                            ReflectionTestUtils.setField(
                                    saved, "updatedAt", Instant.parse("2026-01-01T00:00:00Z"));
                            return saved;
                        });
        when(commentRepository.findWithAuthorByIdAndPost_Id(commentId, postId))
                .thenReturn(Optional.of(comment));

        StudentPostCommentResponse created =
                studentSocialService.createComment(
                        ownerId, postId, new StudentPostCommentRequest("  New comment  "));
        assertEquals(ownerId, created.author().id());
        assertEquals("New comment", created.content());

        StudentPostCommentResponse updated =
                studentSocialService.updateComment(
                        ownerId,
                        postId,
                        commentId,
                        new StudentPostCommentRequest("Updated comment"));
        assertEquals("Updated comment", updated.content());
        assertThrows(
                AccessDeniedException.class,
                () ->
                        studentSocialService.updateComment(
                                otherStudentId,
                                postId,
                                commentId,
                                new StudentPostCommentRequest("Not allowed")));
        assertThrows(
                AccessDeniedException.class,
                () -> studentSocialService.deleteComment(otherStudentId, postId, commentId));

        studentSocialService.deleteComment(ownerId, postId, commentId);
        verify(commentRepository).delete(comment);
    }

    @Test
    void getsCommentsWithRepositoryOrderingAndUnsortedPageable() {
        UUID authorId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        UUID commentId = UUID.randomUUID();
        StudentProfile author = studentProfile(authorId, "Comment Author");
        StudentPost post = post(author, "Post");
        ReflectionTestUtils.setField(post, "id", postId);
        StudentPostComment comment = new StudentPostComment(post, author, "A comment");
        ReflectionTestUtils.setField(comment, "id", commentId);
        Instant timestamp = Instant.parse("2026-01-01T00:00:00Z");
        ReflectionTestUtils.setField(comment, "createdAt", timestamp);
        ReflectionTestUtils.setField(comment, "updatedAt", timestamp);
        when(studentPostRepository.findWithAuthorById(postId)).thenReturn(Optional.of(post));
        when(commentRepository.findAllByPost_IdOrderByCreatedAtAscIdAsc(
                        eq(postId), any(Pageable.class)))
                .thenReturn(
                        new PageImpl<>(List.of(comment), PageRequest.of(0, 10), 1));

        Page<StudentPostCommentResponse> response =
                studentSocialService.getComments(postId, 0, 10);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(commentRepository)
                .findAllByPost_IdOrderByCreatedAtAscIdAsc(eq(postId), pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();
        assertEquals(0, pageable.getPageNumber());
        assertEquals(10, pageable.getPageSize());
        assertTrue(pageable.getSort().isUnsorted());
        assertEquals(1, response.getTotalElements());
        assertEquals(commentId, response.getContent().getFirst().id());
        assertEquals(postId, response.getContent().getFirst().postId());
        assertEquals(authorId, response.getContent().getFirst().author().id());
    }

    @Test
    void followsUseAuthenticatedIdentityAndAreIdempotent() {
        UUID followerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        StudentProfile follower = studentProfile(followerId, "Follower");
        StudentProfile target = studentProfile(targetId, "Target");
        when(studentProfileRepository.findWithUserById(followerId))
                .thenReturn(Optional.of(follower));
        when(studentProfileRepository.findWithUserById(targetId))
                .thenReturn(Optional.of(target));
        when(followRepository.existsByFollower_IdAndFollowing_Id(followerId, targetId))
                .thenReturn(false, true);
        when(followRepository.countByFollowing_Id(targetId)).thenReturn(1L, 1L, 0L);

        var firstResponse = studentSocialService.followStudent(followerId, targetId);
        var repeatedResponse = studentSocialService.followStudent(followerId, targetId);

        assertTrue(firstResponse.following());
        assertEquals(1L, firstResponse.followerCount());
        assertTrue(repeatedResponse.following());
        ArgumentCaptor<StudentFollow> followCaptor =
                ArgumentCaptor.forClass(StudentFollow.class);
        verify(followRepository).saveAndFlush(followCaptor.capture());
        assertEquals(followerId, followCaptor.getValue().getFollower().getId());
        assertEquals(targetId, followCaptor.getValue().getFollowing().getId());

        when(followRepository.findAllByFollowing_IdOrderByCreatedAtDescIdDesc(
                        eq(targetId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(new StudentFollow(follower, target))));
        when(followRepository.findAllByFollower_IdOrderByCreatedAtDescIdDesc(
                        eq(followerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(new StudentFollow(follower, target))));
        assertEquals(
                "Follower",
                studentSocialService.getFollowers(targetId, 0, 20)
                        .getContent()
                        .getFirst()
                        .fullName());
        assertEquals(
                "Target",
                studentSocialService.getFollowing(followerId, 0, 20)
                        .getContent()
                        .getFirst()
                        .fullName());
        when(followRepository.findByFollower_IdAndFollowing_Id(followerId, targetId))
                .thenReturn(Optional.of(followCaptor.getValue()));
        var unfollowResponse = studentSocialService.unfollowStudent(followerId, targetId);
        assertFalse(unfollowResponse.following());
        assertEquals(0L, unfollowResponse.followerCount());
        verify(followRepository).delete(followCaptor.getValue());

        assertThrows(
                ResponseStatusException.class,
                () -> studentSocialService.followStudent(followerId, followerId));
    }

    @Test
    void acceptFollowFlipsPendingRequestToAcceptedAndNotifiesRequester() {
        UUID requesterId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        StudentProfile requester = studentProfile(requesterId, "Requester");
        StudentProfile recipient = studentProfile(recipientId, "Recipient");
        StudentFollow pendingFollow = new StudentFollow(requester, recipient);
        ReflectionTestUtils.setField(pendingFollow, "id", UUID.randomUUID());

        when(studentProfileRepository.findWithUserById(recipientId))
                .thenReturn(Optional.of(recipient));
        when(studentProfileRepository.findWithUserById(requesterId))
                .thenReturn(Optional.of(requester));
        when(followRepository.findByFollower_IdAndFollowing_IdAndStatus(
                        eq(requesterId), eq(recipientId), eq(FollowStatus.PENDING)))
                .thenReturn(Optional.of(pendingFollow));
        when(followRepository.countByFollowing_IdAndStatus(recipientId, FollowStatus.ACCEPTED))
                .thenReturn(1L);
        when(notificationService.createNotification(
                        eq(requesterId), eq(recipientId), eq(NotificationType.FOLLOW_ACCEPTED),
                        anyString(), anyString()))
                .thenReturn(
                        new NotificationResponse(
                                UUID.randomUUID(),
                                "FOLLOW_ACCEPTED",
                                "Recipient accepted your follow request.",
                                "/student/profiles/" + recipientId,
                                false,
                                Instant.now(),
                                recipientId,
                                "Recipient",
                                null));

        StudentFollowResponse response = studentSocialService.acceptFollow(recipientId, requesterId);

        assertTrue(response.following());
        assertEquals(1L, response.followerCount());
        assertEquals(FollowStatus.ACCEPTED, pendingFollow.getStatus());
        verify(followRepository).saveAndFlush(pendingFollow);
        verify(notificationService)
                .createNotification(
                        eq(requesterId),
                        eq(recipientId),
                        eq(NotificationType.FOLLOW_ACCEPTED),
                        anyString(),
                        anyString());
    }

    @Test
    void acceptFollowThrowsWhenNoPendingRequestExists() {
        UUID requesterId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();
        when(studentProfileRepository.findWithUserById(recipientId))
                .thenReturn(Optional.of(studentProfile(recipientId, "Recipient")));
        when(studentProfileRepository.findWithUserById(requesterId))
                .thenReturn(Optional.of(studentProfile(requesterId, "Requester")));
        when(followRepository.findByFollower_IdAndFollowing_IdAndStatus(
                        eq(requesterId), eq(recipientId), eq(FollowStatus.PENDING)))
                .thenReturn(Optional.empty());

        assertThrows(
                ResponseStatusException.class,
                () -> studentSocialService.acceptFollow(recipientId, requesterId));
    }

    @Test
    void getFollowRequestsReturnsPendingIncomingRequests() {
        UUID recipientId = UUID.randomUUID();
        UUID requesterId = UUID.randomUUID();
        StudentProfile recipient = studentProfile(recipientId, "Recipient");
        StudentProfile requester = studentProfile(requesterId, "Requester");
        StudentFollow pendingFollow = new StudentFollow(requester, recipient);

        when(studentProfileRepository.findWithUserById(recipientId))
                .thenReturn(Optional.of(recipient));
        when(followRepository.findAllByFollowing_IdAndStatusOrderByCreatedAtDescIdDesc(
                        eq(recipientId), eq(FollowStatus.PENDING), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(pendingFollow), PageRequest.of(0, 20), 1));

        Page<StudentSummaryResponse> requests =
                studentSocialService.getFollowRequests(recipientId, 0, 20);

        assertEquals(1, requests.getTotalElements());
        assertEquals(requesterId, requests.getContent().getFirst().id());
    }

    private static StudentProfile studentProfile(UUID id, String fullName) {
        User user =
                new User(
                        fullName,
                        "student@example.lk",
                        "not-a-real-password-hash",
                        new Role(RoleCode.STUDENT));
        ReflectionTestUtils.setField(user, "id", id);
        StudentProfile profile =
                new StudentProfile(
                        user, "University of Colombo", "Science", "Computer Science", 2024, 2);
        ReflectionTestUtils.setField(profile, "id", id);
        profile.getSkills().add("Java");
        profile.getInterests().add("AI");
        return profile;
    }

    private static StudentPost post(StudentProfile author, String content) {
        StudentPost post = new StudentPost(author, content, null, generalCategory());
        preparePost(post, UUID.randomUUID());
        return post;
    }

    private static PostCategory generalCategory() {
        return category("GENERAL_UNIVERSITY_LIFE", "General University Life", 10);
    }

    private static PostCategory category(String code, String displayName, int displayOrder) {
        return new PostCategory(code, displayName, displayOrder, true);
    }

    private static void preparePost(StudentPost post, UUID id) {
        ReflectionTestUtils.setField(post, "id", id);
        ReflectionTestUtils.setField(post, "createdAt", Instant.parse("2026-01-01T00:00:00Z"));
        ReflectionTestUtils.setField(post, "updatedAt", Instant.parse("2026-01-01T00:00:00Z"));
    }
}
