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

    // Get all rooms a user is a member of
    public List<ChatRoom> getUserRooms(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return chatRoomRepository.findByMembersContaining(user);
    }

    // Get or create a 1-on-1 direct chat room between two users
    public ChatRoom getOrCreateDirectRoom(String userEmail, String targetEmail) {
        if (userEmail.equalsIgnoreCase(targetEmail)) {
            throw new IllegalArgumentException("Cannot create a direct chat with yourself");
        }
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
        User target = userRepository.findByEmail(targetEmail)
                .orElseThrow(() -> new RuntimeException("Target user not found: " + targetEmail));

        return chatRoomRepository.findDirectRoomBetweenUsers(user, target)
                .orElseGet(() -> {
                    ChatRoom directRoom = ChatRoom.builder()
                            .name(target.getUsername())
                            .createdBy(user)
                            .members(new java.util.ArrayList<>(java.util.List.of(user, target)))
                            .build();
                    return chatRoomRepository.save(directRoom);
                });
    }

    // Get user rooms with rich details for WhatsApp chat list
    public List<com.whatsapp.whatsappclone.dto.ChatRoomResponse> getUserRoomsWithDetails(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        List<ChatRoom> rooms = chatRoomRepository.findByMembersContaining(user);

        return rooms.stream().map(room -> {
            boolean isDirect = room.getMembers().size() == 2;
            User partner = null;
            if (isDirect) {
                partner = room.getMembers().stream()
                        .filter(m -> !m.getEmail().equalsIgnoreCase(email))
                        .findFirst()
                        .orElse(null);
            }

            String displayName = (isDirect && partner != null) ? partner.getUsername() : room.getName();
            String partnerEmail = partner != null ? partner.getEmail() : null;
            boolean partnerOnline = partner != null && partner.isOnline();
            String partnerAvatar = partner != null ? partner.getAvatarUrl() : null;

            List<Message> roomMessages = messageRepository.findByRoomOrderBySentAtAsc(room);
            String lastMsgContent = null;
            java.time.LocalDateTime lastMsgTime = null;
            if (!roomMessages.isEmpty()) {
                Message last = roomMessages.get(roomMessages.size() - 1);
                lastMsgContent = last.getContent();
                lastMsgTime = last.getSentAt();
            }

            return com.whatsapp.whatsappclone.dto.ChatRoomResponse.builder()
                    .id(room.getId())
                    .name(displayName)
                    .isGroup(!isDirect)
                    .partnerUsername(partner != null ? partner.getUsername() : null)
                    .partnerEmail(partnerEmail)
                    .partnerOnline(partnerOnline)
                    .partnerAvatar(partnerAvatar)
                    .lastMessage(lastMsgContent)
                    .lastMessageTime(lastMsgTime)
                    .memberCount(room.getMembers().size())
                    .build();
        }).collect(Collectors.toList());
    }

    // Convert Message to MessageResponse
    private MessageResponse mapToResponse(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderUsername(message.getSender().getUsername())
                .senderEmail(message.getSender().getEmail())
                .roomId(message.getRoom().getId())
                .sentAt(message.getSentAt())
                .status(message.getStatus().name())
                .build();
    }
}