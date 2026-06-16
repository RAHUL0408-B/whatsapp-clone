package com.whatsapp.whatsappclone.repository;

import com.whatsapp.whatsappclone.entity.ChatRoom;
import com.whatsapp.whatsappclone.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    List<ChatRoom> findByMembersContaining(User user);
}