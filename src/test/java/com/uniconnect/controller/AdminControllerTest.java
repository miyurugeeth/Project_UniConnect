package com.uniconnect.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniconnect.config.JwtConfiguration;
import com.uniconnect.config.SecurityConfig;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.repository.RoleRepository;
import com.uniconnect.repository.UserRepository;
import com.uniconnect.service.AdminUserService;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import org.springframework.test.util.ReflectionTestUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.crypto.password.PasswordEncoder;
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

class AdminControllerTest {

    private static final String ISSUER = "uniconnect-admin-controller-test";
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mockMvc;
    private JwtEncoder jwtEncoder;

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
                AdminController.class,
                TestServiceConfiguration.class);
        context.refresh();

        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(context.getBean(FilterChainProxy.class))
                        .build();
        jwtEncoder = context.getBean(JwtEncoder.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void authenticatedAdminCanCreateAnotherAdmin() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        UserRepository userRepository = context.getBean(UserRepository.class);
        RoleRepository roleRepository = context.getBean(RoleRepository.class);
        PasswordEncoder passwordEncoder = context.getBean(PasswordEncoder.class);
        when(roleRepository.findById(RoleCode.ADMIN))
                .thenReturn(Optional.of(new Role(RoleCode.ADMIN)));
        when(passwordEncoder.encode("StrongPassword123")).thenReturn("test-password-hash");
        when(userRepository.saveAndFlush(any(User.class)))
                .thenAnswer(
                        invocation -> {
                            User user = invocation.getArgument(0);
                            ReflectionTestUtils.setField(user, "id", userId);
                            return user;
                        });

        mockMvc.perform(
                        post("/api/admin/users")
                                .header("Authorization", bearerToken("ADMIN"))
                                .contentType("application/json")
                                .content(validRequestWithClientRole()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.email").value("new-admin@example.lk"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        verify(userRepository).existsByEmail("new-admin@example.lk");
        verify(roleRepository).findById(RoleCode.ADMIN);
        verify(passwordEncoder).encode("StrongPassword123");
        verify(userRepository).saveAndFlush(any(User.class));
    }

    @Test
    void studentCannotCreateAdmin() throws Exception {
        mockMvc.perform(
                        post("/api/admin/users")
                                .header("Authorization", bearerToken("STUDENT"))
                                .contentType("application/json")
                                .content(validRequest()))
                .andExpect(status().isForbidden());

        verify(context.getBean(UserRepository.class), never()).existsByEmail(anyString());
    }

    @Test
    void professionalCannotCreateAdmin() throws Exception {
        mockMvc.perform(
                        post("/api/admin/users")
                                .header("Authorization", bearerToken("PROFESSIONAL"))
                                .contentType("application/json")
                                .content(validRequest()))
                .andExpect(status().isForbidden());

        verify(context.getBean(UserRepository.class), never()).existsByEmail(anyString());
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(
                        post("/api/admin/users")
                                .contentType("application/json")
                                .content(validRequest()))
                .andExpect(status().isUnauthorized());

        verify(context.getBean(UserRepository.class), never()).existsByEmail(anyString());
    }

    @Test
    void invalidRequestBodyReturnsBadRequest() throws Exception {
        mockMvc.perform(
                        post("/api/admin/users")
                                .header("Authorization", bearerToken("ADMIN"))
                                .contentType("application/json")
                                .content("{}"))
                .andExpect(status().isBadRequest());

        verify(context.getBean(UserRepository.class), never()).existsByEmail(anyString());
    }

    private String bearerToken(String role) {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(ISSUER)
                        .subject("d53a7324-8005-48d8-a821-c9b4c4399fc8")
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

    private static String validRequest() {
        return """
                {
                  "fullName": "New Admin",
                  "email": "new-admin@example.lk",
                  "password": "StrongPassword123",
                  "confirmPassword": "StrongPassword123"
                }
                """;
    }

    private static String validRequestWithClientRole() {
        return """
                {
                  "fullName": "New Admin",
                  "email": "new-admin@example.lk",
                  "password": "StrongPassword123",
                  "confirmPassword": "StrongPassword123",
                  "role": "STUDENT"
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
        UserRepository userRepository() {
            return org.mockito.Mockito.mock(UserRepository.class);
        }

        @Bean
        RoleRepository roleRepository() {
            return org.mockito.Mockito.mock(RoleRepository.class);
        }

        @Bean
        PasswordEncoder passwordEncoder() {
            return org.mockito.Mockito.mock(PasswordEncoder.class);
        }

        @Bean
        AdminUserService adminUserService(
                UserRepository userRepository,
                RoleRepository roleRepository,
                PasswordEncoder passwordEncoder) {
            return new AdminUserService(userRepository, roleRepository, passwordEncoder);
        }
    }
}
