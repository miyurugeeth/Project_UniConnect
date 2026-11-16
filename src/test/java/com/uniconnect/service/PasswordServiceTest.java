package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uniconnect.dto.auth.PasswordChangeRequest;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.exception.InvalidCurrentPasswordException;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.UserRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.beanvalidation.MethodValidationInterceptor;

@ExtendWith(MockitoExtension.class)
class PasswordServiceTest {

    private static final ValidatorFactory VALIDATOR_FACTORY =
            Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = VALIDATOR_FACTORY.getValidator();

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private PasswordService passwordService;

    @AfterAll
    static void closeValidatorFactory() {
        VALIDATOR_FACTORY.close();
    }

    @BeforeEach
    void setUp() {
        passwordService = new PasswordService(userRepository, passwordEncoder);
    }

    @Test
    void changesOnlyPasswordHashAfterVerifyingCurrentPassword() {
        UUID userId = UUID.randomUUID();
        Role role = new Role(RoleCode.STUDENT);
        User user = new User("A Student", "student@example.lk", "old-hash", role);
        user.setProfileImageUrl("https://example.lk/profile.png");
        ReflectionTestUtils.setField(user, "id", userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("CurrentPassword123", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("NewPassword123")).thenReturn("new-hash");

        passwordService.changePassword(
                userId,
                new PasswordChangeRequest(
                        "CurrentPassword123", "NewPassword123", "NewPassword123"));

        assertEquals("new-hash", user.getPasswordHash());
        assertEquals("A Student", user.getFullName());
        assertEquals("student@example.lk", user.getEmail());
        assertEquals(role, user.getRole());
        assertEquals("https://example.lk/profile.png", user.getProfileImageUrl());
        verify(passwordEncoder).matches("CurrentPassword123", "old-hash");
        verify(passwordEncoder).encode("NewPassword123");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void rejectsIncorrectCurrentPasswordWithoutEncodingOrChangingPassword() {
        UUID userId = UUID.randomUUID();
        User user =
                new User(
                        "A Student",
                        "student@example.lk",
                        "old-hash",
                        new Role(RoleCode.STUDENT));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongCurrent123", "old-hash")).thenReturn(false);

        InvalidCurrentPasswordException exception =
                assertThrows(
                        InvalidCurrentPasswordException.class,
                        () ->
                                passwordService.changePassword(
                                        userId,
                                        new PasswordChangeRequest(
                                                "WrongCurrent123",
                                                "NewPassword123",
                                                "NewPassword123")));

        assertEquals("Current password is incorrect.", exception.getMessage());
        assertEquals("old-hash", user.getPasswordHash());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void rejectsMissingUser() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(
                UserNotFoundException.class,
                () ->
                        passwordService.changePassword(
                                userId,
                                new PasswordChangeRequest(
                                        "CurrentPassword123",
                                        "NewPassword123",
                                        "NewPassword123")));
    }

    @Test
    void validatesPasswordConfirmationAtTheServiceBoundary() {
        ConstraintViolation<?> violation =
                assertInvalidRequest(
                        new PasswordChangeRequest(
                                "CurrentPassword123",
                                "NewPassword123",
                                "DifferentPassword123"));

        assertTrue(violation.getPropertyPath().toString().contains("confirmNewPassword"));
    }

    @Test
    void validatesMinimumNewPasswordLengthAtTheServiceBoundary() {
        ConstraintViolation<?> violation =
                assertInvalidRequest(
                        new PasswordChangeRequest("CurrentPassword123", "ShortPass1", "ShortPass1"));

        assertTrue(violation.getPropertyPath().toString().contains("newPassword"));
    }

    @Test
    void validatesBcryptUtf8ByteLimitAtTheServiceBoundary() {
        String tooLongForBcrypt = "é".repeat(37);
        ConstraintViolation<?> violation =
                assertInvalidRequest(
                        new PasswordChangeRequest(
                                "CurrentPassword123", tooLongForBcrypt, tooLongForBcrypt));

        assertTrue(violation.getPropertyPath().toString().contains("newPassword"));
    }

    @Test
    void changePasswordMethodIsTransactional() throws NoSuchMethodException {
        assertTrue(
                PasswordService.class
                        .getMethod("changePassword", UUID.class, PasswordChangeRequest.class)
                        .isAnnotationPresent(Transactional.class));
    }

    private ConstraintViolation<?> assertInvalidRequest(PasswordChangeRequest request) {
        ProxyFactory proxyFactory = new ProxyFactory(passwordService);
        proxyFactory.setProxyTargetClass(true);
        proxyFactory.addAdvice(new MethodValidationInterceptor(VALIDATOR));
        PasswordService validatedService = (PasswordService) proxyFactory.getProxy();

        Set<ConstraintViolation<?>> violations =
                assertThrows(
                                jakarta.validation.ConstraintViolationException.class,
                                () ->
                                        validatedService.changePassword(
                                                UUID.randomUUID(), request))
                        .getConstraintViolations();

        return violations.iterator().next();
    }
}
