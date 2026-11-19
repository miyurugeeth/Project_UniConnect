package com.uniconnect.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniconnect.config.JwtConfiguration;
import com.uniconnect.config.SecurityConfig;
import com.uniconnect.dto.notification.NotificationResponse;
import com.uniconnect.entity.NotificationType;
import com.uniconnect.service.NotificationService;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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

class NotificationControllerTest {

    private static final String ISSUER = "uniconnect-notification-controller-test";
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mockMvc;
    private JwtEncoder jwtEncoder;
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        TestPropertySourceUtils.addInlinedPropertiesToEnvironment(
                context,
                "app.jwt.secret=" + Base64.getEncoder().encodeToString(new byte[32]),
                "app.jwt.issuer=" + ISSUER,
                "app.jwt.access-token-ttl-seconds=900",
                "app.cors.allowed-origin=" + ALLOWED_ORIGIN);
        context.register(
                JwtConfiguration.class,
                SecurityConfig.class,
                TestMvcConfiguration.class,
                NotificationController.class,
                TestServiceConfiguration.class);
        context.refresh();

        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(context.getBean(FilterChainProxy.class))
                        .build();
        jwtEncoder = context.getBean(JwtEncoder.class);
        notificationService = context.getBean(NotificationService.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void getNotificationsReturnsCurrentUsersPage() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        NotificationResponse response =
                new NotificationResponse(
                        UUID.randomUUID(),
                        "POST_LIKE",
                        "Actor liked your post.",
                        "/student/feed",
                        false,
                        Instant.now(),
                        UUID.randomUUID(),
                        "Actor",
                        null);
        Page<NotificationResponse> page = new PageImpl<>(List.of(response), PageRequest.of(0, 20), 1);
        when(notificationService.getNotifications(eq(userId), eq(0), eq(20))).thenReturn(page);

        mockMvc.perform(
                        get("/api/notifications")
                                .header("Authorization", bearerToken(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].type").value("POST_LIKE"));

        verify(notificationService).getNotifications(eq(userId), eq(0), eq(20));
    }

    @Test
    void getUnreadCountReturnsCurrentUsersCount() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        when(notificationService.getUnreadCount(eq(userId))).thenReturn(4L);

        mockMvc.perform(
                        get("/api/notifications/unread-count")
                                .header("Authorization", bearerToken(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(4));

        verify(notificationService).getUnreadCount(eq(userId));
    }

    @Test
    void markAsReadReturnsUpdatedNotification() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        UUID notificationId = UUID.randomUUID();
        NotificationResponse response =
                new NotificationResponse(
                        notificationId,
                        "POST_LIKE",
                        "Actor liked your post.",
                        "/student/feed",
                        true,
                        Instant.now(),
                        UUID.randomUUID(),
                        "Actor",
                        null);
        when(notificationService.markAsRead(eq(notificationId), eq(userId))).thenReturn(response);

        mockMvc.perform(
                        put("/api/notifications/{notificationId}/read", notificationId)
                                .header("Authorization", bearerToken(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(notificationId.toString()))
                .andExpect(jsonPath("$.isRead").value(true));

        verify(notificationService).markAsRead(eq(notificationId), eq(userId));
    }

    @Test
    void markAllAsReadReturnsCount() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        when(notificationService.markAllAsRead(eq(userId))).thenReturn(5);

        mockMvc.perform(
                        put("/api/notifications/read-all")
                                .header("Authorization", bearerToken(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(5));

        verify(notificationService).markAllAsRead(eq(userId));
    }

    @Test
    void deleteNotificationReturnsNoContent() throws Exception {
        UUID userId = UUID.fromString("6a7e06db-9d26-435a-a808-71c577c561ca");
        UUID notificationId = UUID.randomUUID();

        mockMvc.perform(
                        delete("/api/notifications/{notificationId}", notificationId)
                                .header("Authorization", bearerToken(userId)))
                .andExpect(status().isNoContent());

        verify(notificationService).deleteNotification(eq(notificationId), eq(userId));
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
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

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    static class TestMvcConfiguration {

        @Bean
        ObjectMapper objectMapper() {
            return new ObjectMapper().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        }

        @Bean
        LocalValidatorFactoryBean validator() {
            return new LocalValidatorFactoryBean();
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class TestServiceConfiguration {

        @Bean
        NotificationService notificationService() {
            return org.mockito.Mockito.mock(NotificationService.class);
        }
    }
}
