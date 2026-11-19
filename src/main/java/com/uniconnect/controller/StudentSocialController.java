package com.uniconnect.controller;

import com.uniconnect.dto.social.PostCategoryResponse;
import com.uniconnect.dto.social.PostLikeResponse;
import com.uniconnect.dto.social.StudentFollowResponse;
import com.uniconnect.dto.social.StudentPostCommentRequest;
import com.uniconnect.dto.social.StudentPostCommentResponse;
import com.uniconnect.dto.social.StudentPostRequest;
import com.uniconnect.dto.social.StudentPostResponse;
import com.uniconnect.dto.social.StudentProfileResponse;
import com.uniconnect.dto.social.StudentSummaryResponse;
import com.uniconnect.service.StudentSocialService;
import com.uniconnect.service.StudentSocialService.MediaFileContent;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/students")
public class StudentSocialController {

    private final StudentSocialService studentSocialService;

    public StudentSocialController(StudentSocialService studentSocialService) {
        this.studentSocialService = studentSocialService;
    }

    @GetMapping("/search")
    public Page<StudentSummaryResponse> searchStudents(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return studentSocialService.searchStudents(q, page, size);
    }

    @GetMapping("/{studentId}")
    public StudentProfileResponse getStudentProfile(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID studentId) {
        return studentSocialService.getStudentProfile(
                studentId, currentStudentId(principal));
    }

    @PostMapping("/{studentId}/follow")
    public StudentFollowResponse followStudent(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID studentId) {
        return studentSocialService.followStudent(currentStudentId(principal), studentId);
    }

    @DeleteMapping("/{studentId}/follow")
    public StudentFollowResponse unfollowStudent(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID studentId) {
        return studentSocialService.unfollowStudent(currentStudentId(principal), studentId);
    }

    @PostMapping("/{studentId}/follow/accept")
    public StudentFollowResponse acceptFollow(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID studentId) {
        return studentSocialService.acceptFollow(currentStudentId(principal), studentId);
    }

    @GetMapping("/follow-requests")
    public Page<StudentSummaryResponse> getFollowRequests(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return studentSocialService.getFollowRequests(
                currentStudentId(principal), page, size);
    }

    @GetMapping("/{studentId}/followers")
    public Page<StudentSummaryResponse> getFollowers(
            @PathVariable UUID studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return studentSocialService.getFollowers(studentId, page, size);
    }

    @GetMapping("/{studentId}/following")
    public Page<StudentSummaryResponse> getFollowing(
            @PathVariable UUID studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return studentSocialService.getFollowing(studentId, page, size);
    }

    @GetMapping("/categories")
    public List<PostCategoryResponse> getCategories() {
        return studentSocialService.getCategories();
    }

    @GetMapping("/feed")
    public Page<StudentPostResponse> getFeed(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String category) {
        return studentSocialService.getFeed(currentStudentId(principal), page, size, category);
    }

    @PostMapping("/posts")
    public StudentPostResponse createPost(
            @AuthenticationPrincipal Jwt principal,
            @Valid @RequestBody StudentPostRequest request) {
        return studentSocialService.createPost(currentStudentId(principal), request);
    }

    @PostMapping(path = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentPostResponse createPostWithAttachments(
            @AuthenticationPrincipal Jwt principal,
            @Valid @RequestPart("post") StudentPostRequest request,
            @RequestPart(value = "attachments", required = false)
                    List<MultipartFile> attachments) {
        return studentSocialService.createPostWithAttachments(
                currentStudentId(principal), request, attachments);
    }

    @PutMapping("/posts/{postId}")
    public StudentPostResponse updatePost(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID postId,
            @Valid @RequestBody StudentPostRequest request) {
        return studentSocialService.updatePost(currentStudentId(principal), postId, request);
    }

    @PutMapping(path = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentPostResponse updatePostWithAttachments(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID postId,
            @Valid @RequestPart("post") StudentPostRequest request,
            @RequestPart(value = "attachments", required = false)
                    List<MultipartFile> attachments,
            @RequestParam(value = "retainedAttachmentIds", required = false)
                    List<UUID> retainedAttachmentIds) {
        return studentSocialService.updatePostWithAttachments(
                currentStudentId(principal),
                postId,
                request,
                attachments,
                retainedAttachmentIds);
    }

    @DeleteMapping("/posts/{postId}")
    public void deletePost(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID postId) {
        studentSocialService.deletePost(currentStudentId(principal), postId);
    }

    @PostMapping("/posts/{postId}/likes")
    public PostLikeResponse likePost(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID postId) {
        return studentSocialService.likePost(currentStudentId(principal), postId);
    }

    @DeleteMapping("/posts/{postId}/likes")
    public PostLikeResponse unlikePost(
            @AuthenticationPrincipal Jwt principal, @PathVariable UUID postId) {
        return studentSocialService.unlikePost(currentStudentId(principal), postId);
    }

    @GetMapping("/posts/{postId}/comments")
    public Page<StudentPostCommentResponse> getComments(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return studentSocialService.getComments(postId, page, size);
    }

    @PostMapping("/posts/{postId}/comments")
    public StudentPostCommentResponse createComment(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID postId,
            @Valid @RequestBody StudentPostCommentRequest request) {
        return studentSocialService.createComment(
                currentStudentId(principal), postId, request);
    }

    @PutMapping("/posts/{postId}/comments/{commentId}")
    public StudentPostCommentResponse updateComment(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID postId,
            @PathVariable UUID commentId,
            @Valid @RequestBody StudentPostCommentRequest request) {
        return studentSocialService.updateComment(
                currentStudentId(principal), postId, commentId, request);
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public void deleteComment(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID postId,
            @PathVariable UUID commentId) {
        studentSocialService.deleteComment(
                currentStudentId(principal), postId, commentId);
    }

    @GetMapping("/attachments/{attachmentId}/content")
    public ResponseEntity<Resource> getAttachmentContent(
            @PathVariable UUID attachmentId) {
        MediaFileContent content = studentSocialService.getAttachmentContent(attachmentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(content.contentType()))
                .contentLength(content.fileSizeBytes())
                .cacheControl(CacheControl.noCache().cachePrivate())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline()
                                .filename(attachmentId.toString())
                                .build()
                                .toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(content.resource());
    }

    private static UUID currentStudentId(Jwt principal) {
        return UUID.fromString(principal.getSubject());
    }
}
