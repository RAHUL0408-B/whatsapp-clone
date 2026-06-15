package com.whatsapp.whatsappclone.service;

import com.whatsapp.whatsappclone.dto.KafkaMessageDto;
import com.whatsapp.whatsappclone.dto.MessageRequest;
import com.whatsapp.whatsappclone.dto.MessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // Listen to "chat-messages" topic
    @KafkaListener(
            topics = "chat-messages",
            groupId = "whatsapp-group"
    )
    public void consumeMessage(KafkaMessageDto kafkaMessage) {
        log.info("📨 Message received from Kafka: {}", kafkaMessage.getContent());

        try {
            // Save message to PostgreSQL
            MessageRequest request = new MessageRequest();
            request.setContent(kafkaMessage.getContent());
            request.setSenderEmail(kafkaMessage.getSenderEmail());
            request.setRoomId(kafkaMessage.getRoomId());

            MessageResponse response = chatService.saveMessage(request);

            // Broadcast to WebSocket subscribers
            messagingTemplate.convertAndSend(
                    "/topic/room/" + kafkaMessage.getRoomId(),
                    response
            );

            log.info("✅ Message saved and broadcasted to room: {}",
                    kafkaMessage.getRoomId());

        } catch (Exception e) {
            log.error("❌ Error processing message: {}", e.getMessage());
        }
    }
}