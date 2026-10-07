package com.whatsapp.whatsappclone.controller;

import com.whatsapp.whatsappclone.dto.KafkaMessageDto;
import com.whatsapp.whatsappclone.dto.MessageRequest;
import com.whatsapp.whatsappclone.dto.MessageResponse;
import com.whatsapp.whatsappclone.entity.ChatRoom;
import com.whatsapp.whatsappclone.service.ChatService;
import com.whatsapp.whatsappclone.service.KafkaProducerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final KafkaProducerService kafkaProducerService;

    // ✅ WebSocket endpoint — sends through Kafka
    @MessageMapping("/sendMessage")
    public void sendMessage(@Payload MessageRequest request) {

        // Build Kafka message
        KafkaMessageDto kafkaMessage = KafkaMessageDto.builder()
                .content(request.getContent())
                .senderEmail(request.getSenderEmail())
                .roomId(request.getRoomId())
                .sentAt(LocalDateTime.now())
                .build();

        // Send to Kafka queue
        kafkaProducerService.sendMessage(kafkaMessage);
    }

    // ✅ REST — Send message
    @PostMapping("/message/send")
    public ResponseEntity<MessageResponse> sendMessageRest(@RequestBody MessageRequest request) {
        MessageResponse response = chatService.saveMessage(request);
        messagingTemplate.convertAndSend("/topic/room/" + request.getRoomId(), response);
        return ResponseEntity.ok(response);
    }

    // ✅ REST — Create a chat room
    @PostMapping("/room/create")
    public ResponseEntity<ChatRoom> createRoom(
            @RequestParam String name,
            @RequestParam String email) {
        return ResponseEntity.ok(chatService.createRoom(name, email));
    }

    // ✅ REST — Join a room
    @PostMapping("/room/{roomId}/join")
    public ResponseEntity<ChatRoom> joinRoom(
            @PathVariable Long roomId,
            @RequestParam String email) {
        return ResponseEntity.ok(chatService.joinRoom(roomId, email));
    }

    // ✅ REST — Get message history
    @GetMapping("/room/{roomId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getRoomMessages(roomId));
    }

    // ✅ REST — Get rooms for user
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoom>> getUserRooms(
            @RequestParam String email) {
        return ResponseEntity.ok(chatService.getUserRooms(email));
    }

    // ✅ REST — Get rich detailed rooms for WhatsApp conversation list
    @GetMapping("/rooms/detailed")
    public ResponseEntity<List<com.whatsapp.whatsappclone.dto.ChatRoomResponse>> getUserRoomsDetailed(
            @RequestParam String email) {
        return ResponseEntity.ok(chatService.getUserRoomsWithDetails(email));
    }

    // ✅ REST — Get or create 1-on-1 direct chat room
    @PostMapping("/room/direct")
    public ResponseEntity<ChatRoom> getOrCreateDirectRoom(
            @RequestBody com.whatsapp.whatsappclone.dto.DirectChatRequest request) {
        return ResponseEntity.ok(chatService.getOrCreateDirectRoom(request.getUserEmail(), request.getTargetEmail()));
    }
}