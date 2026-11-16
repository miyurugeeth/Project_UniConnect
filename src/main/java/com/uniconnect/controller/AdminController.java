package com.uniconnect.controller;

import com.uniconnect.dto.admin.AdminUserCreationRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminUserService adminUserService;

    public AdminController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @PostMapping("/users")
    public ResponseEntity<UserProfileResponse> createAdminUser(
            @Valid @RequestBody AdminUserCreationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminUserService.createAdminUser(request));
    }
}
