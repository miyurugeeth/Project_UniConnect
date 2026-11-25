package com.uniconnect.service;

import com.uniconnect.dto.profile.AdminProfileUpdateRequest;
import com.uniconnect.dto.profile.ProfessionalProfileDetailsResponse;
import com.uniconnect.dto.profile.ProfessionalProfileUpdateRequest;
import com.uniconnect.dto.profile.PublicUserProfileResponse;
import com.uniconnect.dto.profile.StudentProfileDetailsResponse;
import com.uniconnect.dto.profile.StudentProfileUpdateRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.entity.ProfessionalProfile;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.StudentProfile;
import com.uniconnect.entity.User;
import com.uniconnect.exception.ProfileNotFoundException;
import com.uniconnect.exception.ProfileTypeMismatchException;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.ProfessionalProfileRepository;
import com.uniconnect.repository.StudentProfileRepository;
import com.uniconnect.repository.UserRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;

    public UserProfileService(
            UserRepository userRepository,
            StudentProfileRepository studentProfileRepository,
            ProfessionalProfileRepository professionalProfileRepository) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.professionalProfileRepository = professionalProfileRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(UUID currentUserId) {
        return toUserProfileResponse(requireUser(currentUserId));
    }

    @Transactional
    public UserProfileResponse updateStudentProfile(
            UUID currentUserId, StudentProfileUpdateRequest request) {
        User user = requireUser(currentUserId);
        requireRole(user, RoleCode.STUDENT);
        StudentProfile profile = requireStudentProfile(currentUserId);

        user.setFullName(request.fullName());
        user.setProfileImageUrl(request.profileImageUrl());
        profile.setUniversityName(request.universityName());
        profile.setFaculty(request.faculty());
        profile.setDepartmentOrField(request.departmentOrField());
        profile.setBatchYear(request.batchYear());
        profile.setCurrentAcademicYear(request.currentAcademicYear());
        profile.getSkills().clear();
        profile.getSkills().addAll(request.skills());
        profile.getInterests().clear();
        profile.getInterests().addAll(request.interests());

        return toUserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfessionalProfile(
            UUID currentUserId, ProfessionalProfileUpdateRequest request) {
        User user = requireUser(currentUserId);
        requireRole(user, RoleCode.PROFESSIONAL);
        ProfessionalProfile profile = requireProfessionalProfile(currentUserId);

        user.setFullName(request.fullName());
        user.setProfileImageUrl(request.profileImageUrl());
        profile.setCompanyName(request.companyName());
        profile.setIndustry(request.industry());
        profile.setJobPosition(request.jobPosition());
        profile.getSkills().clear();
        profile.getSkills().addAll(request.skills());

        return toUserProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateAdminProfile(
            UUID currentUserId, AdminProfileUpdateRequest request) {
        User user = requireUser(currentUserId);
        requireRole(user, RoleCode.ADMIN);

        user.setFullName(request.fullName());
        user.setProfileImageUrl(request.profileImageUrl());

        return toUserProfileResponse(user);
    }

    @Transactional(readOnly = true)
    public PublicUserProfileResponse getPublicProfile(UUID targetUserId) {
        return toPublicUserProfileResponse(requireUser(targetUserId));
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
    }

    private StudentProfile requireStudentProfile(UUID userId) {
        return studentProfileRepository
                .findById(userId)
                .orElseThrow(() -> new ProfileNotFoundException(RoleCode.STUDENT));
    }

    private ProfessionalProfile requireProfessionalProfile(UUID userId) {
        return professionalProfileRepository
                .findById(userId)
                .orElseThrow(() -> new ProfileNotFoundException(RoleCode.PROFESSIONAL));
    }

    private static void requireRole(User user, RoleCode expectedRole) {
        RoleCode actualRole = user.getRole().getCode();
        if (actualRole != expectedRole) {
            throw new ProfileTypeMismatchException();
        }
    }

    private UserProfileResponse toUserProfileResponse(User user) {
        RoleCode role = user.getRole().getCode();
        StudentProfileDetailsResponse studentDetails = null;
        ProfessionalProfileDetailsResponse professionalDetails = null;

        if (role == RoleCode.STUDENT) {
            studentDetails = toStudentProfileDetails(requireStudentProfile(user.getId()));
        } else if (role == RoleCode.PROFESSIONAL) {
            professionalDetails =
                    toProfessionalProfileDetails(requireProfessionalProfile(user.getId()));
        }

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getProfileImageUrl(),
                role,
                studentDetails,
                professionalDetails);
    }

    private PublicUserProfileResponse toPublicUserProfileResponse(User user) {
        RoleCode role = user.getRole().getCode();
        StudentProfileDetailsResponse studentDetails = null;
        ProfessionalProfileDetailsResponse professionalDetails = null;

        if (role == RoleCode.STUDENT) {
            studentDetails = toStudentProfileDetails(requireStudentProfile(user.getId()));
        } else if (role == RoleCode.PROFESSIONAL) {
            professionalDetails =
                    toProfessionalProfileDetails(requireProfessionalProfile(user.getId()));
        }

        return new PublicUserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getProfileImageUrl(),
                role,
                studentDetails,
                professionalDetails);
    }

    private static StudentProfileDetailsResponse toStudentProfileDetails(StudentProfile profile) {
        return new StudentProfileDetailsResponse(
                profile.getUniversityName(),
                profile.getFaculty(),
                profile.getDepartmentOrField(),
                profile.getBatchYear(),
                profile.getCurrentAcademicYear(),
                profile.getSkills(),
                profile.getInterests());
    }

    private static ProfessionalProfileDetailsResponse toProfessionalProfileDetails(
            ProfessionalProfile profile) {
        return new ProfessionalProfileDetailsResponse(
                profile.getCompanyName(),
                profile.getIndustry(),
                profile.getJobPosition(),
                profile.getSkills());
    }
}
