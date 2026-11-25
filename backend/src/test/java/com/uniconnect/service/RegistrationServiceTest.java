package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.dto.registration.ProfessionalRegistrationRequest;
import com.uniconnect.dto.registration.StudentRegistrationRequest;
import com.uniconnect.entity.ProfessionalProfile;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.StudentProfile;
import com.uniconnect.entity.User;
import com.uniconnect.exception.DuplicateEmailException;
import com.uniconnect.repository.ProfessionalProfileRepository;
import com.uniconnect.repository.RoleRepository;
import com.uniconnect.repository.StudentProfileRepository;
import com.uniconnect.repository.UserRepository;
import java.sql.SQLException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private ProfessionalProfileRepository professionalProfileRepository;

    private RegistrationService registrationService;
    private BCryptPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        registrationService =
                new RegistrationService(
                        userRepository,
                        roleRepository,
                        studentProfileRepository,
                        professionalProfileRepository,
                        passwordEncoder);
    }

    @Test
    void registersStudentWithNormalizedEmailStudentRoleAndBcryptPassword() {
        Role studentRole = new Role(RoleCode.STUDENT);
        when(roleRepository.findById(RoleCode.STUDENT)).thenReturn(Optional.of(studentRole));
        stubUserSave();
        when(studentProfileRepository.saveAndFlush(any(StudentProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response =
                registrationService.registerStudent(studentRequest("  Student@Example.LK  "));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("student@example.lk", savedUser.getEmail());
        assertTrue(passwordEncoder.matches("LongPassword123", savedUser.getPasswordHash()));
        assertEquals(RoleCode.STUDENT, response.role());
        assertNotNull(response.id());
        assertNotNull(response.studentProfile());
        assertEquals(Set.of("Java"), response.studentProfile().skills());
        assertEquals(Set.of("Robotics"), response.studentProfile().interests());
        assertEquals("University of Colombo", response.studentProfile().universityName());
        assertEquals("student@example.lk", response.email());
        assertFalse(response.professionalProfile() != null);

        InOrder saveOrder = inOrder(userRepository, studentProfileRepository);
        saveOrder.verify(userRepository).saveAndFlush(any(User.class));
        saveOrder.verify(studentProfileRepository).saveAndFlush(any(StudentProfile.class));
    }

    @Test
    void registersProfessionalWithProfessionalRoleAndBcryptPassword() {
        Role professionalRole = new Role(RoleCode.PROFESSIONAL);
        when(roleRepository.findById(RoleCode.PROFESSIONAL))
                .thenReturn(Optional.of(professionalRole));
        stubUserSave();
        when(professionalProfileRepository.saveAndFlush(any(ProfessionalProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response =
                registrationService.registerProfessional(
                        new ProfessionalRegistrationRequest(
                                "A Professional",
                                "PRO@example.lk",
                                "LongPassword456",
                                "LongPassword456",
                                "Example Company",
                                "Technology",
                                "Engineer",
                                Set.of("Java"),
                                null));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        assertEquals("pro@example.lk", userCaptor.getValue().getEmail());
        assertTrue(
                passwordEncoder.matches(
                        "LongPassword456", userCaptor.getValue().getPasswordHash()));
        assertEquals(RoleCode.PROFESSIONAL, response.role());
        assertNotNull(response.professionalProfile());
        assertEquals("Example Company", response.professionalProfile().companyName());
        assertEquals(Set.of("Java"), response.professionalProfile().skills());
        assertFalse(response.studentProfile() != null);

        InOrder saveOrder = inOrder(userRepository, professionalProfileRepository);
        saveOrder.verify(userRepository).saveAndFlush(any(User.class));
        saveOrder.verify(professionalProfileRepository)
                .saveAndFlush(any(ProfessionalProfile.class));
    }

    @Test
    void rejectsEmailAlreadyFoundByPrecheckWithoutSaving() {
        when(userRepository.existsByEmail("student@example.lk")).thenReturn(true);

        assertThrows(
                DuplicateEmailException.class,
                () -> registrationService.registerStudent(studentRequest("Student@Example.LK")));

        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(roleRepository, never()).findById(any());
    }

    @Test
    void translatesOnlyNamedEmailUniqueConstraintViolation() {
        Role studentRole = new Role(RoleCode.STUDENT);
        when(roleRepository.findById(RoleCode.STUDENT)).thenReturn(Optional.of(studentRole));
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(
                        new DataIntegrityViolationException(
                                "duplicate email",
                                new ConstraintViolationException(
                                        "duplicate email", null, "uq_users_email")));

        assertThrows(
                DuplicateEmailException.class,
                () -> registrationService.registerStudent(studentRequest("student@example.lk")));
    }

    @Test
    void recognizesSqlServerDuplicateOnlyWhenTheNamedEmailConstraintIsInvolved() {
        Role studentRole = new Role(RoleCode.STUDENT);
        when(roleRepository.findById(RoleCode.STUDENT)).thenReturn(Optional.of(studentRole));
        SQLException sqlException =
                new SQLException(
                        "Violation of UNIQUE KEY constraint 'uq_users_email'.",
                        "23000",
                        2627);
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate email", sqlException));

        assertThrows(
                DuplicateEmailException.class,
                () -> registrationService.registerStudent(studentRequest("student@example.lk")));
    }

    @Test
    void propagatesUnrelatedDatabaseErrorsAndProfileFailures() {
        Role studentRole = new Role(RoleCode.STUDENT);
        when(roleRepository.findById(RoleCode.STUDENT)).thenReturn(Optional.of(studentRole));
        DataIntegrityViolationException unrelatedUserFailure =
                new DataIntegrityViolationException(
                        "foreign key failure",
                        new ConstraintViolationException(
                                "foreign key failure", null, "fk_users_roles"));
        when(userRepository.saveAndFlush(any(User.class))).thenThrow(unrelatedUserFailure);

        assertSame(
                unrelatedUserFailure,
                assertThrows(
                        DataIntegrityViolationException.class,
                        () ->
                                registrationService.registerStudent(
                                        studentRequest("student@example.lk"))));

        when(userRepository.saveAndFlush(any(User.class)))
                .thenAnswer(
                        invocation -> {
                            User user = invocation.getArgument(0);
                            ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
                            return user;
                        });
        DataIntegrityViolationException profileFailure =
                new DataIntegrityViolationException("profile save failed");
        when(studentProfileRepository.saveAndFlush(any(StudentProfile.class)))
                .thenThrow(profileFailure);

        assertSame(
                profileFailure,
                assertThrows(
                        DataIntegrityViolationException.class,
                        () ->
                                registrationService.registerStudent(
                                        studentRequest("student@example.lk"))));
        InOrder saveOrder = inOrder(userRepository, studentProfileRepository);
        saveOrder.verify(userRepository).saveAndFlush(any(User.class));
        saveOrder.verify(studentProfileRepository).saveAndFlush(any(StudentProfile.class));
    }

    @Test
    void bothRegistrationMethodsAreTransactional() throws NoSuchMethodException {
        assertNotNull(
                RegistrationService.class
                        .getMethod("registerStudent", StudentRegistrationRequest.class)
                        .getAnnotation(Transactional.class));
        assertNotNull(
                RegistrationService.class
                        .getMethod("registerProfessional", ProfessionalRegistrationRequest.class)
                        .getAnnotation(Transactional.class));
    }

    private void stubUserSave() {
        when(userRepository.saveAndFlush(any(User.class)))
                .thenAnswer(
                        invocation -> {
                            User user = invocation.getArgument(0);
                            ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
                            return user;
                        });
    }

    private static StudentRegistrationRequest studentRequest(String email) {
        return new StudentRegistrationRequest(
                "A Student",
                email,
                "LongPassword123",
                "LongPassword123",
                "University of Colombo",
                "Science",
                "Computer Science",
                2024,
                1,
                Set.of("Java"),
                Set.of("Robotics"),
                null);
    }
}
