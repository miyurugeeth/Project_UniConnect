package com.uniconnect.service;

import com.uniconnect.config.SocialMediaProperties;
import com.uniconnect.dto.social.PostAttachmentResponse;
import com.uniconnect.dto.social.PostAuthorResponse;
import com.uniconnect.dto.social.PostCommentAggregate;
import com.uniconnect.dto.social.PostCategoryResponse;
import com.uniconnect.dto.social.PostLikeAggregate;
import com.uniconnect.dto.social.PostLikeResponse;
import com.uniconnect.dto.social.StudentPostCommentRequest;
import com.uniconnect.dto.social.StudentPostCommentResponse;
import com.uniconnect.dto.social.StudentPostRequest;
import com.uniconnect.dto.social.StudentPostResponse;
import com.uniconnect.dto.social.StudentFollowResponse;
import com.uniconnect.dto.social.StudentProfileResponse;
import com.uniconnect.dto.social.StudentSummaryResponse;
import com.uniconnect.entity.PostCategory;
import com.uniconnect.entity.PostMediaType;
import com.uniconnect.entity.FollowStatus;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.StudentPost;
import com.uniconnect.entity.StudentPostAttachment;
import com.uniconnect.entity.StudentPostComment;
import com.uniconnect.entity.StudentPostLike;
import com.uniconnect.entity.StudentFollow;
import com.uniconnect.entity.StudentProfile;
import com.uniconnect.entity.ProfessionalProfile;
import com.uniconnect.entity.User;
import com.uniconnect.entity.NotificationType;
import com.uniconnect.exception.ProfileNotFoundException;
import com.uniconnect.repository.PostCategoryRepository;
import com.uniconnect.repository.StudentPostAttachmentRepository;
import com.uniconnect.repository.StudentPostCommentRepository;
import com.uniconnect.repository.StudentPostLikeRepository;
import com.uniconnect.repository.StudentPostRepository;
import com.uniconnect.repository.StudentProfileRepository;
import com.uniconnect.repository.ProfessionalProfileRepository;
import com.uniconnect.repository.StudentFollowRepository;
import com.uniconnect.repository.UserRepository;
import com.uniconnect.service.NotificationService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentSocialService {

    private static final Logger LOGGER = LoggerFactory.getLogger(StudentSocialService.class);
    private static final int MAX_PAGE_SIZE = 50;

    private final StudentProfileRepository studentProfileRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final StudentPostRepository studentPostRepository;
    private final PostCategoryRepository postCategoryRepository;
    private final StudentPostAttachmentRepository attachmentRepository;
    private final StudentPostLikeRepository likeRepository;
    private final StudentPostCommentRepository commentRepository;
    private final StudentFollowRepository followRepository;
    private final UserRepository userRepository;
    private final SocialMediaStorageService mediaStorageService;
    private final SocialMediaProperties mediaProperties;
    private final NotificationService notificationService;

    public StudentSocialService(
            StudentProfileRepository studentProfileRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            StudentPostRepository studentPostRepository,
            PostCategoryRepository postCategoryRepository,
            StudentPostAttachmentRepository attachmentRepository,
            StudentPostLikeRepository likeRepository,
            StudentPostCommentRepository commentRepository,
            StudentFollowRepository followRepository,
            UserRepository userRepository,
            SocialMediaStorageService mediaStorageService,
            SocialMediaProperties mediaProperties,
            NotificationService notificationService) {
        this.studentProfileRepository = studentProfileRepository;
        this.professionalProfileRepository = professionalProfileRepository;
        this.studentPostRepository = studentPostRepository;
        this.postCategoryRepository = postCategoryRepository;
        this.attachmentRepository = attachmentRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.followRepository = followRepository;
        this.userRepository = userRepository;
        this.mediaStorageService = mediaStorageService;
        this.mediaProperties = mediaProperties;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getStudentProfile(
            UUID studentId, UUID currentStudentId) {
        StudentProfile profile = requireStudentProfile(studentId);
        return toProfileResponse(
                profile,
                followRepository.countByFollowing_Id(studentId),
                followRepository.countByFollower_Id(studentId),
                !studentId.equals(currentStudentId)
                        && followRepository.existsByFollower_IdAndFollowing_Id(
                                currentStudentId, studentId));
    }

    @Transactional
    public StudentFollowResponse followStudent(UUID currentStudentId, UUID studentId) {
        if (studentId.equals(currentStudentId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Students cannot follow themselves.");
        }
        StudentProfile follower = requireStudentProfile(currentStudentId);
        StudentProfile following = requireStudentProfile(studentId);
        boolean alreadyFollowing =
                followRepository.existsByFollower_IdAndFollowing_Id(currentStudentId, studentId);
        if (!alreadyFollowing) {
            try {
                followRepository.saveAndFlush(new StudentFollow(follower, following));
            } catch (DataIntegrityViolationException exception) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "The student is already followed.");
            }
            notificationService.createNotification(
                    following.getId(),
                    follower.getId(),
                    NotificationType.FOLLOW_REQUEST,
                    follower.getUser().getFullName() + " started following you.",
                    "/student/profiles/" + follower.getId());
        }
        return new StudentFollowResponse(
                true, followRepository.countByFollowing_Id(studentId));
    }

    @Transactional
    public StudentFollowResponse unfollowStudent(UUID currentStudentId, UUID studentId) {
        if (studentId.equals(currentStudentId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Students cannot follow themselves.");
        }
        requireStudentProfile(currentStudentId);
        requireStudentProfile(studentId);
        followRepository
                .findByFollower_IdAndFollowing_Id(currentStudentId, studentId)
                .ifPresent(followRepository::delete);
        return new StudentFollowResponse(
                false, followRepository.countByFollowing_Id(studentId));
    }

    @Transactional
    public StudentFollowResponse acceptFollow(UUID currentStudentId, UUID studentId) {
        if (studentId.equals(currentStudentId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Students cannot accept their own follow request.");
        }
        requireStudentProfile(currentStudentId);
        requireStudentProfile(studentId);
        StudentFollow follow =
                followRepository
                        .findByFollower_IdAndFollowing_IdAndStatus(
                                studentId, currentStudentId, FollowStatus.PENDING)
                        .orElseThrow(
                                () -> new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "No pending follow request from this student."));
        follow.setStatus(FollowStatus.ACCEPTED);
        followRepository.saveAndFlush(follow);
        notificationService.createNotification(
                studentId,
                currentStudentId,
                NotificationType.FOLLOW_ACCEPTED,
                requireStudentProfile(currentStudentId).getUser().getFullName()
                        + " accepted your follow request.",
                "/student/profiles/" + currentStudentId);
        return new StudentFollowResponse(
                true, followRepository.countByFollowing_IdAndStatus(currentStudentId, FollowStatus.ACCEPTED));
    }

    @Transactional(readOnly = true)
    public Page<StudentSummaryResponse> getFollowers(
            UUID studentId, int page, int size) {
        requireStudentProfile(studentId);
        return followRepository
                .findAllByFollowing_IdOrderByCreatedAtDescIdDesc(
                        studentId, pageRequest(page, size))
                .map(follow -> toSummaryResponse(follow.getFollower()));
    }

    @Transactional(readOnly = true)
    public Page<StudentSummaryResponse> getFollowing(
            UUID studentId, int page, int size) {
        requireStudentProfile(studentId);
        return followRepository
                .findAllByFollower_IdOrderByCreatedAtDescIdDesc(
                        studentId, pageRequest(page, size))
                .map(follow -> toSummaryResponse(follow.getFollowing()));
    }

    @Transactional(readOnly = true)
    public Page<StudentSummaryResponse> getFollowRequests(
            UUID currentStudentId, int page, int size) {
        requireStudentProfile(currentStudentId);
        return followRepository
                .findAllByFollowing_IdAndStatusOrderByCreatedAtDescIdDesc(
                        currentStudentId, FollowStatus.PENDING, pageRequest(page, size))
                .map(follow -> toSummaryResponse(follow.getFollower()));
    }

    @Transactional(readOnly = true)
    public Page<StudentSummaryResponse> searchStudents(String query, int page, int size) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Search query must not be blank.");
        }

        return studentProfileRepository
                .searchStudents(normalizedQuery, pageRequest(page, size))
                .map(StudentSocialService::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public List<PostCategoryResponse> getCategories() {
        return postCategoryRepository.findAllByActiveTrueOrderByDisplayOrderAsc().stream()
                .map(StudentSocialService::toCategoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<StudentPostResponse> getFeed(
            UUID currentStudentId, int page, int size, String categoryCode) {
        return getFeed(currentStudentId, page, size, categoryCode, false);
    }

    @Transactional(readOnly = true)
    public Page<StudentPostResponse> getFeed(
            UUID currentStudentId, int page, int size, String categoryCode, boolean mine) {
        Pageable pageable =
                pageRequest(
                        page,
                        size,
                        Sort.by(Sort.Direction.DESC, "createdAt")
                                .and(Sort.by(Sort.Direction.DESC, "id")));
        String normalizedCategoryCode =
                categoryCode == null || categoryCode.isBlank() ? null : categoryCode.trim();

        Page<StudentPost> posts;
        if (normalizedCategoryCode == null && !mine) {
            posts = studentPostRepository.findAll(pageable);
        } else if (normalizedCategoryCode == null) {
            posts = studentPostRepository.findAllByAuthor_Id(currentStudentId, pageable);
        } else if (mine) {
            PostCategory category = requireActiveCategory(normalizedCategoryCode);
            posts =
                    studentPostRepository.findAllByAuthor_IdAndCategory_Code(
                            currentStudentId, category.getCode(), pageable);
        } else {
            PostCategory category = requireActiveCategory(normalizedCategoryCode);
            posts =
                    studentPostRepository.findAllByCategory_Code(
                            category.getCode(), pageable);
        }
        return toPostResponses(posts, currentStudentId);
    }

    @Transactional
    public StudentPostResponse createPost(UUID currentStudentId, StudentPostRequest request) {
        User author = requireSocialUser(currentStudentId);
        PostCategory category = requireActiveCategory(request.categoryCode());
        StudentPost post =
                studentPostRepository.save(
                        new StudentPost(
                                author,
                                request.content().trim(),
                                normalizeImageUrl(request),
                                category));
        return toPostResponse(post, currentStudentId);
    }

    @Transactional
    public StudentPostResponse createPostWithAttachments(
            UUID currentStudentId,
            StudentPostRequest request,
            List<MultipartFile> attachments) {
        User author = requireSocialUser(currentStudentId);
        PostCategory category = requireActiveCategory(request.categoryCode());
        StudentPost post =
                studentPostRepository.save(
                        new StudentPost(
                                author,
                                request.content().trim(),
                                normalizeImageUrl(request),
                                category));
        storeAttachments(post, attachments, 0, 0);
        return toPostResponse(post, currentStudentId);
    }

    @Transactional
    public StudentPostResponse updatePost(
            UUID currentStudentId, UUID postId, StudentPostRequest request) {
        StudentPost post = requirePost(postId);
        requireOwner(currentStudentId, post);
        PostCategory category = requireActiveCategory(request.categoryCode());
        post.setContent(request.content().trim());
        post.setImageUrl(normalizeImageUrl(request));
        post.setCategory(category);
        return toPostResponse(post, currentStudentId);
    }

    @Transactional
    public StudentPostResponse updatePostWithAttachments(
            UUID currentStudentId,
            UUID postId,
            StudentPostRequest request,
            List<MultipartFile> newAttachments,
            List<UUID> retainedAttachmentIds) {
        StudentPost post = requirePost(postId);
        requireOwner(currentStudentId, post);
        PostCategory category = requireActiveCategory(request.categoryCode());
        List<StudentPostAttachment> currentAttachments =
                attachmentRepository.findAllByPost_IdOrderByCreatedAtAscIdAsc(postId);
        Set<UUID> retainedIds = retainedAttachmentIds == null
                ? Set.of()
                : new HashSet<>(retainedAttachmentIds);
        if (retainedIds.size() != (retainedAttachmentIds == null ? 0 : retainedAttachmentIds.size())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Retained attachment IDs must be unique.");
        }

        Map<UUID, StudentPostAttachment> currentById =
                currentAttachments.stream()
                        .collect(Collectors.toMap(StudentPostAttachment::getId, item -> item));
        if (!currentById.keySet().containsAll(retainedIds)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "An attachment does not belong to this post.");
        }

        int retainedVideoCount =
                currentAttachments.stream()
                        .filter(item -> retainedIds.contains(item.getId()))
                        .filter(item -> item.getMediaType() == PostMediaType.VIDEO)
                        .mapToInt(ignored -> 1)
                        .sum();
        List<MultipartFile> uploads = normalizedAttachments(newAttachments);
        if (retainedIds.size() + uploads.size() > mediaProperties.getMaxAttachments()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "The post attachment count exceeds the configured limit.");
        }

        List<StudentPostAttachment> removedAttachments =
                currentAttachments.stream()
                        .filter(item -> !retainedIds.contains(item.getId()))
                        .toList();
        post.setContent(request.content().trim());
        post.setImageUrl(normalizeImageUrl(request));
        post.setCategory(category);
        storeAttachments(post, uploads, retainedIds.size(), retainedVideoCount);
        if (!removedAttachments.isEmpty()) {
            attachmentRepository.deleteAll(removedAttachments);
            scheduleFileCleanup(
                    removedAttachments.stream()
                            .map(StudentPostAttachment::getStorageKey)
                            .toList(),
                    TransactionSynchronization.STATUS_COMMITTED);
        }
        return toPostResponse(post, currentStudentId);
    }

    @Transactional
    public void deletePost(UUID currentStudentId, UUID postId) {
        StudentPost post = requirePost(postId);
        requireOwner(currentStudentId, post);
        removePost(post);
    }

    @Transactional
    public void adminDeletePost(UUID postId) {
        removePost(requirePost(postId));
    }

    private void removePost(StudentPost post) {
        UUID postId = post.getId();
        List<StudentPostAttachment> attachments =
                attachmentRepository.findAllByPost_IdOrderByCreatedAtAscIdAsc(postId);
        if (!attachments.isEmpty()) {
            attachmentRepository.deleteAll(attachments);
            attachmentRepository.flush();
        }
        studentPostRepository.delete(post);
        scheduleFileCleanup(
                attachments.stream().map(StudentPostAttachment::getStorageKey).toList(),
                TransactionSynchronization.STATUS_COMMITTED);
    }

    @Transactional
    public PostLikeResponse likePost(UUID currentStudentId, UUID postId) {
        User actor = requireSocialUser(currentStudentId);
        StudentPost post = requirePost(postId);
        boolean alreadyLiked =
                likeRepository.existsByPost_IdAndActor_Id(postId, currentStudentId);
        if (!alreadyLiked) {
            try {
                likeRepository.saveAndFlush(new StudentPostLike(post, actor));
            } catch (DataIntegrityViolationException exception) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "The post is already liked by this user.");
            }
            if (!post.getAuthor().getId().equals(actor.getId())) {
                notificationService.createNotification(
                        post.getAuthor().getId(),
                        actor.getId(),
                        NotificationType.POST_LIKE,
                        actor.getFullName() + " liked your post.",
                        "/student/feed");
            }
        }
        return new PostLikeResponse(likeRepository.countByPost_Id(postId), true);
    }

    @Transactional
    public PostLikeResponse unlikePost(UUID currentStudentId, UUID postId) {
        requireSocialUser(currentStudentId);
        requirePost(postId);
        likeRepository
                .findByPost_IdAndActor_Id(postId, currentStudentId)
                .ifPresent(likeRepository::delete);
        return new PostLikeResponse(likeRepository.countByPost_Id(postId), false);
    }

    @Transactional(readOnly = true)
    public Page<StudentPostCommentResponse> getComments(UUID postId, int page, int size) {
        requirePost(postId);
        Pageable pageable = pageRequest(page, size, Sort.unsorted());
        return commentRepository
                .findAllByPost_IdOrderByCreatedAtAscIdAsc(postId, pageable)
                .map(this::toCommentResponse);
    }

    @Transactional
    public StudentPostCommentResponse createComment(
            UUID currentStudentId, UUID postId, StudentPostCommentRequest request) {
        User author = requireSocialUser(currentStudentId);
        StudentPost post = requirePost(postId);
        StudentPostComment comment =
                commentRepository.save(
                        new StudentPostComment(post, author, request.content().trim()));
        if (!post.getAuthor().getId().equals(author.getId())) {
            notificationService.createNotification(
                    post.getAuthor().getId(),
                    author.getId(),
                    NotificationType.POST_COMMENT,
                    author.getFullName() + " commented on your post.",
                    "/student/feed");
        }
        return toCommentResponse(comment);
    }

    @Transactional
    public StudentPostCommentResponse updateComment(
            UUID currentStudentId,
            UUID postId,
            UUID commentId,
            StudentPostCommentRequest request) {
        StudentPostComment comment = requireComment(postId, commentId);
        requireCommentOwner(currentStudentId, comment);
        comment.setContent(request.content().trim());
        return toCommentResponse(comment);
    }

    @Transactional
    public void deleteComment(UUID currentStudentId, UUID postId, UUID commentId) {
        StudentPostComment comment = requireComment(postId, commentId);
        requireCommentOwner(currentStudentId, comment);
        commentRepository.delete(comment);
    }

    @Transactional
    public void adminDeleteComment(UUID postId, UUID commentId) {
        commentRepository.delete(requireComment(postId, commentId));
    }

    @Transactional(readOnly = true)
    public MediaFileContent getAttachmentContent(UUID attachmentId) {
        StudentPostAttachment attachment =
                attachmentRepository
                        .findById(attachmentId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Attachment was not found."));
        Resource resource = mediaStorageService.load(attachment.getStorageKey());
        return new MediaFileContent(
                resource, attachment.getContentType(), attachment.getFileSizeBytes());
    }

    private void storeAttachments(
            StudentPost post,
            List<MultipartFile> requestedAttachments,
            int existingAttachmentCount,
            int existingVideoCount) {
        List<MultipartFile> attachments = normalizedAttachments(requestedAttachments);
        if (existingAttachmentCount + attachments.size() > mediaProperties.getMaxAttachments()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "The post attachment count exceeds the configured limit.");
        }

        List<StudentPostAttachment> savedAttachments = new ArrayList<>();
        int videoCount = existingVideoCount;
        for (MultipartFile file : attachments) {
            SocialMediaStorageService.StoredMedia stored =
                    mediaStorageService.store(file);
            scheduleFileCleanup(
                    List.of(stored.storageKey()), TransactionSynchronization.STATUS_ROLLED_BACK);
            if (stored.mediaType() == PostMediaType.VIDEO
                    && ++videoCount > mediaProperties.getMaxVideos()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "The post video attachment limit was exceeded.");
            }
            savedAttachments.add(
                    new StudentPostAttachment(
                            post,
                            stored.mediaType(),
                            stored.contentType(),
                            stored.storageKey(),
                            stored.fileSizeBytes()));
        }
        attachmentRepository.saveAll(savedAttachments);
    }

    private Page<StudentPostResponse> toPostResponses(
            Page<StudentPost> posts, UUID currentStudentId) {
        List<UUID> postIds = posts.getContent().stream().map(StudentPost::getId).toList();
        if (postIds.isEmpty()) {
            return posts.map(post -> toPostResponse(post, currentStudentId));
        }

        Map<UUID, List<PostAttachmentResponse>> attachmentsByPost =
                attachmentRepository.findAllByPost_IdInOrderByCreatedAtAscIdAsc(postIds).stream()
                        .collect(
                                Collectors.groupingBy(
                                        attachment -> attachment.getPost().getId(),
                                        HashMap::new,
                                        Collectors.mapping(
                                                StudentSocialService::toAttachmentResponse,
                                                Collectors.toList())));
        Map<UUID, Long> likeCounts =
                likeRepository.countForPosts(postIds).stream()
                        .collect(
                                Collectors.toMap(
                                        PostLikeAggregate::postId,
                                        PostLikeAggregate::likeCount));
        Set<UUID> likedPostIds = likeRepository.findLikedPostIds(postIds, currentStudentId);
        Map<UUID, Long> commentCounts =
                commentRepository.countForPosts(postIds).stream()
                        .collect(
                                Collectors.toMap(
                                        PostCommentAggregate::postId,
                                        PostCommentAggregate::commentCount));

        return posts.map(
                post ->
                        toPostResponse(
                                post,
                                attachmentsByPost.getOrDefault(post.getId(), List.of()),
                                likeCounts.getOrDefault(post.getId(), 0L),
                                likedPostIds.contains(post.getId()),
                                commentCounts.getOrDefault(post.getId(), 0L)));
    }

    private StudentPostResponse toPostResponse(StudentPost post, UUID currentStudentId) {
        List<PostAttachmentResponse> attachments =
                attachmentRepository.findAllByPost_IdOrderByCreatedAtAscIdAsc(post.getId()).stream()
                        .map(StudentSocialService::toAttachmentResponse)
                        .toList();
        long likeCount = likeRepository.countByPost_Id(post.getId());
        boolean liked = likeRepository.existsByPost_IdAndActor_Id(post.getId(), currentStudentId);
        long commentCount = commentRepository.countByPost_Id(post.getId());
        return toPostResponse(post, attachments, likeCount, liked, commentCount);
    }

    private StudentPostResponse toPostResponse(
            StudentPost post,
            List<PostAttachmentResponse> attachments,
            long likeCount,
            boolean likedByCurrentUser,
            long commentCount) {
        return new StudentPostResponse(
                post.getId(),
                post.getContent(),
                post.getImageUrl(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                toPostAuthorResponse(post.getAuthor()),
                toCategoryResponse(post.getCategory()),
                List.copyOf(attachments),
                likeCount,
                likedByCurrentUser,
                commentCount);
    }

    private static PostAttachmentResponse toAttachmentResponse(
            StudentPostAttachment attachment) {
        return new PostAttachmentResponse(
                attachment.getId(),
                attachment.getMediaType().name(),
                attachment.getContentType(),
                attachment.getFileSizeBytes(),
                "/api/students/attachments/" + attachment.getId() + "/content",
                attachment.getCreatedAt());
    }

    private StudentPost requirePost(UUID postId) {
        return studentPostRepository
                .findWithAuthorById(postId)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Post was not found."));
    }

    private StudentPostComment requireComment(UUID postId, UUID commentId) {
        return commentRepository
                .findWithAuthorByIdAndPost_Id(commentId, postId)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Comment was not found."));
    }

    private StudentProfile requireStudentProfile(UUID studentId) {
        return studentProfileRepository
                .findWithUserById(studentId)
                .orElseThrow(() -> new ProfileNotFoundException(RoleCode.STUDENT));
    }

    private User requireSocialUser(UUID userId) {
        return studentProfileRepository
                .findWithUserById(userId)
                .map(StudentProfile::getUser)
                .filter(user -> user.getRole().getCode() == RoleCode.STUDENT)
                .or(() -> professionalProfileRepository.findWithUserById(userId)
                        .map(ProfessionalProfile::getUser)
                        .filter(user -> user.getRole().getCode() == RoleCode.PROFESSIONAL))
                .or(() -> userRepository.findById(userId)
                        .filter(user -> user.getRole().getCode() == RoleCode.ADMIN))
                .orElseThrow(
                        () ->
                                new AccessDeniedException(
                                        "Only community members can use the shared feed."));
    }

    private PostCategory requireActiveCategory(String categoryCode) {
        String normalizedCategoryCode = categoryCode == null ? "" : categoryCode.trim();
        return postCategoryRepository
                .findByCodeAndActiveTrue(normalizedCategoryCode)
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Post category is invalid."));
    }

    private static List<MultipartFile> normalizedAttachments(List<MultipartFile> attachments) {
        if (attachments == null) {
            return List.of();
        }
        List<MultipartFile> normalized =
                attachments.stream().filter(file -> file != null).toList();
        if (normalized.stream().anyMatch(MultipartFile::isEmpty)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Attachments must not be empty.");
        }
        return normalized;
    }

    private static void requireOwner(UUID currentStudentId, StudentPost post) {
        if (!post.getAuthor().getId().equals(currentStudentId)) {
            throw new AccessDeniedException("Students may only change their own posts.");
        }
    }

    private static void requireCommentOwner(
            UUID currentStudentId, StudentPostComment comment) {
        if (!comment.getAuthor().getId().equals(currentStudentId)) {
            throw new AccessDeniedException("Students may only change their own comments.");
        }
    }

    private void scheduleFileCleanup(Collection<String> storageKeys, int completionStatus) {
        if (storageKeys.isEmpty() || !TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        List<String> keys = List.copyOf(storageKeys);
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCompletion(int status) {
                        if (status != completionStatus) {
                            return;
                        }
                        for (String storageKey : keys) {
                            try {
                                mediaStorageService.delete(storageKey);
                            } catch (IOException exception) {
                                LOGGER.error(
                                        "Student post attachment file cleanup failed: type={}",
                                        exception.getClass().getName());
                            }
                        }
                    }
                });
    }

    private static Pageable pageRequest(int page, int size) {
        return pageRequest(page, size, Sort.by(Sort.Direction.ASC, "id"));
    }

    private static Pageable pageRequest(int page, int size, Sort sort) {
        if (page < 0 || size < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Page must be non-negative and size must be positive.");
        }
        return PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), sort);
    }

    private static String normalizeImageUrl(StudentPostRequest request) {
        String imageUrl = request.imageUrl();
        return imageUrl == null || imageUrl.isBlank() ? null : imageUrl.trim();
    }

    private static StudentProfileResponse toProfileResponse(
            StudentProfile profile,
            long followerCount,
            long followingCount,
            boolean followedByCurrentUser) {
        return new StudentProfileResponse(
                profile.getId(),
                profile.getUser().getFullName(),
                profile.getUser().getProfileImageUrl(),
                profile.getUniversityName(),
                profile.getFaculty(),
                profile.getDepartmentOrField(),
                profile.getBatchYear(),
                profile.getCurrentAcademicYear(),
                profile.getSkills(),
                profile.getInterests(),
                followerCount,
                followingCount,
                followedByCurrentUser);
    }

    private static StudentSummaryResponse toSummaryResponse(StudentProfile profile) {
        return new StudentSummaryResponse(
                profile.getId(),
                profile.getUser().getFullName(),
                profile.getUser().getProfileImageUrl(),
                profile.getUniversityName(),
                profile.getFaculty(),
                profile.getDepartmentOrField());
    }

    private static PostCategoryResponse toCategoryResponse(PostCategory category) {
        return new PostCategoryResponse(category.getCode(), category.getDisplayName());
    }

    private StudentPostCommentResponse toCommentResponse(StudentPostComment comment) {
        return new StudentPostCommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                toPostAuthorResponse(comment.getAuthor()));
    }

    private PostAuthorResponse toPostAuthorResponse(User user) {
        String role = user.getRole().getCode().name();
        StudentProfile studentProfile =
                RoleCode.STUDENT.name().equals(role)
                        ? studentProfileRepository.findById(user.getId()).orElse(null)
                        : null;
        ProfessionalProfile professionalProfile =
                RoleCode.PROFESSIONAL.name().equals(role)
                        ? professionalProfileRepository.findById(user.getId()).orElse(null)
                        : null;
        return new PostAuthorResponse(
                user.getId(),
                user.getFullName(),
                user.getProfileImageUrl(),
                role,
                studentProfile == null ? null : studentProfile.getUniversityName(),
                studentProfile == null ? null : studentProfile.getFaculty(),
                studentProfile == null ? null : studentProfile.getDepartmentOrField(),
                professionalProfile == null ? null : professionalProfile.getCompanyName(),
                professionalProfile == null ? null : professionalProfile.getIndustry(),
                professionalProfile == null ? null : professionalProfile.getJobPosition());
    }

    public record MediaFileContent(Resource resource, String contentType, long fileSizeBytes) {
    }
}
