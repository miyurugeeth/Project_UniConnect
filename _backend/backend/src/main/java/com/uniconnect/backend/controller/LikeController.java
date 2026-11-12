package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.LikeResponse;
import com.uniconnect.backend.service.LikeService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    // LIKE POST
    @PostMapping("/posts/{postId}/like")
    public ResponseEntity<LikeResponse> likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        LikeResponse like = likeService.likePost(
                postId,
                userDetails
        );

        return ResponseEntity.ok(like);
    }

    // UNLIKE POST
    @DeleteMapping("/posts/{postId}/like")
    public ResponseEntity<Void> unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean deleted = likeService.unlikePost(
                postId,
                userDetails
        );

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    // GET ALL LIKES OF A POST
    @GetMapping("/posts/{postId}/likes")
    public ResponseEntity<List<LikeResponse>> getPostLikes(
            @PathVariable Long postId) {

        return ResponseEntity.ok(
                likeService.getPostLikes(postId)
        );
    }

    // GET LIKE COUNT
    @GetMapping("/posts/{postId}/likes/count")
    public ResponseEntity<Map<String, Long>> getLikeCount(
            @PathVariable Long postId) {

        long count = likeService.getLikeCount(postId);

        return ResponseEntity.ok(
                Map.of("likeCount", count)
        );
    }

    // CHECK CURRENT USER LIKE
    @GetMapping("/posts/{postId}/liked")
    public ResponseEntity<Map<String, Boolean>> hasLiked(
            @PathVariable Long postId,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean liked = likeService.hasLiked(
                postId,
                userDetails
        );

        return ResponseEntity.ok(
                Map.of("liked", liked)
        );
    }
}