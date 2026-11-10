package com.perdomazo.firstproject.dto;

public record ErrorResponse(
    String timestamp,
    int status,
    String error,
    String message,
    String path
) {}
