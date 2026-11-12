package com.uniconnect.backend.config;

import com.uniconnect.backend.security.CustomAccessDeniedHandler;
import com.uniconnect.backend.security.JwtAuthFilter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    private final CustomAccessDeniedHandler accessDeniedHandler;


    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            CustomAccessDeniedHandler accessDeniedHandler) {

        this.jwtAuthFilter = jwtAuthFilter;
        this.accessDeniedHandler = accessDeniedHandler;
    }


    // =========================================================
    // PASSWORD ENCODER
    // =========================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =========================================================
    // AUTHENTICATION MANAGER
    // =========================================================

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config)
            throws Exception {

        return config.getAuthenticationManager();
    }


    // =========================================================
    // CORS CONFIGURATION
    // =========================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                        "http://127.0.0.1:5175"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "PATCH",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }


    // =========================================================
    // SECURITY FILTER CHAIN
    // =========================================================

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http)
            throws Exception {

        http


                // =================================================
                // CSRF
                // =================================================

                .csrf(csrf ->
                        csrf.disable()
                )


                // =================================================
                // CORS
                // =================================================

                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )


                // =================================================
                // SESSION MANAGEMENT
                // =================================================

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )


                // =================================================
                // AUTHORIZATION RULES
                // =================================================

                .authorizeHttpRequests(auth -> auth


                        // -------------------------------------------------
                        // PUBLIC LOGIN
                        // -------------------------------------------------

                        .requestMatchers(
                                "/api/auth/**"
                        ).permitAll()


                        // -------------------------------------------------
                        // ERROR ENDPOINT
                        // -------------------------------------------------

                        .requestMatchers(
                                "/error"
                        ).permitAll()

                        .requestMatchers(
                                "/uploads/**"
                        ).permitAll()


                        // -------------------------------------------------
                        // STUDENT REGISTRATION
                        //
                        // Anyone can create a normal STUDENT account.
                        // -------------------------------------------------

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users"
                        ).permitAll()


                        // -------------------------------------------------
                        // CORS PREFLIGHT
                        // -------------------------------------------------

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()


                        // -------------------------------------------------
                        // ADMIN ENDPOINTS
                        //
                        // IMPORTANT:
                        // Only authenticated ADMIN users can access
                        // /api/admin/**
                        //
                        // This also protects:
                        //
                        // POST /api/admin/users
                        //
                        // Therefore public users CANNOT create admins.
                        // -------------------------------------------------

                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")


                        // -------------------------------------------------
                        // GET ALL USERS
                        //
                        // Students need this for Find People.
                        // -------------------------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users"
                        ).authenticated()


                        // -------------------------------------------------
                        // OTHER USER ENDPOINTS
                        // -------------------------------------------------

                        .requestMatchers(
                                "/api/users/**"
                        ).authenticated()


                        // -------------------------------------------------
                        // EVERYTHING ELSE
                        // -------------------------------------------------

                        .anyRequest().authenticated()
                )


                // =================================================
                // ACCESS DENIED HANDLER
                // =================================================

                .exceptionHandling(exception ->
                        exception.accessDeniedHandler(
                                accessDeniedHandler
                        )
                )


                // =================================================
                // JWT AUTHENTICATION FILTER
                // =================================================

                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }
}