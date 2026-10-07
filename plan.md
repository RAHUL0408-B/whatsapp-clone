# WhatsApp Clone Full System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the WhatsApp Clone from a basic room broadcaster into a complete, authentic WhatsApp experience featuring distinct multi-user private/group chats, photo/media sharing, WebRTC audio & video calling, 24-hour Status/Stories, and a Call History tab.

**Architecture:** Spring Boot 3 + PostgreSQL + Redis + Kafka on the backend provides robust REST APIs, media storage, and real-time STOMP WebSocket signaling. React on the frontend provides a tabbed WhatsApp Web interface (Chats, Status, Calls) with WebRTC peer connections for real-time P2P calling and reactive state management.

**Tech Stack:**
- Backend: Java 21, Spring Boot 3.3.5 (JPA, Security, WebSocket/STOMP, Kafka, Redis), PostgreSQL 15
- Frontend: React 19, React Router 7, Axios, StompJS, SockJS, Lucide React, WebRTC API
- Infrastructure: Docker Compose (Postgres, Redis, Kafka, Zookeeper, Spring Boot App)

---

## Roadmap Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WhatsApp Web Clone                              │
├───────────────────┬───────────────────┬────────────────────────────────┤
│    Chats Tab      │    Status Tab     │           Calls Tab            │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • 1-on-1 Direct   │ • 24h Expiration  │ • Voice Call History           │
│   Conversations   │ • Text Status     │ • Video Call History           │
│ • Group Chats     │   (Custom Colors) │ • Missed / Incoming / Outgoing │
│ • Photo & Media   │ • Photo Status    │ • One-Click Call Back          │
│   Attachments     │   (Captions)      │ • WebRTC Live Audio & Video    │
│ • Read Receipts   │ • Story Viewer    │   with PiP & Media Controls    │
│ • Contact Search  │   (Progress Bar)  │                                │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## Phase 1: User Identity, Contacts & Private 1-on-1 Chats

### Task 1.1: Contact Discovery & Direct Chat Room Backend Endpoints
**Files:**
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/repository/UserRepository.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/repository/ChatRoomRepository.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/service/ChatService.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/controller/ChatController.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/controller/UserController.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/dto/DirectChatRequest.java`

- [ ] **Step 1: Add user search & contact queries to `UserRepository`**
```java
// whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/repository/UserRepository.java
List<User> findByEmailNot(String email);
List<User> findByUsernameContainingIgnoreCaseAndEmailNot(String username, String email);
```

- [ ] **Step 2: Add direct room lookup in `ChatRoomRepository`**
```java
// Query to find existing 1-on-1 room between two specific user IDs
@Query("SELECT r FROM ChatRoom r WHERE SIZE(r.members) = 2 AND :u1 MEMBER OF r.members AND :u2 MEMBER OF r.members")
Optional<ChatRoom> findDirectRoomBetweenUsers(@Param("u1") User u1, @Param("u2") User u2);
```

- [ ] **Step 3: Implement `getOrCreateDirectRoom` and `searchContacts` in `ChatService`**
```java
// Returns existing 1-on-1 room between two users or creates a new direct chat room
public ChatRoom getOrCreateDirectRoom(String userEmail, String targetEmail);
```

- [ ] **Step 4: Expose endpoints in `UserController` and `ChatController`**
```
GET  /api/users/contacts?email={email}&search={query}  -> List<UserDto>
POST /api/chat/room/direct                             -> ChatRoom
```

- [ ] **Step 5: Test direct room creation and contact listing with curl**
```powershell
# Verify contacts list
curl -s "http://localhost:8080/api/users/contacts?email=admin@test.com"
```

- [ ] **Step 6: Commit backend direct chat enhancements**
```bash
git add whatsapp-backend/
git commit -m "feat(backend): add contact discovery and 1-on-1 direct chat room API"
```

---

### Task 1.2: Frontend Contacts Modal, Distinct Chat Lists & Partner Display
**Files:**
- Modify: `whatsapp-frontend/src/services/api.js`
- Modify: `whatsapp-frontend/src/pages/Chat.js`
- Create: `whatsapp-frontend/src/components/NewChatModal.js`
- Create: `whatsapp-frontend/src/components/ChatListItem.js`

- [ ] **Step 1: Add API client methods in `services/api.js`**
```javascript
export const getContacts = (email, search = '') => 
    api.get(`/api/users/contacts?email=${email}&search=${search}`);

export const getOrCreateDirectChat = (userEmail, targetEmail) =>
    api.post('/api/chat/room/direct', { userEmail, targetEmail });
