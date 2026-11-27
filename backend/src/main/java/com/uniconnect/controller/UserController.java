package com.uniconnect.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniconnect.dto.profile.AdminProfileUpdateRequest;
import com.uniconnect.dto.profile.ProfessionalProfileUpdateRequest;
import com.uniconnect.dto.profile.PublicUserProfileResponse;
import com.uniconnect.dto.profile.StudentProfileUpdateRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.service.UserProfileService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    public UserController(
            UserProfileService userProfileService,
            ObjectMapper objectMapper,
            Validator validator) {
        this.userProfileService = userProfileService;
        this.objectMapper = objectMapper;
        this.validator = validator;
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(@AuthenticationPrincipal Jwt principal) {
        return userProfileService.getMyProfile(currentUserId(principal));
    }

    @PutMapping("/me")
    public UserProfileResponse updateMyProfile(
            @AuthenticationPrincipal Jwt principal, @Valid @RequestBody JsonNode requestBody) {
        UUID currentUserId = currentUserId(principal);
        RoleCode role = RoleCode.valueOf(principal.getClaimAsString("role"));

        return switch (role) {
            case STUDENT ->
                    userProfileService.updateStudentProfile(
                            currentUserId,
                            validatedRequest(requestBody, StudentProfileUpdateRequest.class));
            case PROFESSIONAL ->
                    userProfileService.updateProfessionalProfile(
                            currentUserId,
                            validatedRequest(requestBody, ProfessionalProfileUpdateRequest.class));
            case ADMIN ->
                    userProfileService.updateAdminProfile(
                            currentUserId,
                            validatedRequest(requestBody, AdminProfileUpdateRequest.class));
        };
    }

    @GetMapping("/{id}")
    public PublicUserProfileResponse getPublicProfile(@PathVariable UUID id) {
        return userProfileService.getPublicProfile(id);
    }

    private <T> T validatedRequest(JsonNode requestBody, Class<T> requestType) {
        if (requestBody == null) {
            throw invalidProfileRequest();
        }

        final T request;
        try {
            request = objectMapper.treeToValue(requestBody, requestType);
        } catch (JsonProcessingException exception) {
            throw invalidProfileRequest();
        }

        if (request == null) {
            throw invalidProfileRequest();
        }

        Set<ConstraintViolation<T>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            throw invalidProfileRequest();
        }
        return request;
    }

    private static UUID currentUserId(Jwt principal) {
        return UUID.fromString(principal.getSubject());
    }

    private static ResponseStatusException invalidProfileRequest() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Profile update request is invalid.");
    }
}
