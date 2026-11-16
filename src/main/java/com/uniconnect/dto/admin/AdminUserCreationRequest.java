package com.uniconnect.dto.admin;

import com.uniconnect.dto.validation.BcryptPassword;
import com.uniconnect.dto.validation.PasswordConfirmation;
import com.uniconnect.dto.validation.PasswordsMatch;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@PasswordsMatch
public record AdminUserCreationRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12) @BcryptPassword String password,
        @NotBlank String confirmPassword)
        implements PasswordConfirmation {

    @Override
    public String passwordForConfirmation() {
        return password;
    }

    @Override
    public String confirmationForPassword() {
        return confirmPassword;
    }

    @Override
    public String confirmationFieldName() {
        return "confirmPassword";
    }
}
