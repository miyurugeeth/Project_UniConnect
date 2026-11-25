package com.uniconnect.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.uniconnect.dto.auth.AuthenticationResponse;
import com.uniconnect.dto.profile.UserProfileResponse;
import com.uniconnect.dto.registration.ProfessionalRegistrationRequest;
import com.uniconnect.dto.registration.StudentRegistrationRequest;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.exception.DuplicateEmailException;
import com.uniconnect.exception.InvalidCredentialsException;
import com.uniconnect.service.AuthenticationService;
import com.uniconnect.service.RegistrationService;
import jakarta.servlet.ServletException;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private RegistrationService registrationService;
    @Mock private AuthenticationService authenticationService;

    private MockMvc mockMvc;
    private LocalValidatorFactoryBean validator;

    @BeforeEach
    void setUp() {
        validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc =
                MockMvcBuilders.standaloneSetup(
                                new AuthController(registrationService, authenticationService))
                        .setValidator(validator)
                        .build();
    }

    @AfterEach
    void tearDown() {
        validator.destroy();
    }

    @Test
    void studentRegistrationReturnsCreatedSafeProfile() throws Exception {
        UserProfileResponse response =
                new UserProfileResponse(
                        UUID.fromString("468316d7-3df0-437f-a907-5fd1fc703e64"),
                        "Test Student",
                        "student@example.lk",
                        null,
                        RoleCode.STUDENT,
                        null,
                        null);
        when(registrationService.registerStudent(any(StudentRegistrationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(
                        post("/api/auth/register/student")
                                .contentType("application/json")
                                .content(validStudentRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.email").value("student@example.lk"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        verify(registrationService).registerStudent(any(StudentRegistrationRequest.class));
    }

    @Test
    void professionalRegistrationReturnsCreatedSafeProfile() throws Exception {
        UserProfileResponse response =
                new UserProfileResponse(
                        UUID.fromString("9b4660fa-6afc-42e2-8278-2542d683037a"),
                        "Test Professional",
                        "professional@example.lk",
                        null,
                        RoleCode.PROFESSIONAL,
                        null,
                        null);
        when(registrationService.registerProfessional(
                        any(ProfessionalRegistrationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(
                        post("/api/auth/register/professional")
                                .contentType("application/json")
                                .content(validProfessionalRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("PROFESSIONAL"))
                .andExpect(jsonPath("$.email").value("professional@example.lk"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        verify(registrationService)
                .registerProfessional(any(ProfessionalRegistrationRequest.class));
    }

    @Test
    void loginReturnsSuccessfulAuthenticationResponseWithoutPasswordHash() throws Exception {
        AuthenticationResponse response =
                new AuthenticationResponse(
                        "test.jwt.token",
                        "Bearer",
                        900,
                        UUID.fromString("468316d7-3df0-437f-a907-5fd1fc703e64"),
                        RoleCode.STUDENT,
                        "Test Student",
                        "student@example.lk",
                        null);
        when(authenticationService.authenticate(any())).thenReturn(response);

        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType("application/json")
                                .content(
                                        """
                                        {
                                          "email": "student@example.lk",
                                          "password": "StrongPassword123"
                                        }
                                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("test.jwt.token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresInSeconds").value(900))
                .andExpect(jsonPath("$.userId").value(response.userId().toString()))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.fullName").value("Test Student"))
                .andExpect(jsonPath("$.email").value("student@example.lk"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        verify(authenticationService).authenticate(any());
    }

    @Test
    void rejectsInvalidRegistrationAndLoginBodiesBeforeCallingServices() throws Exception {
        mockMvc.perform(
                        post("/api/auth/register/student")
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        post("/api/auth/register/professional")
                                .contentType("application/json")
                                .content(
                                        """
                                        {
                                          "fullName": "",
                                          "email": "not-an-email",
                                          "password": "short",
                                          "confirmPassword": "different"
                                        }
                                        """))
                .andExpect(status().isBadRequest());
        mockMvc.perform(
                        post("/api/auth/login")
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isBadRequest());

        verify(registrationService, never())
                .registerStudent(any(StudentRegistrationRequest.class));
        verify(registrationService, never())
                .registerProfessional(any(ProfessionalRegistrationRequest.class));
        verify(authenticationService, never()).authenticate(any());
    }

    @Test
    void propagatesServiceExceptionsWithoutRevealingInternalDetails() {
        when(registrationService.registerStudent(any(StudentRegistrationRequest.class)))
                .thenThrow(new DuplicateEmailException());
        when(authenticationService.authenticate(any()))
                .thenThrow(new InvalidCredentialsException());

        ServletException registrationException =
                assertThrows(
                        ServletException.class,
                        () ->
                                mockMvc.perform(
                                        post("/api/auth/register/student")
                                                .contentType("application/json")
                                                .content(validStudentRequest())));
        ServletException loginException =
                assertThrows(
                        ServletException.class,
                        () ->
                                mockMvc.perform(
                                        post("/api/auth/login")
                                                .contentType("application/json")
                                                .content(
                                                        """
                                                        {
                                                          "email": "student@example.lk",
                                                          "password": "StrongPassword123"
                                                        }
                                                        """)));

        assertEquals(DuplicateEmailException.class, rootCause(registrationException).getClass());
        assertEquals(InvalidCredentialsException.class, rootCause(loginException).getClass());
    }

    @Test
    void doesNotExposeAnAdminRegistrationEndpoint() throws Exception {
        mockMvc.perform(
                        post("/api/auth/register/admin")
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isNotFound());

        verify(registrationService, never())
                .registerStudent(any(StudentRegistrationRequest.class));
        verify(registrationService, never())
                .registerProfessional(any(ProfessionalRegistrationRequest.class));
    }

    private static Throwable rootCause(Throwable throwable) {
        Throwable cause = throwable;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause;
    }

    private static String validStudentRequest() {
        return """
                {
                  "fullName": "Test Student",
                  "email": "student@example.lk",
                  "password": "StrongPassword123",
                  "confirmPassword": "StrongPassword123",
                  "universityName": "University of Colombo",
                  "faculty": "Science",
                  "departmentOrField": "Computer Science",
                  "batchYear": 2024,
                  "currentAcademicYear": 2,
                  "skills": ["Java", "React"],
                  "interests": ["AI"]
                }
                """;
    }

    private static String validProfessionalRequest() {
        return """
                {
                  "fullName": "Test Professional",
                  "email": "professional@example.lk",
                  "password": "StrongPassword123",
                  "confirmPassword": "StrongPassword123",
                  "companyName": "UniConnect",
                  "industry": "Technology",
                  "jobPosition": "Software Engineer",
                  "skills": ["Java", "Spring Boot"]
                }
                """;
    }
}
