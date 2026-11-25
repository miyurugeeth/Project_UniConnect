package com.uniconnect.dto.registration;

import com.uniconnect.dto.validation.BcryptPassword;
import com.uniconnect.dto.validation.PasswordConfirmation;
import com.uniconnect.dto.validation.PasswordsMatch;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

@PasswordsMatch
public record ProfessionalRegistrationRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12) @BcryptPassword String password,
        @NotBlank String confirmPassword,
        @NotBlank @Size(max = 200) String companyName,
        @NotBlank @Size(max = 120) String industry,
        @NotBlank @Size(max = 150) String jobPosition,
        @Size(max = 100) Set<@NotBlank @Size(max = 80) String> skills,
        @Size(max = 2048) String profileImageUrl)
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
