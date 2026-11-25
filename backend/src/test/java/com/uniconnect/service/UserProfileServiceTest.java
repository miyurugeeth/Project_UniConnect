package com.uniconnect.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.uniconnect.dto.profile.AdminProfileUpdateRequest;
import com.uniconnect.dto.profile.ProfessionalProfileUpdateRequest;
import com.uniconnect.dto.profile.PublicUserProfileResponse;
import com.uniconnect.dto.profile.StudentProfileUpdateRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.entity.ProfessionalProfile;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.StudentProfile;
import com.uniconnect.entity.User;
import com.uniconnect.exception.ProfileNotFoundException;
import com.uniconnect.exception.ProfileTypeMismatchException;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.ProfessionalProfileRepository;
import com.uniconnect.repository.StudentProfileRepository;
import com.uniconnect.repository.UserRepository;
import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private StudentProfileRepository studentProfileRepository;
    @Mock private ProfessionalProfileRepository professionalProfileRepository;

    private UserProfileService userProfileService;

    @BeforeEach
    void setUp() {
        userProfileService =
                new UserProfileService(
                        userRepository, studentProfileRepository, professionalProfileRepository);
    }

    @Test
    void retrievesAndUpdatesStudentProfileWithoutChangingEmailOrRole() {
        UUID userId = UUID.randomUUID();
        User user = user(userId, RoleCode.STUDENT);
        StudentProfile profile = studentProfile(user);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(studentProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        UserProfileResponse currentProfile = userProfileService.getMyProfile(userId);
        assertEquals(RoleCode.STUDENT, currentProfile.role());
        assertEquals("University of Colombo", currentProfile.studentProfile().universityName());
        assertNull(currentProfile.professionalProfile());

        UserProfileResponse updatedProfile =
                userProfileService.updateStudentProfile(
                        userId,
                        new StudentProfileUpdateRequest(
                                "Updated Student",
                                "https://example.lk/new.png",
                                "University of Peradeniya",
                                "Engineering",
                                "Computer Engineering",
                                2023,
                                2,
                                Set.of("Java", "SQL"),
                                Set.of("Robotics")));

        assertEquals("Updated Student", user.getFullName());
        assertEquals("https://example.lk/new.png", user.getProfileImageUrl());
        assertEquals("student@example.lk", user.getEmail());
        assertEquals(RoleCode.STUDENT, user.getRole().getCode());
        assertEquals("University of Peradeniya", profile.getUniversityName());
        assertEquals(Set.of("Java", "SQL"), profile.getSkills());
        assertEquals(Set.of("Robotics"), profile.getInterests());
        assertEquals("Updated Student", updatedProfile.fullName());
    }

    @Test
    void retrievesAndUpdatesProfessionalProfile() {
        UUID userId = UUID.randomUUID();
        User user = user(userId, RoleCode.PROFESSIONAL);
        ProfessionalProfile profile = professionalProfile(user);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(professionalProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        PublicUserProfileResponse publicProfile = userProfileService.getPublicProfile(userId);
        assertEquals(RoleCode.PROFESSIONAL, publicProfile.role());
        assertEquals("Example Company", publicProfile.professionalProfile().companyName());
        assertNull(publicProfile.studentProfile());
        assertFalse(
                Arrays.stream(PublicUserProfileResponse.class.getRecordComponents())
                        .map(RecordComponent::getName)
                        .anyMatch(name -> name.equals("email") || name.equals("passwordHash")));

        UserProfileResponse updatedProfile =
                userProfileService.updateProfessionalProfile(
                        userId,
                        new ProfessionalProfileUpdateRequest(
                                "Updated Professional",
                                null,
                                "New Company",
                                "Finance",
                                "Analyst",
                                Set.of("Excel")));

        assertEquals("Updated Professional", user.getFullName());
        assertEquals("professional@example.lk", user.getEmail());
        assertEquals(RoleCode.PROFESSIONAL, user.getRole().getCode());
        assertEquals("New Company", profile.getCompanyName());
        assertEquals(Set.of("Excel"), profile.getSkills());
        assertEquals("New Company", updatedProfile.professionalProfile().companyName());
    }

    @Test
    void adminCanReadOwnAndPublicBaseProfileAndUpdateOnlyCommonFields() {
        UUID userId = UUID.randomUUID();
        User user = user(userId, RoleCode.ADMIN);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserProfileResponse ownProfile = userProfileService.getMyProfile(userId);
        PublicUserProfileResponse publicProfile = userProfileService.getPublicProfile(userId);
        assertEquals(RoleCode.ADMIN, ownProfile.role());
        assertNull(ownProfile.studentProfile());
        assertNull(ownProfile.professionalProfile());
        assertEquals(RoleCode.ADMIN, publicProfile.role());
        assertNull(publicProfile.studentProfile());
        assertNull(publicProfile.professionalProfile());

        UserProfileResponse updatedProfile =
                userProfileService.updateAdminProfile(
                        userId,
                        new AdminProfileUpdateRequest(
                                "Updated Admin", "https://example.lk/admin.png"));

        assertEquals("Updated Admin", user.getFullName());
        assertEquals("https://example.lk/admin.png", user.getProfileImageUrl());
        assertEquals("admin@example.lk", user.getEmail());
        assertEquals(RoleCode.ADMIN, user.getRole().getCode());
        assertNull(updatedProfile.studentProfile());
        assertNull(updatedProfile.professionalProfile());
    }

    @Test
    void throwsUserNotFoundForMissingOwnOrPublicUser() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> userProfileService.getMyProfile(userId));
        assertThrows(
                UserNotFoundException.class, () -> userProfileService.getPublicProfile(userId));
    }

    @Test
    void throwsProfileNotFoundWhenRoleSpecificProfileIsMissing() {
        UUID studentId = UUID.randomUUID();
        User student = user(studentId, RoleCode.STUDENT);
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));
        when(studentProfileRepository.findById(studentId)).thenReturn(Optional.empty());

        assertThrows(
                ProfileNotFoundException.class,
                () -> userProfileService.getMyProfile(studentId));

        UUID professionalId = UUID.randomUUID();
        User professional = user(professionalId, RoleCode.PROFESSIONAL);
        when(userRepository.findById(professionalId)).thenReturn(Optional.of(professional));
        when(professionalProfileRepository.findById(professionalId))
                .thenReturn(Optional.empty());

        assertThrows(
                ProfileNotFoundException.class,
                () -> userProfileService.getPublicProfile(professionalId));
    }

    @Test
    void rejectsProfileUpdateWhenRequestTypeDoesNotMatchUserRole() {
        UUID professionalId = UUID.randomUUID();
        User professional = user(professionalId, RoleCode.PROFESSIONAL);
        when(userRepository.findById(professionalId)).thenReturn(Optional.of(professional));

        assertThrows(
                ProfileTypeMismatchException.class,
                () ->
                        userProfileService.updateStudentProfile(
                                professionalId, studentUpdateRequest()));

        UUID studentId = UUID.randomUUID();
        User student = user(studentId, RoleCode.STUDENT);
        when(userRepository.findById(studentId)).thenReturn(Optional.of(student));

        assertThrows(
                ProfileTypeMismatchException.class,
                () ->
                        userProfileService.updateProfessionalProfile(
                                studentId, professionalUpdateRequest()));
        assertThrows(
                ProfileTypeMismatchException.class,
                () ->
                        userProfileService.updateAdminProfile(
                                studentId, new AdminProfileUpdateRequest("Name", null)));
    }

    @Test
    void responseRecordsDoNotExposePasswordHash() {
        assertTrue(
                Arrays.stream(UserProfileResponse.class.getRecordComponents())
                        .noneMatch(component -> component.getName().equals("passwordHash")));
        assertTrue(
                Arrays.stream(PublicUserProfileResponse.class.getRecordComponents())
                        .noneMatch(component -> component.getName().equals("passwordHash")));
    }

    private static User user(UUID id, RoleCode roleCode) {
        User user =
                new User(
                        "A User",
                        roleCode.name().toLowerCase() + "@example.lk",
                        "$2a$not-a-real-password-hash",
                        new Role(roleCode));
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static StudentProfile studentProfile(User user) {
        StudentProfile profile =
                new StudentProfile(
                        user,
                        "University of Colombo",
                        "Science",
                        "Computer Science",
                        2024,
                        1);
        profile.getSkills().add("Java");
        profile.getInterests().add("Robotics");
        return profile;
    }

    private static ProfessionalProfile professionalProfile(User user) {
        ProfessionalProfile profile =
                new ProfessionalProfile(
                        user, "Example Company", "Technology", "Software Engineer");
        profile.getSkills().add("Java");
        return profile;
    }

    private static StudentProfileUpdateRequest studentUpdateRequest() {
        return new StudentProfileUpdateRequest(
                "Updated Student",
                null,
                "University of Peradeniya",
                "Engineering",
                "Computer Engineering",
                2023,
                2,
                Set.of("Java"),
                Set.of("Robotics"));
    }

    private static ProfessionalProfileUpdateRequest professionalUpdateRequest() {
        return new ProfessionalProfileUpdateRequest(
                "Updated Professional",
                null,
                "New Company",
                "Finance",
                "Analyst",
                Set.of("Excel"));
    }
}
