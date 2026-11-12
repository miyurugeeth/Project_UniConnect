package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.LoginRequest;
import com.uniconnect.backend.dto.UserRequest;
import com.uniconnect.backend.dto.UserResponse;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.UserRepository;
import com.uniconnect.backend.security.JwtUtil;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }


    // =====================================================
    // LOGIN
    // =====================================================

    public String login(LoginRequest request) {

        User user =
                userRepository
                        .findByEmail(request.getEmail())
                        .orElse(null);


        if (user == null) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }


        boolean matches =
                passwordEncoder.matches(
                        request.getPassword(),
                        user.getPassword()
                );


        if (!matches) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }

        String accountStatus = user.getAccountStatus();

        if ("SUSPENDED".equalsIgnoreCase(accountStatus)) {

            throw new RuntimeException(
                    "Your account has been suspended. Please contact support."
            );
        }


        return jwtUtil.generateToken(
                user.getEmail(),
                user.getRole()
        );
    }


    // =====================================================
    // STUDENT REGISTRATION
    // =====================================================

    public UserResponse registerStudent(
            UserRequest request) {

        // Check duplicate email

        if (userRepository.existsByEmail(
                request.getEmail())) {

            throw new RuntimeException(
                    "Email already registered"
            );
        }


        User user = new User();


        user.setName(
                request.getName()
        );

        user.setEmail(
                request.getEmail()
        );


        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );


        user.setUniversity(
                request.getUniversity()
        );

        user.setFaculty(
                request.getFaculty()
        );

        user.setBatch(
                request.getBatch()
        );


        // IMPORTANT
        user.setRole("STUDENT");
        user.setAccountStatus("ACTIVE");


        User savedUser =
                userRepository.save(user);


        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getUniversity(),
                savedUser.getFaculty(),
                savedUser.getBatch()
        );
    }


}