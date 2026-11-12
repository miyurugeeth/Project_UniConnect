package com.uniconnect.backend.controller;

import com.uniconnect.backend.dto.UserRequest;
import com.uniconnect.backend.dto.UserResponse;
import com.uniconnect.backend.dto.AdminStatsResponse;
import com.uniconnect.backend.dto.CommentResponse;
import com.uniconnect.backend.dto.PostResponse;
import com.uniconnect.backend.service.AdminService;
import com.uniconnect.backend.service.CommentService;
import com.uniconnect.backend.service.PostService;
import com.uniconnect.backend.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final AdminService adminService;
    private final PostService postService;
    private final CommentService commentService;

    public AdminController(
            UserService userService,
            AdminService adminService,
            PostService postService,
            CommentService commentService) {
        this.userService = userService;
        this.adminService = adminService;
        this.postService = postService;
        this.commentService = commentService;
    }

    @GetMapping("/dashboard")
    public AdminStatsResponse getDashboard() {
        return adminService.getStats();
    }

    @GetMapping("/students")
    public List<UserResponse> getStudents(
            @RequestParam(required = false) String search) {
        return userService.getStudents(search);
    }

    @PutMapping("/students/{id}/suspend")
    public UserResponse suspendStudent(@PathVariable Long id) {
        return userService.updateStudentStatus(id, "SUSPENDED");
    }

    @PutMapping("/students/{id}/unsuspend")
    public UserResponse unsuspendStudent(@PathVariable Long id) {
        return userService.updateStudentStatus(id, "ACTIVE");
    }

    @GetMapping("/posts")
    public List<PostResponse> getPosts() {
        return adminService.getPosts();
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePostAsAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/comments")
    public List<CommentResponse> getComments() {
        return adminService.getComments();
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteCommentAsAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admins")
    public List<UserResponse> getAdmins() {
        return userService.getAdmins();
    }

    @PostMapping("/users")
    public UserResponse createAdminUser(
            @Valid @RequestBody UserRequest request) {

        return userService.createAdminUser(request);
    }
}