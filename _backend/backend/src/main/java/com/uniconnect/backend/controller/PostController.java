package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.PostRequest;
import com.uniconnect.backend.dto.PostResponse;
import com.uniconnect.backend.service.PostService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    // CREATE POST
    @PostMapping
    public ResponseEntity<PostResponse> createPost(
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        PostResponse post = postService.createPost(
                request,
                userDetails
        );

        return ResponseEntity.ok(post);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> createPostWithFile(
            @Valid @RequestPart("post") PostRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(postService.createPost(request, userDetails, file));
    }

    // GET ALL POSTS
    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPosts(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                postService.getAllPosts(userDetails)
        );
    }

    // GET MY POSTS
    @GetMapping("/my")
    public ResponseEntity<List<PostResponse>> getMyPosts(
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(
                postService.getMyPosts(userDetails)
        );
    }

    // GET POST BY ID
    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPostById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        PostResponse post =
                postService.getPostById(id, userDetails);

        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(post);
    }

    // UPDATE POST
    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long id,
            @Valid @RequestBody PostRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        PostResponse updatedPost =
                postService.updatePost(
                        id,
                        request,
                        userDetails
                );

        if (updatedPost == null) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(updatedPost);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> updatePostWithFile(
            @PathVariable Long id,
            @Valid @RequestPart("post") PostRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        PostResponse updatedPost = postService.updatePost(id, request, userDetails, file);
        if (updatedPost == null) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(updatedPost);
    }

    // DELETE POST
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        boolean deleted =
                postService.deletePost(
                        id,
                        userDetails
                );

        if (!deleted) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.noContent().build();
    }
}