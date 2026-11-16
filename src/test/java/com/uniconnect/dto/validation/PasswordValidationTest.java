package com.uniconnect.dto.validation;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.uniconnect.dto.auth.LoginRequest;
import com.uniconnect.dto.registration.StudentRegistrationRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

class PasswordValidationTest {

    private static final ValidatorFactory VALIDATOR_FACTORY =
            Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = VALIDATOR_FACTORY.getValidator();

    @AfterAll
    static void closeValidatorFactory() {
        VALIDATOR_FACTORY.close();
    }

    @Test
    void acceptsBcryptPasswordAt72Utf8Bytes() {
        LoginRequest request = new LoginRequest("student@example.lk", "a".repeat(72));

        assertTrue(VALIDATOR.validate(request).isEmpty());
    }

    @Test
    void rejectsPasswordOver72Utf8BytesEvenWhenCharacterCountIsBelow72() {
        LoginRequest request = new LoginRequest("student@example.lk", "é".repeat(37));

        assertTrue(
                VALIDATOR.validate(request).stream()
                        .anyMatch(violation -> violation.getPropertyPath().toString().equals("password")));
    }

    @Test
    void reportsPasswordConfirmationMismatchOnConfirmationField() {
        StudentRegistrationRequest request =
                new StudentRegistrationRequest(
                        "A Student",
                        "student@example.lk",
                        "LongPassword123",
                        "LongPassword124",
                        "University of Colombo",
                        "Science",
                        "Computer Science",
                        2024,
                        1,
                        Set.of(),
                        Set.of(),
                        null);

        assertTrue(
                VALIDATOR.validate(request).stream()
                        .anyMatch(
                                violation ->
                                        violation.getPropertyPath()
                                                .toString()
                                                .equals("confirmPassword")));
    }
}
