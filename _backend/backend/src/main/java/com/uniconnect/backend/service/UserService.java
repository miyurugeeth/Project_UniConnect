package com.uniconnect.backend.service;

import com.uniconnect.backend.dto.UserRequest;
import com.uniconnect.backend.dto.UserResponse;
import com.uniconnect.backend.entity.User;
import com.uniconnect.backend.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // =====================================================
    // CREATE USER
    // =====================================================

    public User createUser(UserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException(
                    "Email already registered"
            );
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setUniversity(request.getUniversity());
        user.setFaculty(request.getFaculty());
        user.setBatch(request.getBatch());

        // Normal registration
        user.setRole("STUDENT");
        user.setAccountStatus("ACTIVE");

        return userRepository.save(user);
    }


    // =====================================================
    // REGISTER USER
    // =====================================================

    public UserResponse registerUser(UserRequest request) {

        User savedUser = createUser(request);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getUniversity(),
                savedUser.getFaculty(),
                savedUser.getBatch()
        );
    }


    // =====================================================
    // CREATE ADMIN USER
    // =====================================================

    public UserResponse createAdminUser(UserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException(
                    "Email already registered"
            );
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());

        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );

        user.setUniversity(request.getUniversity());
        user.setFaculty(request.getFaculty());
        user.setBatch(request.getBatch());

        user.setRole("ADMIN");
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


    // =====================================================
    // GET ALL USERS
    // =====================================================

    public List<User> getAllUsers() {

        return userRepository.findAll();
    }

        public List<UserResponse> getStudents(String search) {
                List<User> users = search == null || search.isBlank()
                                ? userRepository.findByRole("STUDENT")
                                : userRepository.findByRoleAndNameContainingIgnoreCaseOrRoleAndEmailContainingIgnoreCase(
                                                "STUDENT", search, "STUDENT", search);

                return users.stream().map(this::toResponse).toList();
        }

        public List<UserResponse> getAdmins() {
                return userRepository.findByRole("ADMIN")
                                .stream()
                                .map(this::toResponse)
                                .toList();
        }

        public UserResponse updateStudentStatus(Long id, String accountStatus) {
                User user = userRepository.findById(id)
                                .orElseThrow(() -> new IllegalArgumentException("User not found"));

                if (!"STUDENT".equals(user.getRole())) {
                        throw new AccessDeniedException("Only student accounts can be suspended");
                }

                user.setAccountStatus(accountStatus);
                return toResponse(userRepository.save(user));
        }

        private UserResponse toResponse(User user) {
                UserResponse response = new UserResponse(
                                user.getId(),
                                user.getName(),
                                user.getEmail(),
                                user.getUniversity(),
                                user.getFaculty(),
                                user.getBatch()
                );
                response.setRole(user.getRole());
                response.setAccountStatus(user.getAccountStatus());
                return response;
        }


    // =====================================================
    // GET USER BY ID
    // =====================================================

    public User getUserById(Long id) {

        User user =
                userRepository.findById(id)
                        .orElse(null);

        if (user == null) {
            return null;
        }

        checkOwnership(user);

        return user;
    }


    // =====================================================
    // GET USER BY EMAIL
    // =====================================================

    public User getUserByEmail(String email) {

        return userRepository
                .findByEmail(email)
                .orElse(null);
    }


    // =====================================================
    // UPDATE USER
    // =====================================================

    public User updateUser(
            Long id,
            UserRequest request) {

        User existingUser =
                userRepository.findById(id)
                        .orElse(null);

        if (existingUser == null) {
            return null;
        }

        // Check ownership
        checkOwnership(existingUser);


        // -----------------------------------------
        // UPDATE NAME
        // -----------------------------------------

        if (request.getName() != null &&
                !request.getName().isBlank()) {

            existingUser.setName(
                    request.getName()
            );
        }


        // -----------------------------------------
        // UPDATE EMAIL
        // -----------------------------------------

        if (request.getEmail() != null &&
                !request.getEmail().isBlank() &&
                !request.getEmail()
                        .equals(existingUser.getEmail())) {

            // Check whether new email already exists
            if (userRepository.existsByEmail(
                    request.getEmail())) {

                throw new IllegalStateException(
                        "Email already registered"
                );
            }

            existingUser.setEmail(
                    request.getEmail()
            );
        }


        // -----------------------------------------
        // UPDATE PASSWORD
        // -----------------------------------------

        // Password empty nam old password eka
        // keep karanawa.
        if (request.getPassword() != null &&
                !request.getPassword().isBlank()) {

            if (request.getPassword().length() < 6) {

                throw new IllegalArgumentException(
                        "Password must be at least 6 characters"
                );
            }

            existingUser.setPassword(
                    passwordEncoder.encode(
                            request.getPassword()
                    )
            );
        }


        // -----------------------------------------
        // UPDATE UNIVERSITY
        // -----------------------------------------

        if (request.getUniversity() != null &&
                !request.getUniversity().isBlank()) {

            existingUser.setUniversity(
                    request.getUniversity()
            );
        }


        // -----------------------------------------
        // UPDATE FACULTY
        // -----------------------------------------

        if (request.getFaculty() != null &&
                !request.getFaculty().isBlank()) {

            existingUser.setFaculty(
                    request.getFaculty()
            );
        }


        // -----------------------------------------
        // UPDATE BATCH
        // -----------------------------------------

        if (request.getBatch() != null) {

            existingUser.setBatch(
                    request.getBatch()
            );
        }


        return userRepository.save(existingUser);
    }


    // =====================================================
    // DELETE USER
    // =====================================================

    public void deleteUser(Long id) {

        User existingUser =
                userRepository.findById(id)
                        .orElse(null);

        if (existingUser == null) {
            return;
        }

        checkOwnership(existingUser);

        userRepository.deleteById(id);
    }


    // =====================================================
    // OWNERSHIP CHECK
    // =====================================================

    private void checkOwnership(User user) {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new AccessDeniedException(
                    "User is not authenticated"
            );
        }


        // Logged-in user's email
        String loggedInEmail =
                authentication.getName();


        // Check ADMIN
        boolean isAdmin =
                authentication
                        .getAuthorities()
                        .stream()
                        .anyMatch(authority ->
                                authority
                                        .getAuthority()
                                        .equals("ROLE_ADMIN")
                        );


        // ADMIN can access any user
        if (isAdmin) {
            return;
        }


        // STUDENT can access only own account
        if (!user.getEmail().equals(
                loggedInEmail)) {

            throw new AccessDeniedException(
                    "You are not allowed to access this user"
            );
        }
    }
}