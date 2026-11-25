package com.uniconnect.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniconnect.config.JwtConfiguration;
import com.uniconnect.config.SecurityConfig;
import com.uniconnect.dto.auth.PasswordChangeRequest;
import com.uniconnect.service.PasswordService;
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

class PasswordControllerTest {

    private static final String ISSUER = "uniconnect-password-controller-test";
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mockMvc;
    private JwtEncoder jwtEncoder;
    private PasswordService passwordService;

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
                PasswordController.class,
                TestServiceConfiguration.class);
        context.refresh();

        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(context.getBean(FilterChainProxy.class))
                        .build();
        jwtEncoder = context.getBean(JwtEncoder.class);
        passwordService = context.getBean(PasswordService.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void authenticatedUserCanChangePasswordAndReceivesNoContent() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");

        mockMvc.perform(
                        put("/api/users/me/password")
                                .header("Authorization", bearerToken(userId))
                                .contentType("application/json")
                                .content(validRequest()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        ArgumentCaptor<PasswordChangeRequest> requestCaptor =
                ArgumentCaptor.forClass(PasswordChangeRequest.class);
        verify(passwordService).changePassword(eq(userId), requestCaptor.capture());
        assertEquals("CurrentPassword123", requestCaptor.getValue().currentPassword());
        assertEquals("NewPassword1234", requestCaptor.getValue().newPassword());
        assertEquals("NewPassword1234", requestCaptor.getValue().confirmNewPassword());
    }

    @Test
    void unauthenticatedRequestIsRejectedWithoutCallingService() throws Exception {
        mockMvc.perform(
                        put("/api/users/me/password")
                                .contentType("application/json")
                                .content(validRequest()))
                .andExpect(status().isUnauthorized());

        verify(passwordService, never()).changePassword(any(), any(PasswordChangeRequest.class));
    }

    @Test
    void invalidRequestBodyReturnsBadRequestWithoutCallingService() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");

        mockMvc.perform(
                        put("/api/users/me/password")
                                .header("Authorization", bearerToken(userId))
                                .contentType("application/json")
                                .content(
                                        """
                                        {
                                          "currentPassword": "",
                                          "newPassword": "short",
                                          "confirmNewPassword": "different"
                                        }
                                        """))
                .andExpect(status().isBadRequest());

        verify(passwordService, never()).changePassword(any(), any(PasswordChangeRequest.class));
    }

    @Test
    void clientSuppliedUserIdCannotOverrideJwtSubject() throws Exception {
        UUID authenticatedUserId =
                UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        UUID otherUserId = UUID.fromString("8335d4bd-77c5-4585-ac63-ce103c08b3a5");
        String requestWithClientId =
                validRequest().replace(
                        "\"currentPassword\":",
                        "\"userId\": \"" + otherUserId + "\",\n"
                                + "\"currentPassword\":");

        mockMvc.perform(
                        put("/api/users/me/password")
                                .queryParam("userId", otherUserId.toString())
                                .header("Authorization", bearerToken(authenticatedUserId))
                                .contentType("application/json")
                                .content(requestWithClientId))
                .andExpect(status().isNoContent());

        verify(passwordService)
                .changePassword(eq(authenticatedUserId), any(PasswordChangeRequest.class));
    }

    private String bearerToken(UUID userId) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(ISSUER)
                        .subject(userId.toString())
                        .issuedAt(issuedAt)
                        .expiresAt(issuedAt.plusSeconds(900))
                        .claim("role", "STUDENT")
                        .build();
        return "Bearer "
                + jwtEncoder
                        .encode(
                                JwtEncoderParameters.from(
                                        JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                        .getTokenValue();
    }

    private static String validRequest() {
        return """
                {
                  "currentPassword": "CurrentPassword123",
                  "newPassword": "NewPassword1234",
                  "confirmNewPassword": "NewPassword1234"
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
        PasswordService passwordService() {
            return org.mockito.Mockito.mock(PasswordService.class);
        }
    }
}
