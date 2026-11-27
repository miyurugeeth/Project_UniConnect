package com.uniconnect.service;

import com.uniconnect.dto.auth.PasswordChangeRequest;
import com.uniconnect.entity.User;
import com.uniconnect.exception.InvalidCurrentPasswordException;
import com.uniconnect.exception.UserNotFoundException;
import com.uniconnect.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
public class PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void changePassword(UUID currentUserId, @Valid PasswordChangeRequest request) {
        User user =
                userRepository
                        .findById(currentUserId)
                        .orElseThrow(UserNotFoundException::new);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCurrentPasswordException();
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }
}
