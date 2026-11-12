package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.CommentRequest;
import com.uniconnect.backend.dto.CommentResponse;
import com.uniconnect.backend.entity.Comment;
import com.uniconnect.backend.entity.Notification;
import com.uniconnect.backend.entity.Post;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.CommentRepository;
import com.uniconnect.backend.repository.NotificationRepository;
import com.uniconnect.backend.repository.PostRepository;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public CommentService(
            CommentRepository commentRepository,
            PostRepository postRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {

        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    // CREATE COMMENT
    public CommentResponse createComment(
            Long postId,
            CommentRequest request,
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        if ("SUSPENDED".equals(user.getAccountStatus())) {
            throw new AccessDeniedException("Suspended users cannot comment");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() ->
                        new RuntimeException("Post not found"));

        Comment comment = new Comment();

        comment.setContent(request.getContent());
        comment.setUser(user);
        comment.setPost(post);

        LocalDateTime now = LocalDateTime.now();

        comment.setCreatedAt(now);
        comment.setUpdatedAt(now);

        Comment savedComment = commentRepository.save(comment);

        // Create notification for post owner
        // Don't notify if user comments on their own post
        if (!post.getUser().getEmail().equals(email)) {

            Notification notification = new Notification();

            notification.setMessage(
                    user.getName() + " commented on your post"
            );

            notification.setType("COMMENT");
            notification.setRead(false);
            notification.setCreatedAt(LocalDateTime.now());

            // Notification receiver = post owner
            notification.setUser(post.getUser());

            // Related post
            notification.setPost(post);

            notificationRepository.save(notification);
        }

        return convertToResponse(savedComment);
    }

    // GET COMMENTS OF A POST
    public List<CommentResponse> getCommentsByPost(Long postId) {

        if (!postRepository.existsById(postId)) {
            throw new RuntimeException("Post not found");
        }

        return commentRepository.findByPost_Id(postId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // GET MY COMMENTS
    public List<CommentResponse> getMyComments(
            UserDetails userDetails) {

        String email = userDetails.getUsername();

        return commentRepository.findByUser_Email(email)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    // UPDATE COMMENT
    public CommentResponse updateComment(
            Long commentId,
            CommentRequest request,
            UserDetails userDetails) {

        Comment comment = commentRepository
                .findById(commentId)
                .orElseThrow(() ->
                        new RuntimeException("Comment not found"));

        String email = userDetails.getUsername();

        if (!comment.getUser().getEmail().equals(email)) {
            throw new RuntimeException(
                    "You are not authorized to update this comment");
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(LocalDateTime.now());

        Comment updatedComment = commentRepository.save(comment);

        return convertToResponse(updatedComment);
    }

    // DELETE COMMENT
    public void deleteComment(
            Long commentId,
            UserDetails userDetails) {

        Comment comment = commentRepository
                .findById(commentId)
                .orElseThrow(() ->
                        new RuntimeException("Comment not found"));

        String email = userDetails.getUsername();

        if (!comment.getUser().getEmail().equals(email)) {
            throw new RuntimeException(
                    "You are not authorized to delete this comment");
        }

        commentRepository.delete(comment);
    }

    public void deleteCommentAsAdmin(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new IllegalArgumentException("Comment not found");
        }

        commentRepository.deleteById(commentId);
    }

    // Entity → Response DTO
    private CommentResponse convertToResponse(Comment comment) {

        return new CommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                comment.getUser().getId(),
                comment.getUser().getName(),
                comment.getPost().getId()
        );
    }
}