```

- [ ] **Step 2: Create `NewChatModal.js` for initiating 1-on-1 conversations**
Modal displaying all registered users with search input, profile initials/avatar, online indicator dot, and click-to-chat action.

- [ ] **Step 3: Update `ChatListItem.js` to compute partner name for 1-on-1 chats**
If room has 2 members, display the *other* user's username/email and status instead of generic room ID.

- [ ] **Step 4: Update `Chat.js` to display New Chat button and bind conversation switching**

- [ ] **Step 5: Verify in browser with two distinct user sessions (Regular + Incognito window)**
Alice logs in, clicks New Chat, selects Bob, sends message -> Bob logs in on incognito, sees Alice's chat with message.

- [ ] **Step 6: Commit frontend 1-on-1 direct chat features**
```bash
git add whatsapp-frontend/
git commit -m "feat(frontend): implement contact selection and 1-on-1 direct messaging"
```

---

## Phase 2: Media & Image Sharing

### Task 2.1: Backend Media Upload Service & Message Media Entity
**Files:**
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/entity/Message.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/dto/MessageRequest.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/dto/MessageResponse.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/dto/KafkaMessageDto.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/controller/MediaController.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/config/WebMvcConfig.java`

- [ ] **Step 1: Extend `Message.java` with media fields**
```java
@Enumerated(EnumType.STRING)
private MessageType messageType; // TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT

@Column(name = "media_url")
private String mediaUrl;

@Column(name = "file_name")
private String fileName;
```

- [ ] **Step 2: Configure static resource mapping in `WebMvcConfig.java` to serve uploaded files**
Map `/uploads/**` to filesystem directory `uploads/`.

- [ ] **Step 3: Create `MediaController.java` with `/api/media/upload` endpoint**
Accepts `MultipartFile`, validates file extension (jpg, png, webp, gif, mp4, etc.), writes file to storage directory with UUID filename, returns JSON `{ url: "/uploads/xyz.jpg", fileName: "photo.jpg" }`.

- [ ] **Step 4: Update `SecurityConfig.java` to permit GET on `/uploads/**` and POST on `/api/media/**`**

- [ ] **Step 5: Test file upload via curl**
```powershell
curl -X POST -F "file=@test.png" http://localhost:8080/api/media/upload
```

- [ ] **Step 6: Commit backend media upload feature**
```bash
git add whatsapp-backend/
git commit -m "feat(backend): add media upload endpoint and support image messages"
```

---

### Task 2.2: Frontend Image Picker, Preview Modal & Lightbox
**Files:**
- Modify: `whatsapp-frontend/src/services/api.js`
- Modify: `whatsapp-frontend/src/pages/Chat.js`
- Create: `whatsapp-frontend/src/components/ImagePreviewModal.js`
- Create: `whatsapp-frontend/src/components/ImageLightboxModal.js`

- [ ] **Step 1: Add upload media API helper in `services/api.js`**
```javascript
export const uploadMedia = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};
```

- [ ] **Step 2: Build `ImagePreviewModal.js`**
Displays image thumbnail preview before sending, allows adding an optional text caption, with "Cancel" and "Send" buttons.

- [ ] **Step 3: Build `ImageLightboxModal.js`**
Full-screen lightbox viewer when clicking on an image bubble in the chat conversation.

- [ ] **Step 4: Integrate Paperclip file input trigger in `Chat.js` input bar**
Render image bubble with thumbnail, caption, and timestamp.

- [ ] **Step 5: Verify sending an image in browser between two users**

- [ ] **Step 6: Commit frontend image sharing feature**
```bash
git add whatsapp-frontend/
git commit -m "feat(frontend): add image attachments, preview modal and lightbox"
```

---

## Phase 3: WebRTC Audio & Video Calling

### Task 3.1: Backend WebSocket WebRTC Signaling Endpoints
**Files:**
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/dto/CallSignalDto.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/controller/ChatController.java`
- Modify: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/config/WebSocketConfig.java`

- [ ] **Step 1: Create `CallSignalDto.java`**
```java
public class CallSignalDto {
    private String type; // "OFFER", "ANSWER", "ICE_CANDIDATE", "CALL_REQUEST", "CALL_ACCEPTED", "CALL_REJECTED", "CALL_ENDED"
    private String callerEmail;
    private String callerName;
    private String calleeEmail;
    private String callType; // "AUDIO", "VIDEO"
    private Object payload; // SDP or ICE candidate object
}
```

- [ ] **Step 2: Add `@MessageMapping("/call/signal")` in `ChatController.java`**
Routes signaling messages to `/topic/call/{calleeEmail}` using `SimpMessagingTemplate`.

- [ ] **Step 3: Add `@MessageMapping("/call/response")` for accept/reject/end events**

- [ ] **Step 4: Test signal routing through STOMP**

