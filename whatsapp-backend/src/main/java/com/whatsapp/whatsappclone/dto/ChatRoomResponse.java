package com.whatsapp.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponse {
    private Long id;
    private String name;
    private boolean isGroup;
    private String partnerUsername;
    private String partnerEmail;
    private boolean partnerOnline;
    private String partnerAvatar;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private int memberCount;
}
