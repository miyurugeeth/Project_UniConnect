package com.uniconnect.exception;

import com.uniconnect.entity.RoleCode;

public class ProfileNotFoundException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public ProfileNotFoundException(RoleCode role) {
        super(role + " profile was not found.");
    }
}
