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
public class KafkaMessageDto {
    private String content;
    private String senderEmail;
    private Long roomId;
    private LocalDateTime sentAt;
}