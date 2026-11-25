package com.uniconnect.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateEmail(
            DuplicateEmailException exception, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, exception.getMessage(), request);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException exception, HttpServletRequest request) {
        return response(HttpStatus.UNAUTHORIZED, exception.getMessage(), request);
    }

    @ExceptionHandler(AccountSuspendedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccountSuspended(
            AccountSuspendedException exception, HttpServletRequest request) {
        return response(HttpStatus.LOCKED, exception.getMessage(), request);
    }

    @ExceptionHandler(AdminBootstrapUnavailableException.class)
    public ResponseEntity<ApiErrorResponse> handleAdminBootstrapUnavailable(
            AdminBootstrapUnavailableException exception, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, exception.getMessage(), request);
    }

    @ExceptionHandler(AdminBootstrapNotConfiguredException.class)
    public ResponseEntity<ApiErrorResponse> handleAdminBootstrapNotConfigured(
            AdminBootstrapNotConfiguredException exception, HttpServletRequest request) {
        return response(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage(), request);
    }

    @ExceptionHandler(InvalidAdminBootstrapKeyException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidAdminBootstrapKey(
            InvalidAdminBootstrapKeyException exception, HttpServletRequest request) {
        return response(HttpStatus.FORBIDDEN, exception.getMessage(), request);
    }

    @ExceptionHandler({UserNotFoundException.class, ProfileNotFoundException.class})
    public ResponseEntity<ApiErrorResponse> handleNotFound(
            RuntimeException exception, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(InvalidCurrentPasswordException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidCurrentPassword(
            InvalidCurrentPasswordException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(ProfileTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleProfileTypeMismatch(
            ProfileTypeMismatchException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<String> messages =
                exception.getBindingResult().getFieldErrors().stream()
                        .map(
                                error ->
                                        error.getField()
                                                + ": "
                                                + Objects.requireNonNullElse(
                                                        error.getDefaultMessage(), "is invalid"))
                        .distinct()
                        .sorted()
                        .toList();
        return response(
                HttpStatus.BAD_REQUEST,
                validationMessage(messages),
                request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException exception, HttpServletRequest request) {
        List<String> messages =
                exception.getConstraintViolations().stream()
                        .map(GlobalExceptionHandler::constraintMessage)
                        .distinct()
                        .sorted()
                        .toList();
        return response(
                HttpStatus.BAD_REQUEST,
                validationMessage(messages),
                request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableRequest(
            HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "Request body is invalid.", request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSizeExceeded(
            HttpServletRequest request) {
        return response(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Attachment exceeds the configured request size limit.",
                request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(HttpServletRequest request) {
        return response(HttpStatus.FORBIDDEN, "Access is denied.", request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(
            ResponseStatusException exception, HttpServletRequest request) {
        HttpStatusCode status = exception.getStatusCode();
        HttpStatus resolvedStatus =
                HttpStatus.resolve(status.value()) == null
                        ? HttpStatus.INTERNAL_SERVER_ERROR
                        : HttpStatus.resolve(status.value());
        String message =
                status.is4xxClientError()
                        ? "Request could not be processed."
                        : "An unexpected error occurred.";
        return response(resolvedStatus, message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(
            Exception exception, HttpServletRequest request) {
        return response(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred.",
                request);
    }

    private static String constraintMessage(ConstraintViolation<?> violation) {
        return violation.getPropertyPath()
                + ": "
                + Objects.requireNonNullElse(violation.getMessage(), "is invalid");
    }

    private static String validationMessage(List<String> messages) {
        return messages.isEmpty()
                ? "Request validation failed."
                : String.join("; ", messages);
    }

    private static ResponseEntity<ApiErrorResponse> response(
            HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(
                        new ApiErrorResponse(
                                Instant.now().toString(),
                                status.value(),
                                status.getReasonPhrase(),
                                message,
                                request.getRequestURI()));
    }

    public record ApiErrorResponse(
            String timestamp, int status, String error, String message, String path) {
    }
}
