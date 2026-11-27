package com.uniconnect.exception;

public class AdminBootstrapNotConfiguredException extends RuntimeException {

    public AdminBootstrapNotConfiguredException() {
        super("Initial administrator setup is not configured on this server.");
    }
}
