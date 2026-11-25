package com.uniconnect.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.uniconnect.dto.admin.AdminUserCreationRequest;
import com.uniconnect.entity.Role;
import com.uniconnect.entity.RoleCode;
import com.uniconnect.entity.User;
import com.uniconnect.repository.RoleRepository;
import com.uniconnect.repository.UserRepository;
import com.uniconnect.service.AdminUserService;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.support.TestPropertySourceUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.security.crypto.password.PasswordEncoder;

class SecurityConfigTest {

    private static final String ISSUER = "uniconnect-security-test";
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mockMvc;
    private JwtEncoder jwtEncoder;
    private AdminUserService adminUserService;

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
                TestEndpoints.class,
                TestAdminServiceConfiguration.class);
        context.refresh();

        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(context.getBean(FilterChainProxy.class))
                        .build();
        jwtEncoder = context.getBean(JwtEncoder.class);
        adminUserService = context.getBean(AdminUserService.class);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        context.close();
    }

    @Test
    void permitsOnlySpecifiedPublicAuthenticationAndProfileEndpoints() throws Exception {
        mockMvc.perform(post("/api/auth/register/student")).andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/register/professional")).andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/login")).andExpect(status().isOk());
        mockMvc.perform(get("/api/users/9f41d7a1")).andExpect(status().isOk());
    }

    @Test
    void protectsCurrentUserAndPasswordEndpointsAndMatchesMeBeforePublicIdPattern()
            throws Exception {
        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/users/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/users/me/password")).andExpect(status().isUnauthorized());
        mockMvc.perform(
                        get("/api/users/me")
                                .header("Authorization", bearerToken("STUDENT")))
                .andExpect(status().isOk());
    }

    @Test
    void authenticatesRequestsWithValidJwtAndRejectsInvalidSignature() throws Exception {
        mockMvc.perform(
                        get("/api/users/me")
                                .header("Authorization", bearerToken("STUDENT")))
                .andExpect(status().isOk());
        mockMvc.perform(
                        get("/api/users/me")
                                .header("Authorization", "Bearer " + tokenSignedWithDifferentKey()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void convertsStudentProfessionalAndAdminRolesToTheirAuthorities() throws Exception {
        mockMvc.perform(
                        get("/api/students/probe")
                                .header("Authorization", bearerToken("STUDENT")))
                .andExpect(status().isOk());
        mockMvc.perform(
                        get("/api/students/probe")
                                .header("Authorization", bearerToken("PROFESSIONAL")))
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        get("/api/professionals/probe")
                                .header("Authorization", bearerToken("PROFESSIONAL")))
                .andExpect(status().isOk());
        mockMvc.perform(
                        get("/api/professionals/probe")
                                .header("Authorization", bearerToken("STUDENT")))
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        get("/api/admin/probe")
                                .header("Authorization", bearerToken("ADMIN")))
                .andExpect(status().isOk());
        mockMvc.perform(
                        get("/api/admin/probe")
                                .header("Authorization", bearerToken("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void requiresAuthenticationForMessagesAndAllowsEveryAuthenticatedRole() throws Exception {
        mockMvc.perform(get("/api/messages/probe")).andExpect(status().isUnauthorized());
        for (String role : List.of("STUDENT", "PROFESSIONAL", "ADMIN")) {
            mockMvc.perform(
                            get("/api/messages/probe")
                                    .header("Authorization", bearerToken(role)))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void rejectsJwtWithUnknownRole() throws Exception {
        mockMvc.perform(
                        get("/api/users/me")
                                .header("Authorization", bearerToken("UNKNOWN")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deniesUnmatchedEndpointsEvenForAuthenticatedUsers() throws Exception {
        mockMvc.perform(
                        get("/api/unmatched")
                                .header("Authorization", bearerToken("ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void corsAllowsOnlyTheConfiguredDevelopmentOrigin() throws Exception {
        mockMvc.perform(
                        options("/api/users/me")
                                .header("Origin", ALLOWED_ORIGIN)
                                .header(
                                        "Access-Control-Request-Method",
                                        HttpMethod.PUT.name())
                                .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", ALLOWED_ORIGIN));

        mockMvc.perform(
                        options("/api/users/me")
                                .header("Origin", "https://unapproved.example")
                                .header(
                                        "Access-Control-Request-Method",
                                        HttpMethod.PUT.name()))
                .andExpect(status().isForbidden());
    }

    @Test
    void methodSecurityProtectsAdminUserCreation() {
        setAuthentication("ROLE_STUDENT");

        assertThrows(
                AccessDeniedException.class,
                () -> adminUserService.createAdminUser(adminRequest()));
        verify(context.getBean(UserRepository.class), never()).existsByEmail(anyString());
    }

    @Test
    void methodSecurityAllowsAdminToCreateAdminUser() {
        UserRepository userRepository = context.getBean(UserRepository.class);
        RoleRepository roleRepository = context.getBean(RoleRepository.class);
        PasswordEncoder passwordEncoder = context.getBean(PasswordEncoder.class);
        when(roleRepository.findById(RoleCode.ADMIN))
                .thenReturn(Optional.of(new Role(RoleCode.ADMIN)));
        when(passwordEncoder.encode(anyString())).thenReturn("test-password-hash");
        when(userRepository.saveAndFlush(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        setAuthentication("ROLE_ADMIN");

        assertDoesNotThrow(() -> adminUserService.createAdminUser(adminRequest()));
        verify(userRepository).saveAndFlush(any(User.class));
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

    private String tokenSignedWithDifferentKey() {
        byte[] otherKey = new byte[32];
        java.util.Arrays.fill(otherKey, (byte) 1);
        JwtEncoder otherEncoder =
                new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(
                        new ImmutableSecret<>(
                                new SecretKeySpec(otherKey, "HmacSHA256")));
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims =
                JwtClaimsSet.builder()
                        .issuer(ISSUER)
                        .subject("d53a7324-8005-48d8-a821-c9b4c4399fc8")
                        .issuedAt(issuedAt)
                        .expiresAt(issuedAt.plusSeconds(900))
                        .claim("role", "STUDENT")
                        .build();
        return otherEncoder
                .encode(
                        JwtEncoderParameters.from(
                                JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    private static void setAuthentication(String authority) {
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                "test-user",
                                "not-a-password",
                                List.of(new SimpleGrantedAuthority(authority))));
    }

    private static AdminUserCreationRequest adminRequest() {
        return new AdminUserCreationRequest(
                "Test Administrator",
                "test-admin",
                "admin@example.lk",
                "StrongPassword123",
                "StrongPassword123");
    }

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    static class TestMvcConfiguration {
    }

    @RestController
    static class TestEndpoints {

        @PostMapping("/api/auth/register/student")
        String registerStudent() {
            return "registered";
        }

        @PostMapping("/api/auth/register/professional")
        String registerProfessional() {
            return "registered";
        }

        @PostMapping("/api/auth/login")
        String login() {
            return "logged-in";
        }

        @GetMapping("/api/users/me")
        String currentUser() {
            return "current-user";
        }

        @PutMapping("/api/users/me")
        String updateCurrentUser() {
            return "updated";
        }

        @PutMapping("/api/users/me/password")
        String updatePassword() {
            return "updated";
        }

        @GetMapping("/api/users/{id}")
        String publicProfile() {
            return "public-profile";
        }

        @GetMapping("/api/admin/probe")
        String adminEndpoint() {
            return "admin";
        }

        @GetMapping("/api/students/probe")
        String studentEndpoint() {
            return "student";
        }

        @GetMapping("/api/professionals/probe")
        String professionalEndpoint() {
            return "professional";
        }

        @GetMapping("/api/messages/probe")
        String messagesEndpoint() {
            return "messages";
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class TestAdminServiceConfiguration {

        @Bean
        UserRepository userRepository() {
            return mock(UserRepository.class);
        }

        @Bean
        RoleRepository roleRepository() {
            return mock(RoleRepository.class);
        }

        @Bean
        PasswordEncoder passwordEncoder() {
            return mock(PasswordEncoder.class);
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
