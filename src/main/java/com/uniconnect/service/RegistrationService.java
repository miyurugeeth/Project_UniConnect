package com.uniconnect.service;

import com.uniconnect.dto.profile.ProfessionalProfileDetailsResponse;
import com.uniconnect.dto.profile.StudentProfileDetailsResponse;
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
import java.util.Locale;
import java.util.Set;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private static final String EMAIL_UNIQUE_CONSTRAINT = "uq_users_email";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            StudentProfileRepository studentProfileRepository,
            ProfessionalProfileRepository professionalProfileRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.professionalProfileRepository = professionalProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserProfileResponse registerStudent(StudentRegistrationRequest request) {
        String email = normalizeEmail(request.email());
        ensureEmailAvailable(email);
        Role role = findRequiredRole(RoleCode.STUDENT);

        User user =
                new User(
                        request.fullName(),
                        email,
                        passwordEncoder.encode(request.password()),
                        role);
        user.setProfileImageUrl(request.profileImageUrl());
        User savedUser = saveUser(user);

        StudentProfile profile =
                new StudentProfile(
                        savedUser,
                        request.universityName(),
                        request.faculty(),
                        request.departmentOrField(),
                        request.batchYear(),
                        request.currentAcademicYear());
        profile.getSkills().addAll(orEmpty(request.skills()));
        profile.getInterests().addAll(orEmpty(request.interests()));
        StudentProfile savedProfile = studentProfileRepository.saveAndFlush(profile);

        StudentProfileDetailsResponse profileDetails =
                new StudentProfileDetailsResponse(
                        savedProfile.getUniversityName(),
                        savedProfile.getFaculty(),
                        savedProfile.getDepartmentOrField(),
                        savedProfile.getBatchYear(),
                        savedProfile.getCurrentAcademicYear(),
                        savedProfile.getSkills(),
                        savedProfile.getInterests());

        return new UserProfileResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getProfileImageUrl(),
                savedUser.getRole().getCode(),
                profileDetails,
                null);
    }

    @Transactional
    public UserProfileResponse registerProfessional(ProfessionalRegistrationRequest request) {
        String email = normalizeEmail(request.email());
        ensureEmailAvailable(email);
        Role role = findRequiredRole(RoleCode.PROFESSIONAL);

        User user =
                new User(
                        request.fullName(),
                        email,
                        passwordEncoder.encode(request.password()),
                        role);
        user.setProfileImageUrl(request.profileImageUrl());
        User savedUser = saveUser(user);

        ProfessionalProfile profile =
                new ProfessionalProfile(
                        savedUser,
                        request.companyName(),
                        request.industry(),
                        request.jobPosition());
        profile.getSkills().addAll(orEmpty(request.skills()));
        ProfessionalProfile savedProfile = professionalProfileRepository.saveAndFlush(profile);

        ProfessionalProfileDetailsResponse profileDetails =
                new ProfessionalProfileDetailsResponse(
                        savedProfile.getCompanyName(),
                        savedProfile.getIndustry(),
                        savedProfile.getJobPosition(),
                        savedProfile.getSkills());

        return new UserProfileResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getProfileImageUrl(),
                savedUser.getRole().getCode(),
                null,
                profileDetails);
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

    private static <T> Set<T> orEmpty(Set<T> values) {
        return values == null ? Set.of() : values;
    }
}
