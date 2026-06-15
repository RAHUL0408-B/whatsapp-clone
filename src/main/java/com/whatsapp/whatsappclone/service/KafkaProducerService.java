package com.whatsapp.whatsappclone.service;

import com.whatsapp.whatsappclone.dto.KafkaMessageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, KafkaMessageDto> kafkaTemplate;

    private static final String TOPIC = "chat-messages";

    // Send message to Kafka topic
    public void sendMessage(KafkaMessageDto message) {
        kafkaTemplate.send(TOPIC, message)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("✅ Message sent to Kafka: {}", message.getContent());
                    } else {
                        log.error("❌ Failed to send message: {}", ex.getMessage());
                    }
                });
    }
}