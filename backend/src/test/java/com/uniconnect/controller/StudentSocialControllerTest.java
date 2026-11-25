package com.uniconnect.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniconnect.config.JwtConfiguration;
import com.uniconnect.config.SecurityConfig;
import com.uniconnect.dto.social.PostAuthorResponse;
import com.uniconnect.dto.social.PostCategoryResponse;
import com.uniconnect.dto.social.PostLikeResponse;
import com.uniconnect.dto.social.StudentFollowResponse;
import com.uniconnect.dto.social.StudentPostCommentRequest;
import com.uniconnect.dto.social.StudentPostCommentResponse;
import com.uniconnect.dto.social.StudentPostRequest;
import com.uniconnect.dto.social.StudentPostResponse;
import com.uniconnect.dto.social.StudentProfileResponse;
import com.uniconnect.service.StudentSocialService;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Set;
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
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

class StudentSocialControllerTest {

    private static final String ISSUER = "uniconnect-social-controller-test";
    private static final String ALLOWED_ORIGIN = "http://localhost:5173";

    private AnnotationConfigWebApplicationContext context;
    private MockMvc mockMvc;
    private JwtEncoder jwtEncoder;
    private StudentSocialService studentSocialService;

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
                StudentSocialController.class,
                TestServiceConfiguration.class);
        context.refresh();

        mockMvc =
                MockMvcBuilders.webAppContextSetup(context)
                        .addFilters(context.getBean(FilterChainProxy.class))
                        .build();
        jwtEncoder = context.getBean(JwtEncoder.class);
        studentSocialService = context.getBean(StudentSocialService.class);
    }

    @AfterEach
    void tearDown() {
        context.close();
    }

    @Test
    void requiresCommunityAuthenticationAndUsesJwtSubjectForPostOwnership() throws Exception {
        UUID authenticatedStudentId = UUID.randomUUID();
        UUID authenticatedProfessionalId = UUID.randomUUID();
        UUID clientSuppliedId = UUID.randomUUID();
        StudentPostResponse response = postResponse(authenticatedStudentId);
        StudentPostResponse professionalResponse = postResponse(authenticatedProfessionalId);
        when(studentSocialService.createPost(
                        eq(authenticatedStudentId), any(StudentPostRequest.class)))
                .thenReturn(response);
        when(studentSocialService.createPost(
                        eq(authenticatedProfessionalId), any(StudentPostRequest.class)))
                .thenReturn(professionalResponse);

        mockMvc.perform(
                        post("/api/students/posts")
                                .contentType("application/json")
                                        .content(
                                                "{\"content\":\"A post\","
                                                        + "\"categoryCode\":\"GENERAL_UNIVERSITY_LIFE\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(
                        post("/api/students/posts")
                                .header("Authorization", bearerToken(authenticatedStudentId, "STUDENT"))
                                .queryParam("userId", clientSuppliedId.toString())
                                .contentType("application/json")
                                .content(
                                        "{\"content\":\"A post\",\"userId\":\""
                                                + clientSuppliedId
                                                + "\",\"categoryCode\":\"GENERAL_UNIVERSITY_LIFE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.author.id").value(authenticatedStudentId.toString()))
                .andExpect(jsonPath("$.author.id").value(org.hamcrest.Matchers.not(
                        clientSuppliedId.toString())));

        mockMvc.perform(
                        post("/api/students/posts")
                                .header("Authorization", bearerToken(authenticatedProfessionalId, "PROFESSIONAL"))
                                .contentType("application/json")
                                .content(
                                        "{\"content\":\"A professional post\","
                                                + "\"categoryCode\":\"GENERAL_UNIVERSITY_LIFE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.author.id").value(authenticatedProfessionalId.toString()));

        ArgumentCaptor<StudentPostRequest> requestCaptor =
                ArgumentCaptor.forClass(StudentPostRequest.class);
        verify(studentSocialService)
                .createPost(eq(authenticatedStudentId), requestCaptor.capture());
        verify(studentSocialService)
                .createPost(eq(authenticatedProfessionalId), any(StudentPostRequest.class));
        org.junit.jupiter.api.Assertions.assertEquals("A post", requestCaptor.getValue().content());
    }

    @Test
    void allowsBothCommunityRolesToReadThePaginatedFeed() throws Exception {
        UUID studentId = UUID.randomUUID();
        Page<StudentPostResponse> feed =
                new PageImpl<>(List.of(postResponse(studentId)), PageRequest.of(0, 20), 1);
        when(studentSocialService.getFeed(studentId, 2, 10, "ICT_COMPUTING"))
                .thenReturn(feed);
        when(studentSocialService.getFeed(studentId, 0, 20, null)).thenReturn(feed);

        mockMvc.perform(
                        get("/api/students/feed")
                                .header("Authorization", bearerToken(studentId, "PROFESSIONAL")))
                .andExpect(status().isOk());

        mockMvc.perform(
                        get("/api/students/feed?page=2&size=10&category=ICT_COMPUTING")
                                .header("Authorization", bearerToken(studentId, "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].content").value("A post"))
                .andExpect(jsonPath("$.content[0].author.fullName").value("Student"));

        verify(studentSocialService).getFeed(studentId, 0, 20, null);
        verify(studentSocialService).getFeed(studentId, 2, 10, "ICT_COMPUTING");
    }

    @Test
    void likeEndpointAllowsBothCommunityRolesAndUsesTheirSubjects() throws Exception {
        UUID studentId = UUID.randomUUID();
        UUID professionalId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        when(studentSocialService.likePost(studentId, postId))
                .thenReturn(new PostLikeResponse(1, true));
        when(studentSocialService.likePost(professionalId, postId))
                .thenReturn(new PostLikeResponse(2, true));

        mockMvc.perform(post("/api/students/posts/{postId}/likes", postId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(
                        post("/api/students/posts/{postId}/likes", postId)
                                .header("Authorization", bearerToken(studentId, "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.likedByCurrentUser").value(true));

        mockMvc.perform(
                        post("/api/students/posts/{postId}/likes", postId)
                                .header("Authorization", bearerToken(professionalId, "PROFESSIONAL")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(2));

        verify(studentSocialService).likePost(studentId, postId);
        verify(studentSocialService).likePost(professionalId, postId);
    }

    @Test
    void deletesPostForAuthenticatedStudent() throws Exception {
        UUID studentId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        mockMvc.perform(
                        delete("/api/students/posts/{postId}", postId)
                                .header("Authorization", bearerToken(studentId, "STUDENT")))
                .andExpect(status().isOk());

        verify(studentSocialService).deletePost(studentId, postId);
    }

    @Test
    void propagatesNotFoundWhenPostDeleteServiceFails() throws Exception {
        UUID studentId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND))
                .when(studentSocialService)
                .deletePost(studentId, postId);

        mockMvc.perform(
                        delete("/api/students/posts/{postId}", postId)
                                .header("Authorization", bearerToken(studentId, "STUDENT")))
                .andExpect(status().isNotFound());
    }

    @Test
    void followEndpointUsesJwtSubjectAndReturnsFollowState() throws Exception {
        UUID followerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        when(studentSocialService.followStudent(followerId, targetId))
                .thenReturn(new StudentFollowResponse(true, 4));

        mockMvc.perform(
                        post("/api/students/{studentId}/follow", targetId)
                                .header("Authorization", bearerToken(followerId, "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.following").value(true))
                .andExpect(jsonPath("$.followerCount").value(4));

        verify(studentSocialService).followStudent(followerId, targetId);
    }

    @Test
    void profileEndpointUsesAuthenticatedViewerForFollowState() throws Exception {
        UUID viewerId = UUID.randomUUID();
        UUID profileId = UUID.randomUUID();
        when(studentSocialService.getStudentProfile(profileId, viewerId))
                .thenReturn(
                        new StudentProfileResponse(
                                profileId,
                                "Student",
                                null,
                                "Example University",
                                "Science",
                                "Computer Science",
                                2024,
                                2,
                                Set.of(),
                                Set.of(),
                                5,
                                3,
                                true));

        mockMvc.perform(
                        get("/api/students/{studentId}", profileId)
                                .header("Authorization", bearerToken(viewerId, "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followerCount").value(5))
                .andExpect(jsonPath("$.followingCount").value(3))
                .andExpect(jsonPath("$.followedByCurrentUser").value(true));

        verify(studentSocialService).getStudentProfile(profileId, viewerId);
    }

    @Test
    void commentEndpointValidatesContentBeforeCallingTheService() throws Exception {
        UUID studentId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();

        mockMvc.perform(
                        post("/api/students/posts/{postId}/comments", postId)
                                .header("Authorization", bearerToken(studentId, "STUDENT"))
                                .contentType("application/json")
                                .content("{\"content\":\"   \"}"))
                .andExpect(status().isBadRequest());

        verify(studentSocialService, org.mockito.Mockito.never())
                .createComment(eq(studentId), eq(postId), any(StudentPostCommentRequest.class));
    }

    @Test
    void returnsPaginatedCommentsToAnAuthenticatedStudent() throws Exception {
        UUID studentId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        UUID commentId = UUID.randomUUID();
        UUID authorId = UUID.randomUUID();
        Instant timestamp = Instant.parse("2026-01-01T00:00:00Z");
        StudentPostCommentResponse comment =
                new StudentPostCommentResponse(
                        commentId,
                        postId,
                        "A comment",
                        timestamp,
                        timestamp,
                        new PostAuthorResponse(
                                authorId,
                                "Comment Author",
                                null,
                                "STUDENT",
                                "Example University",
                                "Science",
                                "Computer Science",
                                null,
                                null,
                                null));
        when(studentSocialService.getComments(postId, 0, 10))
                .thenReturn(
                        new PageImpl<>(
                                List.of(comment), PageRequest.of(0, 10), 1));

        mockMvc.perform(
                        get("/api/students/posts/{postId}/comments", postId)
                                .param("page", "0")
                                .param("size", "10")
                                .header("Authorization", bearerToken(studentId, "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(commentId.toString()))
                .andExpect(jsonPath("$.content[0].postId").value(postId.toString()))
                .andExpect(jsonPath("$.content[0].author.id").value(authorId.toString()))
                .andExpect(jsonPath("$.number").value(0))
                .andExpect(jsonPath("$.size").value(10));

        verify(studentSocialService).getComments(postId, 0, 10);
    }

    @Test
    void returnsCategoriesToAnAuthenticatedStudent() throws Exception {
        UUID studentId = UUID.randomUUID();
        when(studentSocialService.getCategories())
                .thenReturn(
                        List.of(
                                new PostCategoryResponse(
                                        "ICT_COMPUTING", "ICT and Computing")));

        mockMvc.perform(
                        get("/api/students/categories")
                                .header("Authorization", bearerToken(studentId, "STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("ICT_COMPUTING"))
                .andExpect(jsonPath("$[0].displayName").value("ICT and Computing"));

        verify(studentSocialService).getCategories();
    }

    @Test
    void corsAllowsDeletePreflightForPostOperations() throws Exception {
        mockMvc.perform(
                        options("/api/students/posts/" + UUID.randomUUID())
                                .header("Origin", ALLOWED_ORIGIN)
                                .header(
                                        "Access-Control-Request-Method",
                                        HttpMethod.DELETE.name())
                                .header(
                                        "Access-Control-Request-Headers",
                                        "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(
                        header()
                                .string(
                                        "Access-Control-Allow-Origin",
                                        ALLOWED_ORIGIN));
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

    private static StudentPostResponse postResponse(UUID studentId) {
        return new StudentPostResponse(
                UUID.randomUUID(),
                "A post",
                null,
                Instant.parse("2026-01-01T00:00:00Z"),
                Instant.parse("2026-01-01T00:00:00Z"),
                new PostAuthorResponse(
                        studentId,
                        "Student",
                        null,
                        "STUDENT",
                        "University of Colombo",
                        "Science",
                        "Computer Science",
                        null,
                        null,
                        null),
                new PostCategoryResponse(
                        "GENERAL_UNIVERSITY_LIFE", "General University Life"),
                List.of(),
                0,
                false,
                0);
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
        StudentSocialService studentSocialService() {
            return org.mockito.Mockito.mock(StudentSocialService.class);
        }
    }
}
