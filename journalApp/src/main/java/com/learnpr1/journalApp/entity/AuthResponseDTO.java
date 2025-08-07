package com.learnpr1.journalApp.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {
    private String Jwt;
    private String refreshToken;
    private String tokenType = "Bearer";

    public AuthResponseDTO(String Jwt, String refreshToken) {
        this.Jwt = Jwt;
        this.refreshToken = refreshToken;
    }
}
