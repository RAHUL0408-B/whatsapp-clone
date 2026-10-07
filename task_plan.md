# Task Plan: WhatsApp Clone Full System Upgrade

## Current Phase: Phase 1 Completed -> Ready for Phase 2 (Media & Image Sharing)

## Phases

### Phase 1: User Identity, Contacts & Private 1-on-1 Chats
- [x] Secure `User.java` (hide password, add `about`, `avatarUrl`)
- [x] Create `UserDto.java`
- [x] Add contact queries to `UserRepository.java` (`findByEmailNot`, `findByUsernameContainingIgnoreCaseAndEmailNot`)
- [x] Add direct room detection query to `ChatRoomRepository.java` (`findDirectRoomBetweenUsers`)
- [x] Create `DirectChatRequest.java` and `ChatRoomResponse.java`
- [x] Implement `getOrCreateDirectRoom` and `getUserRoomsWithDetails` in `ChatService.java`
- [x] Expose `GET /api/users/contacts` in `UserController.java`
- [x] Expose `POST /api/chat/room/direct` and `GET /api/chat/rooms/detailed` in `ChatController.java`
- [x] Build `NewChatModal.js` in frontend with user search and click-to-chat
- [x] Integrate direct chats, partner display names, online indicators, and double read checkmarks in `Chat.js`
- [x] Verified direct chat room creation and contact listing
- **Status:** complete

### Phase 2: Media & Image Sharing
- [ ] Backend media upload service & `/api/media/upload` endpoint
- [ ] Extend `Message.java` with `messageType`, `mediaUrl`, `fileName`
- [ ] Frontend image picker, preview modal with caption, and lightbox modal
- **Status:** pending

### Phase 3: WebRTC Audio & Video Calling
- [ ] Backend WebSocket WebRTC signaling endpoints (`/call/signal`)
- [ ] Frontend WebRTC peer connection manager & media stream capture
- [ ] Incoming call modal & Active call overlay with PiP video and audio controls
- **Status:** pending

### Phase 4: WhatsApp Status / Stories Feature
- [ ] Backend `Status` entity & repository (24-hour expiration)
- [ ] Frontend Status tab with "My Status" and contacts' story updates
- [ ] Fullscreen WhatsApp Story Viewer with progress bars
- **Status:** pending

### Phase 5: Calls History Tab
- [ ] Backend `CallLog` entity & history API
- [ ] Frontend Calls tab with 1-click call-back
- **Status:** pending

### Phase 6: WhatsApp Web Modern Theme & Polish
- [ ] Vertical sidebar rail (Chats, Status, Calls)
- [ ] Emoji picker and UI polish
- **Status:** pending
