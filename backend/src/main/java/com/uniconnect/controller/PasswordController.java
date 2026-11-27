package com.uniconnect.controller;

import com.uniconnect.dto.auth.PasswordChangeRequest;
import com.uniconnect.service.PasswordService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/password")
public class PasswordController {

    private final PasswordService passwordService;

    public PasswordController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @PutMapping
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Jwt principal, @Valid @RequestBody PasswordChangeRequest request) {
        UUID currentUserId = UUID.fromString(principal.getSubject());
        passwordService.changePassword(currentUserId, request);
        return ResponseEntity.noContent().build();
    }
}
