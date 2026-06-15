package com.whatsapp.whatsappclone.service;

import com.whatsapp.whatsappclone.dto.MessageRequest;
import com.whatsapp.whatsappclone.dto.MessageResponse;
import com.whatsapp.whatsappclone.entity.ChatRoom;
import com.whatsapp.whatsappclone.entity.Message;
import com.whatsapp.whatsappclone.entity.User;
import com.whatsapp.whatsappclone.repository.ChatRoomRepository;
import com.whatsapp.whatsappclone.repository.MessageRepository;
import com.whatsapp.whatsappclone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    // Save message to database
    public MessageResponse saveMessage(MessageRequest request) {
        User sender = userRepository.findByEmail(request.getSenderEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatRoom room = chatRoomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Message message = Message.builder()
                .content(request.getContent())
                .sender(sender)
                .room(room)
                .build();

        Message saved = messageRepository.save(message);
        return mapToResponse(saved);
    }

    // Get all messages in a room
    public List<MessageResponse> getRoomMessages(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        return messageRepository.findByRoomOrderBySentAtAsc(room)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Create a new chat room
    public ChatRoom createRoom(String name, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatRoom room = ChatRoom.builder()
                .name(name)
                .createdBy(creator)
                .build();

        room.getMembers().add(creator);
        return chatRoomRepository.save(room);
    }

    // Join existing room
    public ChatRoom joinRoom(Long roomId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getMembers().contains(user)) {
            room.getMembers().add(user);
            chatRoomRepository.save(room);
        }
        return room;
    }

    // Convert Message to MessageResponse
    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderUsername(message.getSender().getUsername())
                .roomId(message.getRoom().getId())
                .sentAt(message.getSentAt())
                .status(message.getStatus().name())
                .build();
    }
}