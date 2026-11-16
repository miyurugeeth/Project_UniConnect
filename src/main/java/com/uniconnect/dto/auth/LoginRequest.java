package com.uniconnect.dto.auth;

import com.uniconnect.dto.validation.BcryptPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @BcryptPassword String password) {
}
