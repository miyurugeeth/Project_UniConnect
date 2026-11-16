package com.uniconnect.dto.registration;

import com.uniconnect.dto.validation.BcryptPassword;
import com.uniconnect.dto.validation.PasswordConfirmation;
import com.uniconnect.dto.validation.PasswordsMatch;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;

@PasswordsMatch
public record StudentRegistrationRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12) @BcryptPassword String password,
        @NotBlank String confirmPassword,
        @NotBlank @Size(max = 200) String universityName,
        @NotBlank @Size(max = 150) String faculty,
        @NotBlank @Size(max = 150) String departmentOrField,
        @NotNull @Min(1900) @Max(2200) Integer batchYear,
        @NotNull @Min(1) @Max(20) Integer currentAcademicYear,
        @Size(max = 100) Set<@NotBlank @Size(max = 80) String> skills,
        @Size(max = 100) Set<@NotBlank @Size(max = 80) String> interests,
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
