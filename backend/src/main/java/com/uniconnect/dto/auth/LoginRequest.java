package com.uniconnect.dto.auth;

import com.uniconnect.dto.validation.BcryptPassword;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonAlias;

public record LoginRequest(
        @JsonAlias("username") @NotBlank @Size(max = 254) String email,
        @NotBlank @BcryptPassword String password) {
}
