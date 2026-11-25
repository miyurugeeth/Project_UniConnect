package com.uniconnect.dto.auth;

import com.uniconnect.entity.RoleCode;
import java.util.UUID;

public record AuthenticationResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UUID userId,
        RoleCode role,
        String fullName,
        String email,
        String profileImageUrl) {
}
