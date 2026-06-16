import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getMessages, goOffline } from '../services/api';
import { connectWebSocket, subscribeToRoom, sendMessage } from '../services/websocket';

export default function Chat() {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const [wsClient, setWsClient] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');

    // Connect WebSocket on mount
    useEffect(() => {
        const client = connectWebSocket();
        setWsClient(client);
        return () => client?.deactivate();
    }, []);

    // Subscribe to room when activeRoom changes
    useEffect(() => {
        if (wsClient && activeRoom) {
            loadMessages(activeRoom.id);
            const sub = subscribeToRoom(wsClient, activeRoom.id, (msg) => {
                setMessages(prev => [...prev, msg]);
            });
            return () => sub?.unsubscribe();
        }
    }, [wsClient, activeRoom]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async (roomId) => {
        try {
            const res = await getMessages(roomId);
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to load messages');
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) return;
        try {
            const res = await createRoom(newRoomName, email);
            setRooms(prev => [...prev, res.data]);
            setNewRoomName('');
            setActiveRoom(res.data);
        } catch (err) {
            alert('Failed to create room!');
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !activeRoom) return;
        sendMessage(wsClient, newMessage, activeRoom.id, email);
        setNewMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    const handleLogout = async () => {
        await goOffline(email);
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div style={styles.container}>

            {/* LEFT SIDEBAR */}
            <div style={styles.sidebar}>

                {/* Header */}
                <div style={styles.sidebarHeader}>
                    <div style={styles.userInfo}>
                        <div style={styles.avatar}>{username?.[0]?.toUpperCase()}</div>
                        <span style={styles.username}>{username}</span>
                    </div>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Logout
                    </button>
                </div>

                {/* Create Room */}
                <div style={styles.createRoom}>
                    <input
                        style={styles.roomInput}
                        placeholder="New room name..."
                        value={newRoomName}
                        onChange={e => setNewRoomName(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleCreateRoom()}
                    />
                    <button onClick={handleCreateRoom} style={styles.createBtn}>+</button>
                </div>

                {/* Room List */}
                <div style={styles.roomList}>
                    {rooms.length === 0 && (
                        <div style={styles.emptyRooms}>
                            Create a room to start chatting!
                        </div>
                    )}
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            style={{
                                ...styles.roomItem,
                                background: activeRoom?.id === room.id ? '#2a3942' : 'transparent'
                            }}
                            onClick={() => setActiveRoom(room)}
                        >
                            <div style={styles.roomAvatar}>
                                {room.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={styles.roomName}>{room.name}</div>
                                <div style={styles.roomSub}>Click to open</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT CHAT AREA */}
            <div style={styles.chatArea}>
                {activeRoom ? (
                    <>
                        {/* Chat Header */}
                        <div style={styles.chatHeader}>
                            <div style={styles.roomAvatar}>
                                {activeRoom.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <div style={styles.chatRoomName}>{activeRoom.name}</div>
                                <div style={styles.chatRoomSub}>🟢 Active now</div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={styles.messages}>
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    style={{
                                        ...styles.messageWrapper,
                                        justifyContent: msg.senderUsername === username
                                            ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div
                                        style={{
                                            ...styles.message,
                                            background: msg.senderUsername === username
                                                ? '#005c4b' : '#202c33',
                                        }}
                                    >
                                        {msg.senderUsername !== username && (
                                            <div style={styles.senderName}>
                                                {msg.senderUsername}
                                            </div>
                                        )}
                                        <div style={styles.messageText}>{msg.content}</div>
                                        <div style={styles.messageTime}>
                                            {new Date(msg.sentAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={styles.inputArea}>
                            <input
                                style={styles.messageInput}
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <button
                                onClick={handleSendMessage}
                                style={styles.sendBtn}
                            >
                                ➤
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={styles.noRoom}>
                        <div style={styles.noRoomIcon}>💬</div>
                        <div style={styles.noRoomText}>
                            Select or create a room to start chatting
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', height: '100vh', background: '#111b21' },
    sidebar: { width: '360px', borderRight: '1px solid #222d34', display: 'flex', flexDirection: 'column' },
    sidebarHeader: { padding: '16px', background: '#202c33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' },
    username: { color: '#e9edef', fontSize: '15px', fontWeight: '500' },
    logoutBtn: { background: 'transparent', border: '1px solid #374045', color: '#8696a0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
    createRoom: { padding: '12px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid #222d34' },
    roomInput: { flex: 1, padding: '10px 12px', background: '#2a3942', border: 'none', borderRadius: '8px', color: '#e9edef', fontSize: '14px', outline: 'none' },
    createBtn: { width: '38px', height: '38px', background: '#00a884', border: 'none', borderRadius: '8px', color: 'white', fontSize: '20px', cursor: 'pointer' },
    roomList: { flex: 1, overflowY: 'auto' },
    emptyRooms: { padding: '30px 16px', color: '#8696a0', textAlign: 'center', fontSize: '13px' },
    roomItem: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #222d3422' },
    roomAvatar: { width: '46px', height: '46px', borderRadius: '50%', background: '#374045', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: '#aebac1', flexShrink: 0 },
    roomName: { color: '#e9edef', fontSize: '15px', fontWeight: '500' },
    roomSub: { color: '#8696a0', fontSize: '12px', marginTop: '2px' },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' },
    chatHeader: { padding: '12px 20px', background: '#202c33', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #222d34' },
    chatRoomName: { color: '#e9edef', fontSize: '16px', fontWeight: '500' },
    chatRoomSub: { color: '#8696a0', fontSize: '12px' },
    messages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    messageWrapper: { display: 'flex' },
    message: { maxWidth: '65%', padding: '8px 12px', borderRadius: '8px', position: 'relative' },
    senderName: { color: '#00a884', fontSize: '12px', fontWeight: '600', marginBottom: '4px' },
    messageText: { color: '#e9edef', fontSize: '14px', lineHeight: '1.4' },
    messageTime: { color: '#8696a0', fontSize: '10px', textAlign: 'right', marginTop: '4px' },
    inputArea: { padding: '12px 20px', background: '#202c33', display: 'flex', gap: '12px', alignItems: 'center' },
    messageInput: { flex: 1, padding: '12px 16px', background: '#2a3942', border: 'none', borderRadius: '24px', color: '#e9edef', fontSize: '14px', outline: 'none' },
    sendBtn: { width: '46px', height: '46px', background: '#00a884', border: 'none', borderRadius: '50%', color: 'white', fontSize: '18px', cursor: 'pointer' },
    noRoom: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
    noRoomIcon: { fontSize: '64px' },
    noRoomText: { color: '#8696a0', fontSize: '16px' },
};