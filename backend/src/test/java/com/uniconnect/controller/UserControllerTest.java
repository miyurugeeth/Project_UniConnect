package com.uniconnect.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniconnect.config.JwtConfiguration;
import com.uniconnect.config.SecurityConfig;
import com.uniconnect.dto.profile.AdminProfileUpdateRequest;
import com.uniconnect.dto.profile.PublicUserProfileResponse;
import com.uniconnect.dto.profile.ProfessionalProfileUpdateRequest;
import com.uniconnect.dto.profile.StudentProfileUpdateRequest;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.service.UserProfileService;
import jakarta.validation.Validation;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.support.TestPropertySourceUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

class UserControllerTest {

    private static final String ISSUER = "uniconnect-user-controller-test";
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mockMvc;
    private JwtEncoder jwtEncoder;
    private UserProfileService userProfileService;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        TestPropertySourceUtils.addInlinedPropertiesToEnvironment(
                context,
                "app.jwt.secret="
                        + Base64.getEncoder().encodeToString(new byte[32]),
                "app.jwt.issuer=" + ISSUER,
                "app.jwt.access-token-ttl-seconds=900",
                "app.cors.allowed-origin=" + ALLOWED_ORIGIN);
        context.register(
                JwtConfiguration.class,
                SecurityConfig.class,
                TestMvcConfiguration.class,
                UserController.class,
                TestServiceConfiguration.class);
        context.refresh();

        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(context.getBean(FilterChainProxy.class))
                        .build();
        jwtEncoder = context.getBean(JwtEncoder.class);
        userProfileService = context.getBean(UserProfileService.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void authenticatedUserCanRetrieveTheirOwnProfile() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        when(userProfileService.getMyProfile(userId)).thenReturn(userProfile(userId));

        mockMvc.perform(get("/api/users/me").header("Authorization", bearerToken(userId, "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.role").value("STUDENT"));

        verify(userProfileService).getMyProfile(userId);
    }

    @Test
    void studentCanUpdateTheirProfileUsingTheJwtSubject() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        when(userProfileService.updateStudentProfile(
                        eq(userId), any(StudentProfileUpdateRequest.class)))
                .thenReturn(userProfile(userId));

        mockMvc.perform(
                        put("/api/users/me")
                                .header("Authorization", bearerToken(userId, "STUDENT"))
                                .contentType("application/json")
                                .content(studentUpdateRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"));

        ArgumentCaptor<StudentProfileUpdateRequest> requestCaptor =
                ArgumentCaptor.forClass(StudentProfileUpdateRequest.class);
        verify(userProfileService).updateStudentProfile(eq(userId), requestCaptor.capture());
        assertEquals("Updated Student", requestCaptor.getValue().fullName());
    }

    @Test
    void professionalCanUpdateTheirProfile() throws Exception {
        UUID userId = UUID.fromString("1d7f6628-3695-497d-a854-3c86297e6d80");
        when(userProfileService.updateProfessionalProfile(
                        eq(userId), any(ProfessionalProfileUpdateRequest.class)))
                .thenReturn(userProfile(userId, RoleCode.PROFESSIONAL));

        mockMvc.perform(
                        put("/api/users/me")
                                .header("Authorization", bearerToken(userId, "PROFESSIONAL"))
                                .contentType("application/json")
                                .content(professionalUpdateRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("PROFESSIONAL"));

        verify(userProfileService)
                .updateProfessionalProfile(eq(userId), any(ProfessionalProfileUpdateRequest.class));
    }

    @Test
    void adminCanUpdateTheirProfile() throws Exception {
        UUID userId = UUID.fromString("ef463fe7-0ec0-45e8-a4fd-bad6c2fdf772");
        when(userProfileService.updateAdminProfile(eq(userId), any(AdminProfileUpdateRequest.class)))
                .thenReturn(userProfile(userId, RoleCode.ADMIN));

        mockMvc.perform(
                        put("/api/users/me")
                                .header("Authorization", bearerToken(userId, "ADMIN"))
                                .contentType("application/json")
                                .content(adminUpdateRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        verify(userProfileService)
                .updateAdminProfile(eq(userId), any(AdminProfileUpdateRequest.class));
    }

    @Test
    void publicProfileCanBeRetrievedWithoutExposingEmailOrPasswordHash() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        when(userProfileService.getPublicProfile(userId))
                .thenReturn(
                        new PublicUserProfileResponse(
                                userId, "Public Student", null, RoleCode.STUDENT, null, null));

        mockMvc.perform(get("/api/users/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.fullName").value("Public Student"))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        verify(userProfileService).getPublicProfile(userId);
    }

    @Test
    void unauthenticatedRequestsToOwnProfileEndpointsAreRejected() throws Exception {
        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(
                        put("/api/users/me")
                                .contentType("application/json")
                                .content(studentUpdateRequest()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ignoresClientSuppliedUserIdsAndUsesTheAuthenticatedJwtSubject() throws Exception {
        UUID authenticatedUserId =
                UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        UUID otherUserId = UUID.fromString("8335d4bd-77c5-4585-ac63-ce103c08b3a5");
        when(userProfileService.updateStudentProfile(
                        eq(authenticatedUserId), any(StudentProfileUpdateRequest.class)))
                .thenReturn(userProfile(authenticatedUserId));
        String requestWithClientId =
                studentUpdateRequest()
                        .replace(
                                "\"fullName\": \"Updated Student\"",
                                "\"id\": \"" + otherUserId + "\","
                                        + "\"userId\": \"" + otherUserId + "\","
                                        + "\"fullName\": \"Updated Student\"");

        mockMvc.perform(
                        put("/api/users/me")
                                .queryParam("userId", otherUserId.toString())
                                .header(
                                        "Authorization",
                                        bearerToken(authenticatedUserId, "STUDENT"))
                                .contentType("application/json")
                                .content(requestWithClientId))
                .andExpect(status().isOk());

        verify(userProfileService)
                .updateStudentProfile(
                        eq(authenticatedUserId), any(StudentProfileUpdateRequest.class));
    }

    @Test
    void invalidProfileUpdateBodyReturnsBadRequest() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");

        mockMvc.perform(
                        put("/api/users/me")
                                .header("Authorization", bearerToken(userId, "STUDENT"))
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    private String bearerToken(UUID userId, String role) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(ISSUER)
                        .subject(userId.toString())
                        .issuedAt(issuedAt)
                        .expiresAt(issuedAt.plusSeconds(900))
                        .claim("role", role)
                        .build();
        return "Bearer "
                + jwtEncoder
                        .encode(
                                JwtEncoderParameters.from(
                                        JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                        .getTokenValue();
    }

    private static UserProfileResponse userProfile(UUID userId) {
        return userProfile(userId, RoleCode.STUDENT);
    }

    private static UserProfileResponse userProfile(UUID userId, RoleCode role) {
        return new UserProfileResponse(
                userId, "Test User", "test@example.lk", null, role, null, null);
    }

    private static String studentUpdateRequest() {
        return """
                {
                  "fullName": "Updated Student",
                  "profileImageUrl": null,
                  "universityName": "University of Colombo",
                  "faculty": "Science",
                  "departmentOrField": "Computer Science",
                  "batchYear": 2024,
                  "currentAcademicYear": 2,
                  "skills": ["Java"],
                  "interests": ["AI"]
                }
                """;
    }

    private static String professionalUpdateRequest() {
        return """
                {
                  "fullName": "Updated Professional",
                  "profileImageUrl": null,
                  "companyName": "UniConnect",
                  "industry": "Technology",
                  "jobPosition": "Engineer",
                  "skills": ["Spring"]
                }
                """;
    }

    private static String adminUpdateRequest() {
        return """
                {
                  "fullName": "Updated Admin",
                  "profileImageUrl": null
                }
                """;
    }

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    static class TestMvcConfiguration {

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper()
                    .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        }

        @Bean
        LocalValidatorFactoryBean validator() {
            return new LocalValidatorFactoryBean();
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class TestServiceConfiguration {

        @Bean
        UserProfileService userProfileService() {
            return org.mockito.Mockito.mock(UserProfileService.class);
        }
    }
}
