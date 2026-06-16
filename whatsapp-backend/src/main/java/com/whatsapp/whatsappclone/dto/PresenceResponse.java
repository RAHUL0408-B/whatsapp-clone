package com.whatsapp.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresenceResponse {
    private String email;
    private String username;
    private boolean online;
    private String lastSeen;
}