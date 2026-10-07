package com.whatsapp.whatsappclone.service;

import com.whatsapp.whatsappclone.dto.KafkaMessageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class KafkaProducerService {

    private final KafkaTemplate<String, KafkaMessageDto> kafkaTemplate;

    private static final String TOPIC = "chat-messages";

    public void sendMessage(KafkaMessageDto message) {
        try {
            kafkaTemplate.send(TOPIC, message)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.info("✅ Message sent to Kafka: {}", message.getContent());
                        } else {
                            log.error("❌ Failed to send to Kafka: {}", ex.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.error("❌ Kafka send failed: {}", e.getMessage());
        }
    }
}