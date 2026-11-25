package com.uniconnect.dto.admin;

import com.uniconnect.entity.RoleCode;
import java.util.UUID;

public record AdminUserResponse(
        UUID id, String fullName, String username, String email, RoleCode role, boolean suspended) {
}