- [ ] **Step 5: Commit backend WebRTC signaling**
```bash
git add whatsapp-backend/
git commit -m "feat(backend): implement WebRTC signaling over WebSocket"
```

---

### Task 3.2: Frontend WebRTC Video & Audio Calling Modals
**Files:**
- Create: `whatsapp-frontend/src/services/webrtc.js`
- Create: `whatsapp-frontend/src/components/IncomingCallModal.js`
- Create: `whatsapp-frontend/src/components/ActiveCallModal.js`
- Modify: `whatsapp-frontend/src/pages/Chat.js`

- [ ] **Step 1: Create `webrtc.js` helper class/hook**
Manages `RTCPeerConnection`, Google public STUN servers (`stun:stun.l.google.com:19302`), local stream capture via `navigator.mediaDevices.getUserMedia`, and ICE candidate generation.

- [ ] **Step 2: Build `IncomingCallModal.js`**
WhatsApp-themed popup with caller name, caller avatar, "Incoming Voice/Video Call...", ringing animation, and green "Accept" and red "Decline" buttons.

- [ ] **Step 3: Build `ActiveCallModal.js`**
Full-screen calling overlay:
- Video mode: Large remote video stream + Draggable/PiP local stream
- Audio mode: Waveform animation + contact avatar
- Control toolbar: Toggle Mic (Mute/Unmute), Toggle Camera (On/Off), End Call (Red button), Call Duration Timer.

- [ ] **Step 4: Add Phone and Video Camera buttons to `Chat.js` header**
Clicking Phone initiates Voice Call; clicking Camera initiates Video Call.

- [ ] **Step 5: Verify peer-to-peer call flow between two browser tabs**

- [ ] **Step 6: Commit frontend WebRTC audio and video calling**
```bash
git add whatsapp-frontend/
git commit -m "feat(frontend): implement audio and video calling with WebRTC"
```

---

## Phase 4: WhatsApp Status / Stories Feature

### Task 4.1: Backend Status Entity, Repository & REST API
**Files:**
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/entity/Status.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/repository/StatusRepository.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/dto/StatusRequest.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/dto/StatusResponse.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/service/StatusService.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/controller/StatusController.java`

- [ ] **Step 1: Create `Status.java` Entity**
```java
@Entity
@Table(name = "statuses")
public class Status {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    private String type; // "TEXT" or "IMAGE"
    private String content; // Text message or Image URL
    private String caption;
    private String backgroundColor; // Hex code for text status
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt; // createdAt + 24 hours
}
```

- [ ] **Step 2: Add queries in `StatusRepository.java`**
Fetch non-expired statuses (`expiresAt > NOW()`) ordered by `createdAt DESC`.

- [ ] **Step 3: Implement `StatusService.java`**
Method to post status, fetch grouped active statuses by user, and delete status.

- [ ] **Step 4: Create `StatusController.java`**
```
POST   /api/status          -> Create status
GET    /api/status?email=   -> Get active status feed
DELETE /api/status/{id}     -> Delete own status
```

- [ ] **Step 5: Test status endpoints via curl**

- [ ] **Step 6: Commit backend Status feature**
```bash
git add whatsapp-backend/
git commit -m "feat(backend): add Status entity, repository, and REST API"
```

---

### Task 4.2: Frontend Status Tab & WhatsApp Story Viewer
**Files:**
- Modify: `whatsapp-frontend/src/services/api.js`
- Create: `whatsapp-frontend/src/components/StatusTab.js`
- Create: `whatsapp-frontend/src/components/CreateStatusModal.js`
- Create: `whatsapp-frontend/src/components/StatusViewerModal.js`
- Modify: `whatsapp-frontend/src/pages/Chat.js`

- [ ] **Step 1: Add Status API methods in `services/api.js`**
```javascript
export const getStatuses = (email) => api.get(`/api/status?email=${email}`);
export const createStatus = (data) => api.post('/api/status', data);
export const deleteStatus = (id) => api.delete(`/api/status/${id}`);
```

- [ ] **Step 2: Create `StatusTab.js` component**
Displays "My Status" card (shows current active status or "+" button to add) and "Recent Updates" list for contacts with green circular borders.

- [ ] **Step 3: Create `CreateStatusModal.js`**
Tabbed creation modal:
- Text status: Color picker background, customizable font text
- Photo status: File upload, caption input, image preview.

- [ ] **Step 4: Create `StatusViewerModal.js`**
WhatsApp Story Viewer:
- Animated top progress bars (one per story item, 5-second timer)
- User avatar, name, and time posted
- Pause on press/hold, tap left side for previous, tap right side for next
- Reply input bar at bottom sending reply directly as a chat message.

- [ ] **Step 5: Verify creating and viewing statuses across users**

- [ ] **Step 6: Commit frontend Status feature**
```bash
git add whatsapp-frontend/
git commit -m "feat(frontend): implement Status tab, status creation and story viewer"
```

---

## Phase 5: Calls History Tab

### Task 5.1: Backend Call Log Storage & Retrieval
**Files:**
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/entity/CallLog.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/repository/CallLogRepository.java`
- Create: `whatsapp-backend/src/main/java/com/whatsapp/whatsappclone/controller/CallController.java`

