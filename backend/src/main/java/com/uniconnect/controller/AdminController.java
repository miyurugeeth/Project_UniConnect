package com.uniconnect.controller;

import com.uniconnect.dto.admin.AdminUserCreationRequest;
import com.uniconnect.dto.admin.AdminDashboardSummaryResponse;
import com.uniconnect.dto.admin.AdminSuspensionRequest;
import com.uniconnect.dto.admin.AdminUserResponse;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.exception.AdminBootstrapNotConfiguredException;
import com.uniconnect.exception.InvalidAdminBootstrapKeyException;
import com.uniconnect.service.AdminUserService;
import com.uniconnect.service.StudentSocialService;
import jakarta.validation.Valid;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminUserService adminUserService;
    private final StudentSocialService studentSocialService;
    private final String adminBootstrapKey;

    public AdminController(
            AdminUserService adminUserService,
            StudentSocialService studentSocialService,
            @Value("${ADMIN_BOOTSTRAP_KEY:}") String adminBootstrapKey) {
        this.adminUserService = adminUserService;
        this.studentSocialService = studentSocialService;
        this.adminBootstrapKey = adminBootstrapKey;
    }

    @GetMapping("/bootstrap/status")
    public BootstrapStatus getBootstrapStatus() {
        return new BootstrapStatus(
                adminUserService.isBootstrapAvailable(), !adminBootstrapKey.isBlank());
    }

    @PostMapping("/bootstrap")
    public ResponseEntity<UserProfileResponse> bootstrapFirstAdmin(
            @Valid @RequestBody AdminUserCreationRequest request,
            @RequestHeader("X-Admin-Bootstrap-Key") String suppliedKey) {
        if (adminBootstrapKey.isBlank()) {
            throw new AdminBootstrapNotConfiguredException();
        }
        if (!MessageDigest.isEqual(
                adminBootstrapKey.getBytes(StandardCharsets.UTF_8),
                suppliedKey.getBytes(StandardCharsets.UTF_8))) {
            throw new InvalidAdminBootstrapKeyException();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.bootstrapFirstAdmin(request));
    }

    @PostMapping("/users")
    public ResponseEntity<UserProfileResponse> createAdminUser(
            @Valid @RequestBody AdminUserCreationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.createAdminUser(request));
    }

    @GetMapping("/users")
    public Page<AdminUserResponse> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return adminUserService.listUsers(page, size);
    }

    @GetMapping("/summary")
    public AdminDashboardSummaryResponse getDashboardSummary() {
        return adminUserService.getDashboardSummary();
    }

    @PutMapping("/users/{userId}/suspension")
    public AdminUserResponse updateSuspension(
            @AuthenticationPrincipal Jwt principal,
            @PathVariable UUID userId,
            @RequestBody AdminSuspensionRequest request) {
        return adminUserService.setUserSuspended(
                userId, request.suspended(), UUID.fromString(principal.getSubject()));
    }

    @DeleteMapping("/posts/{postId}")
    public void deletePost(@PathVariable UUID postId) {
        studentSocialService.adminDeletePost(postId);
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public void deleteComment(@PathVariable UUID postId, @PathVariable UUID commentId) {
        studentSocialService.adminDeleteComment(postId, commentId);
    }

    public record BootstrapStatus(boolean available, boolean configured) {
    }
}
