package com.uniconnect.service;

import com.uniconnect.dto.admin.AdminUserCreationRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.exception.DuplicateEmailException;
import com.uniconnect.repository.RoleRepository;
import com.uniconnect.repository.UserRepository;
import java.sql.SQLException;
import java.util.Locale;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserService {

    private static final String EMAIL_UNIQUE_CONSTRAINT = "uq_users_email";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserProfileResponse createAdminUser(AdminUserCreationRequest request) {
        String email = normalizeEmail(request.email());
        ensureEmailAvailable(email);
        Role adminRole = findRequiredRole(RoleCode.ADMIN);

        User user =
                new User(
                        request.fullName(),
                        email,
                        passwordEncoder.encode(request.password()),
                        adminRole);
        User savedUser = saveUser(user);

        return new UserProfileResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getProfileImageUrl(),
                savedUser.getRole().getCode(),
                null,
                null);
    }

    private void ensureEmailAvailable(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }
    }

    private Role findRequiredRole(RoleCode roleCode) {
        return roleRepository
                .findById(roleCode)
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "Required role is missing from the database: " + roleCode));
    }

    private User saveUser(User user) {
        try {
            return userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            if (isEmailUniqueConstraintViolation(exception)) {
                throw new DuplicateEmailException();
            }
            throw exception;
        }
    }

    private static boolean isEmailUniqueConstraintViolation(
            DataIntegrityViolationException exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof ConstraintViolationException constraintViolation
                    && EMAIL_UNIQUE_CONSTRAINT.equalsIgnoreCase(
                            constraintViolation.getConstraintName())) {
                return true;
            }

            if (cause instanceof SQLException sqlException
                    && isSqlServerDuplicateError(sqlException)
                    && sqlException.getMessage() != null
                    && sqlException
                            .getMessage()
                            .toLowerCase(Locale.ROOT)
                            .contains(EMAIL_UNIQUE_CONSTRAINT)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isSqlServerDuplicateError(SQLException exception) {
        int errorCode = exception.getErrorCode();
        return errorCode == 2601 || errorCode == 2627;
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
