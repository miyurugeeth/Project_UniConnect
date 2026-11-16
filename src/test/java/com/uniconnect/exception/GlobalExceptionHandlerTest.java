package com.uniconnect.exception;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;
    private LocalValidatorFactoryBean validator;

    @BeforeEach
    void setUp() {
        validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc =
                MockMvcBuilders.standaloneSetup(new ExceptionTestController())
                        .setControllerAdvice(new GlobalExceptionHandler())
                        .setValidator(validator)
                        .build();
    }

    @AfterEach
    void tearDown() {
        validator.destroy();
    }

    @Test
    void mapsDuplicateEmailToConflict() throws Exception {
        assertError("/errors/duplicate", HttpStatus.CONFLICT, "An account with this email already exists.");
    }

    @Test
    void mapsInvalidCredentialsToUnauthorized() throws Exception {
        assertError("/errors/credentials", HttpStatus.UNAUTHORIZED, "Invalid email or password.");
    }

    @Test
    void mapsExistingNotFoundExceptionsToNotFound() throws Exception {
        assertError("/errors/user-not-found", HttpStatus.NOT_FOUND, "User was not found.");
        assertError(
                "/errors/profile-not-found",
                HttpStatus.NOT_FOUND,
                "STUDENT profile was not found.");
    }

    @Test
    void mapsOtherExistingBusinessExceptionsToBadRequest() throws Exception {
        assertError(
                "/errors/current-password",
                HttpStatus.BAD_REQUEST,
                "Current password is incorrect.");
        assertError(
                "/errors/profile-type",
                HttpStatus.BAD_REQUEST,
                "This profile update is not valid for the user's role.");
    }

    @Test
    void mapsMethodArgumentValidationToFieldLevelBadRequest() throws Exception {
        mockMvc.perform(
                        post("/errors/validated")
                                .contentType("application/json")
                                .content("{\"name\":\"\",\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("email")))
                .andExpect(jsonPath("$.message", containsString("name")))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.path").value("/errors/validated"));
    }

    @Test
    void mapsConstraintViolationToBadRequest() throws Exception {
        mockMvc.perform(get("/errors/constraint-violation"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request validation failed."))
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void mapsMalformedRequestBodyToBadRequest() throws Exception {
        mockMvc.perform(
                        post("/errors/validated")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is invalid."));
    }

    @Test
    void mapsAccessDeniedThatReachesMvcToForbidden() throws Exception {
        assertError("/errors/access-denied", HttpStatus.FORBIDDEN, "Access is denied.");
    }

    @Test
    void preservesSafeClientErrorStatusForResponseStatusException() throws Exception {
        assertError(
                "/errors/response-status",
                HttpStatus.BAD_REQUEST,
                "Request could not be processed.");
    }

    @Test
    void mapsUnexpectedExceptionToGenericInternalServerError() throws Exception {
        mockMvc.perform(get("/errors/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("An unexpected error occurred."))
                .andExpect(jsonPath("$.message", org.hamcrest.Matchers.not(containsString("SQL"))))
                .andExpect(jsonPath("$.path").value("/errors/unexpected"));
    }

    private void assertError(String path, HttpStatus expectedStatus, String expectedMessage)
            throws Exception {
        mockMvc.perform(get(path))
                .andExpect(status().is(expectedStatus.value()))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.status").value(expectedStatus.value()))
                .andExpect(jsonPath("$.error").value(expectedStatus.getReasonPhrase()))
                .andExpect(jsonPath("$.message").value(expectedMessage))
                .andExpect(jsonPath("$.path").value(path));
    }

    @RestController
    static class ExceptionTestController {

        @GetMapping("/errors/duplicate")
        String duplicateEmail() {
            throw new DuplicateEmailException();
        }

        @GetMapping("/errors/credentials")
        String invalidCredentials() {
            throw new InvalidCredentialsException();
        }

        @GetMapping("/errors/user-not-found")
        String userNotFound() {
            throw new UserNotFoundException();
        }

        @GetMapping("/errors/profile-not-found")
        String profileNotFound() {
            throw new ProfileNotFoundException(com.uniconnect.entity.RoleCode.STUDENT);
        }

        @GetMapping("/errors/current-password")
        String invalidCurrentPassword() {
            throw new InvalidCurrentPasswordException();
        }

        @GetMapping("/errors/profile-type")
        String profileTypeMismatch() {
            throw new ProfileTypeMismatchException();
        }

        @GetMapping("/errors/constraint-violation")
        String constraintViolation() {
            throw new ConstraintViolationException("sensitive provider message", Set.of());
        }

        @GetMapping("/errors/access-denied")
        String accessDenied() {
            throw new AccessDeniedException("internal authorization detail");
        }

        @GetMapping("/errors/response-status")
        String responseStatus() {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "internal exception reason");
        }

        @GetMapping("/errors/unexpected")
        String unexpected() {
            throw new IllegalStateException("SQL query and secret data");
        }

        @PostMapping("/errors/validated")
        String validated(@Valid @RequestBody ValidationRequest request) {
            return "valid";
        }
    }

    record ValidationRequest(@NotBlank String name, @Email String email) {
    }
}
