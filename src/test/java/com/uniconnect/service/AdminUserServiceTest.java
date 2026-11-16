package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uniconnect.dto.admin.AdminUserCreationRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.exception.DuplicateEmailException;
import com.uniconnect.repository.RoleRepository;
import com.uniconnect.repository.UserRepository;
import java.lang.reflect.RecordComponent;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;

    private AdminUserService adminUserService;
    private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        adminUserService = new AdminUserService(userRepository, roleRepository, passwordEncoder);
    }

    @Test
    void createsAdminWithNormalizedEmailInternalRoleAndBcryptPassword() {
        Role adminRole = new Role(RoleCode.ADMIN);
        when(roleRepository.findById(RoleCode.ADMIN)).thenReturn(Optional.of(adminRole));
        when(userRepository.saveAndFlush(any(User.class)))
                .thenAnswer(
                        invocation -> {
                            User user = invocation.getArgument(0);
                            ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
                            return user;
                        });

        UserProfileResponse response =
                adminUserService.createAdminUser(adminRequest("  Admin@Example.LK  "));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("admin@example.lk", savedUser.getEmail());
        assertEquals(RoleCode.ADMIN, savedUser.getRole().getCode());
        assertTrue(passwordEncoder.matches("AdminPassword123", savedUser.getPasswordHash()));

        assertNotNull(response.id());
        assertEquals("admin@example.lk", response.email());
        assertEquals(RoleCode.ADMIN, response.role());
        assertNull(response.profileImageUrl());
        assertNull(response.studentProfile());
        assertNull(response.professionalProfile());
        assertFalse(
                Arrays.stream(UserProfileResponse.class.getRecordComponents())
                        .map(RecordComponent::getName)
                        .anyMatch(
                                name ->
                                        name.equals("passwordHash")
                                                || name.equals("password")));
        verify(roleRepository).findById(RoleCode.ADMIN);
    }

    @Test
    void rejectsEmailAlreadyFoundByPrecheckWithoutSaving() {
        when(userRepository.existsByEmail("admin@example.lk")).thenReturn(true);

        assertThrows(
                DuplicateEmailException.class,
                () -> adminUserService.createAdminUser(adminRequest("Admin@Example.LK")));

        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(roleRepository, never()).findById(any());
    }

    @Test
    void translatesNamedEmailConstraintViolationDuringSave() {
        when(roleRepository.findById(RoleCode.ADMIN))
                .thenReturn(Optional.of(new Role(RoleCode.ADMIN)));
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(
                        new DataIntegrityViolationException(
                                "duplicate email",
                                new ConstraintViolationException(
                                        "duplicate email", null, "uq_users_email")));

        assertThrows(
                DuplicateEmailException.class,
                () -> adminUserService.createAdminUser(adminRequest("admin@example.lk")));
    }

    @Test
    void recognizesSqlServerEmailConstraintRace() {
        when(roleRepository.findById(RoleCode.ADMIN))
                .thenReturn(Optional.of(new Role(RoleCode.ADMIN)));
        SQLException sqlException =
                new SQLException(
                        "Violation of UNIQUE KEY constraint 'uq_users_email'.",
                        "23000",
                        2627);
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate email", sqlException));

        assertThrows(
                DuplicateEmailException.class,
                () -> adminUserService.createAdminUser(adminRequest("admin@example.lk")));
    }

    @Test
    void propagatesUnrelatedDatabaseErrors() {
        when(roleRepository.findById(RoleCode.ADMIN))
                .thenReturn(Optional.of(new Role(RoleCode.ADMIN)));
        DataIntegrityViolationException unrelatedFailure =
                new DataIntegrityViolationException(
                        "foreign key failure",
                        new ConstraintViolationException(
                                "foreign key failure", null, "fk_users_roles"));
        when(userRepository.saveAndFlush(any(User.class))).thenThrow(unrelatedFailure);

        assertSame(
                unrelatedFailure,
                assertThrows(
                        DataIntegrityViolationException.class,
                        () -> adminUserService.createAdminUser(adminRequest("admin@example.lk"))));
    }

    @Test
    void createAdminUserIsTransactional() throws NoSuchMethodException {
        assertTrue(
                AdminUserService.class
                        .getMethod("createAdminUser", AdminUserCreationRequest.class)
                        .isAnnotationPresent(Transactional.class));
    }

    private static AdminUserCreationRequest adminRequest(String email) {
        return new AdminUserCreationRequest(
                "A New Admin",
                email,
                "AdminPassword123",
                "AdminPassword123");
    }
}
