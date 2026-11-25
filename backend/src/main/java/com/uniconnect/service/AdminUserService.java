package com.uniconnect.service;

import com.uniconnect.dto.admin.AdminUserCreationRequest;
import com.uniconnect.dto.admin.AdminDashboardSummaryResponse;
import com.uniconnect.dto.admin.AdminUserResponse;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.exception.DuplicateEmailException;
import com.uniconnect.exception.AdminBootstrapUnavailableException;
import com.uniconnect.repository.RoleRepository;
import com.uniconnect.repository.UserRepository;
import java.sql.SQLException;
import java.util.Locale;
import java.util.UUID;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserService {

    private static final String EMAIL_UNIQUE_CONSTRAINT = "uq_users_email";
    private static final String USERNAME_UNIQUE_CONSTRAINT = "ux_users_username";

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
        return createAdminAccount(request);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public UserProfileResponse bootstrapFirstAdmin(AdminUserCreationRequest request) {
        if (userRepository.countByRole_Code(RoleCode.ADMIN) != 0) {
            throw new AdminBootstrapUnavailableException();
        }
        return createAdminAccount(request);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public Page<AdminUserResponse> listUsers(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page request.");
        }
        return userRepository
                .findAll(PageRequest.of(page, size, Sort.by("fullName").ascending()))
                .map(AdminUserService::toAdminUserResponse);
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public AdminDashboardSummaryResponse getDashboardSummary() {
        return new AdminDashboardSummaryResponse(
                userRepository.count(),
                userRepository.countByRole_Code(RoleCode.ADMIN),
                userRepository.countBySuspendedTrue());
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public AdminUserResponse setUserSuspended(UUID userId, boolean suspended, UUID adminId) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User was not found."));
        if (user.getRole().getCode() == RoleCode.ADMIN || userId.equals(adminId)) {
            throw new AccessDeniedException("Administrators cannot suspend admin accounts.");
        }
        user.setSuspended(suspended);
        return toAdminUserResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public boolean isBootstrapAvailable() {
        return userRepository.countByRole_Code(RoleCode.ADMIN) == 0;
    }

    private UserProfileResponse createAdminAccount(AdminUserCreationRequest request) {
        String email = normalizeEmail(request.email());
        String username = normalizeUsername(request.username());
        ensureEmailAvailable(email);
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already in use.");
        }
        Role adminRole = findRequiredRole(RoleCode.ADMIN);

        User user =
                new User(
                        request.fullName(),
                        email,
                        passwordEncoder.encode(request.password()),
                        adminRole);
        user.setUsername(username);
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

    private static AdminUserResponse toAdminUserResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().getCode(),
                user.isSuspended());
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
            if (isNamedUniqueConstraintViolation(exception, USERNAME_UNIQUE_CONSTRAINT)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "That username is already in use.");
            }
            throw exception;
        }
    }

    private static boolean isEmailUniqueConstraintViolation(
            DataIntegrityViolationException exception) {
        return isNamedUniqueConstraintViolation(exception, EMAIL_UNIQUE_CONSTRAINT);
    }

    private static boolean isNamedUniqueConstraintViolation(
            DataIntegrityViolationException exception, String constraintName) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof ConstraintViolationException constraintViolation
                    && constraintName.equalsIgnoreCase(
                            constraintViolation.getConstraintName())) {
                return true;
            }

            if (cause instanceof SQLException sqlException
                    && isSqlServerDuplicateError(sqlException)
                    && sqlException.getMessage() != null
                    && sqlException
                            .getMessage()
                            .toLowerCase(Locale.ROOT)
                            .contains(constraintName.toLowerCase(Locale.ROOT))) {
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

    private static String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