- [ ] **Step 1: Create `CallLog.java` entity**
Fields: `caller`, `receiver`, `callType` (VOICE/VIDEO), `status` (MISSED/ANSWERED/REJECTED), `startedAt`, `durationSeconds`.

- [ ] **Step 2: Create `CallLogRepository.java` & endpoints in `CallController.java`**
`GET /api/calls?email={email}` and `POST /api/calls/log`.

- [ ] **Step 3: Commit backend Call Log feature**
```bash
git add whatsapp-backend/
git commit -m "feat(backend): add CallLog entity and history API"
```

---

### Task 5.2: Frontend Calls Tab & Quick Call-Back
**Files:**
- Modify: `whatsapp-frontend/src/services/api.js`
- Create: `whatsapp-frontend/src/components/CallsTab.js`
- Modify: `whatsapp-frontend/src/pages/Chat.js`

- [ ] **Step 1: Add Call history API in `services/api.js`**

- [ ] **Step 2: Create `CallsTab.js`**
Lists recent calls with caller avatar, name, green/red arrow icon (incoming, outgoing, missed), timestamp, and a right-aligned phone/video icon for 1-click call-back.

- [ ] **Step 3: Integrate Calls tab into sidebar navigation rail in `Chat.js`**

- [ ] **Step 4: Commit frontend Calls tab**
```bash
git add whatsapp-frontend/
git commit -m "feat(frontend): implement Calls tab with call history and 1-click call back"
```

---

## Phase 6: WhatsApp Web Modern Theme & Polish

### Task 6.1: Sidebar Navigation Rail & Authentic WhatsApp Web Theme
**Files:**
- Modify: `whatsapp-frontend/src/pages/Chat.js`
- Modify: `whatsapp-frontend/src/index.css`
- Modify: `whatsapp-frontend/src/App.css`
- Create: `whatsapp-frontend/src/components/SidebarRail.js`
- Create: `whatsapp-frontend/src/components/EmojiPickerPopup.js`

- [ ] **Step 1: Create `SidebarRail.js` icon bar**
Vertical navigation rail on the far left featuring:
- Chats icon (with unread badge)
- Status icon (with status update dot)
- Calls icon
- User profile avatar & Logout / Settings icon at bottom.

- [ ] **Step 2: Add `EmojiPickerPopup.js`**
Clean WhatsApp emoji picker when clicking the `Smile` icon in chat input bar.

- [ ] **Step 3: Apply authentic WhatsApp Web dark/light CSS tokens**
Chat background doodle pattern, signature message bubbles (`#005c4b` for sent, `#202c33` for received), double ticks (grey / blue).

- [ ] **Step 4: Commit UI polish and navigation rail**
```bash
git add whatsapp-frontend/
git commit -m "feat(ui): implement WhatsApp Web sidebar rail, theme tokens, and emoji picker"
```

---

## Verification & Acceptance Plan

| Feature | Verification Step | Expected Result |
| :--- | :--- | :--- |
| **Multi-User Sessions** | Open Regular Browser (Alice) + Incognito Browser (Bob) | Both login independently; Alice sees Bob in contacts; Alice chats with Bob in private room |
| **Image Sharing** | Alice clicks Paperclip -> selects PNG -> preview -> send | Bob receives message with image thumbnail; clicking opens lightbox |
| **Voice Calling** | Alice clicks Phone icon on Bob's chat header | Bob gets incoming voice call ring modal -> Accept -> WebRTC connected audio |
| **Video Calling** | Alice clicks Camera icon on Bob's chat header | Both see local PiP and remote fullscreen video stream with mute & end controls |
| **Status / Stories** | Alice posts a photo/text status with caption | Bob sees Alice's update in Status tab with green ring; clicking opens story viewer |
| **Calls History** | End a call between Alice and Bob | Calls tab lists call timestamp, duration, and 1-click call-back button |

---

## Execution Choice

**Plan complete and saved to `plan.md`. Two execution options:**
1. **Subagent-Driven (recommended)** - Execute each phase task-by-task with isolated subagents and verification checkpoints.
2. **Inline Execution** - Step-by-step implementation in this current session with progressive checkpoints.
