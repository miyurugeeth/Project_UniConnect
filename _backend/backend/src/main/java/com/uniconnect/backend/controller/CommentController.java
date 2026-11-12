package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.CommentRequest;
import com.uniconnect.backend.dto.CommentResponse;
import com.uniconnect.backend.service.CommentService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    // CREATE COMMENT
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        CommentResponse comment = commentService.createComment(
                postId,
                request,
                userDetails
        );

        return ResponseEntity.ok(comment);
    }

    // GET COMMENTS OF A POST
    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getCommentsByPost(
            @PathVariable Long postId) {

        return ResponseEntity.ok(
                commentService.getCommentsByPost(postId)
        );
    }

    // GET MY COMMENTS
    @GetMapping("/comments/my")
    public ResponseEntity<List<CommentResponse>> getMyComments(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                commentService.getMyComments(userDetails)
        );
    }

    @PutMapping("/comments/{commentId}")
public ResponseEntity<?> updateComment(
        @PathVariable Long commentId,
        @Valid @RequestBody CommentRequest request,
        @AuthenticationPrincipal UserDetails userDetails) {

    try {
        CommentResponse updatedComment =
                commentService.updateComment(commentId, request, userDetails);
        return ResponseEntity.ok(updatedComment);
    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().body(e.getMessage());  // Real error message eka penei
    }
}

@DeleteMapping("/comments/{commentId}")
public ResponseEntity<?> deleteComment(
        @PathVariable Long commentId,
        @AuthenticationPrincipal UserDetails userDetails) {

    try {
        commentService.deleteComment(commentId, userDetails);
        return ResponseEntity.noContent().build();
    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
}