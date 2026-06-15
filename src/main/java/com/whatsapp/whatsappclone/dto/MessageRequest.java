package com.whatsapp.whatsappclone.dto;

import lombok.Data;

@Data
public class MessageRequest {
    private String content;
    private Long roomId;
    private String senderEmail;
}