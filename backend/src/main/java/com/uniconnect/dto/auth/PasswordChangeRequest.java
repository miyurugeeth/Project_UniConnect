package com.uniconnect.dto.auth;

import com.uniconnect.dto.validation.BcryptPassword;
import com.uniconnect.dto.validation.PasswordConfirmation;
import com.uniconnect.dto.validation.PasswordsMatch;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@PasswordsMatch
public record PasswordChangeRequest(
        @NotBlank @BcryptPassword String currentPassword,
        @NotBlank @Size(min = 12) @BcryptPassword String newPassword,
        @NotBlank String confirmNewPassword)
        implements PasswordConfirmation {

    @Override
    public String passwordForConfirmation() {
        return newPassword;
    }

    @Override
    public String confirmationForPassword() {
        return confirmNewPassword;
    }

    @Override
    public String confirmationFieldName() {
        return "confirmNewPassword";
    }
}
