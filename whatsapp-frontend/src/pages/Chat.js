import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getMessages, goOffline, getRooms } from '../services/api';
import { connectWebSocket, subscribeToRoom, sendMessage } from '../services/websocket';
import { 
    Search, MoreVertical, MessageSquare, Plus, Paperclip, 
    Smile, Mic, Send, Users, CircleDashed 
} from 'lucide-react';

export default function Chat() {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const [wsClient, setWsClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');

    // Connect WebSocket on mount and track connection status
    useEffect(() => {
        const client = connectWebSocket(
            () => setConnected(true),
            () => setConnected(false)
        );
        setWsClient(client);
        return () => client?.deactivate();
    }, []);

    // Fetch user's joined rooms on mount
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await getRooms(email);
                setRooms(res.data);
            } catch (err) {
                console.error('Failed to load user rooms');
            }
        };
        if (email) {
            fetchRooms();
        }
    }, [email]);

    // Subscribe to room when activeRoom or connection status changes
    useEffect(() => {
        if (wsClient && connected && activeRoom) {
            loadMessages(activeRoom.id);
            const sub = subscribeToRoom(wsClient, activeRoom.id, (msg) => {
                setMessages(prev => [...prev, msg]);
            });
            return () => sub?.unsubscribe();
        }
    }, [wsClient, connected, activeRoom]);

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
            setRooms(prev => {
                if (prev.some(r => r.id === res.data.id)) return prev;
                return [...prev, res.data];
            });
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

    const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div style={styles.appContainer}>
            {/* The green band behind the UI in large screens */}
            <div style={styles.backgroundBand}></div>
            
            <div style={styles.container}>
                {/* LEFT SIDEBAR */}
                <div style={styles.sidebar}>
                    {/* Header */}
                    <div style={styles.sidebarHeader}>
                        <div style={styles.avatar} onClick={handleLogout} title="Click to Logout">
                            {username?.[0]?.toUpperCase()}
                        </div>
                        <div style={styles.headerIcons}>
                            <Users size={20} color="var(--icon-color)" />
                            <CircleDashed size={20} color="var(--icon-color)" />
                            <MessageSquare size={20} color="var(--icon-color)" />
                            <MoreVertical size={20} color="var(--icon-color)" style={{cursor: 'pointer'}} onClick={handleLogout} title="Logout" />
                        </div>
                    </div>

                    {/* Search & Create Room Area */}
                    <div style={styles.searchContainer}>
                        <div style={styles.searchBox}>
                            <Search size={18} color="var(--icon-color)" style={styles.searchIcon} />
                            <input
                                style={styles.searchInput}
                                placeholder="Search or start new chat"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Create Room explicitly (for the clone's functionality) */}
                    <div style={styles.createRoom}>
                        <input
                            style={styles.roomInput}
                            placeholder="Type new room name..."
                            value={newRoomName}
                            onChange={e => setNewRoomName(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleCreateRoom()}
                        />
                        <button onClick={handleCreateRoom} style={styles.createBtn}><Plus size={20} /></button>
                    </div>

                    {/* Room List */}
                    <div style={styles.roomList}>
                        {filteredRooms.length === 0 && (
                            <div style={styles.emptyRooms}>No chats found</div>
                        )}
                        {filteredRooms.map(room => (
                            <div
                                key={room.id}
                                style={{
                                    ...styles.roomItem,
                                    background: activeRoom?.id === room.id ? 'var(--bg-default-hover)' : 'transparent'
                                }}
                                onClick={() => setActiveRoom(room)}
                            >
                                <div style={styles.roomAvatar}>
                                    {room.name?.[0]?.toUpperCase()}
                                </div>
                                <div style={styles.roomDetails}>
                                    <div style={styles.roomTopLine}>
                                        <div style={styles.roomName}>{room.name}</div>
                                        <div style={styles.roomTime}>Now</div>
                                    </div>
                                    <div style={styles.roomSub}>Tap to view chat</div>
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
                                <div style={styles.chatHeaderInfo}>
                                    <div style={styles.roomAvatar}>
                                        {activeRoom.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={styles.chatTitleContainer}>
                                        <div style={styles.chatRoomName}>{activeRoom.name}</div>
                                        <div style={styles.chatRoomSub}>click here for contact info</div>
                                    </div>
                                </div>
                                <div style={styles.headerIcons}>
                                    <Search size={20} color="var(--icon-color)" />
                                    <MoreVertical size={20} color="var(--icon-color)" />
                                </div>
                            </div>

                            {/* Messages Body */}
                            <div className="chat-bg" style={styles.messages}>
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderUsername === username;
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                ...styles.messageRow,
                                                justifyContent: isMe ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            <div
                                                style={{
                                                    ...styles.messageBubble,
                                                    background: isMe ? 'var(--msg-out)' : 'var(--msg-in)',
                                                    borderTopRightRadius: isMe ? 0 : '8px',
                                                    borderTopLeftRadius: isMe ? '8px' : 0,
                                                }}
                                            >
                                                {!isMe && (
                                                    <div style={styles.senderName}>
                                                        {msg.senderUsername}
                                                    </div>
                                                )}
                                                <div style={styles.messageContent}>
                                                    <span style={styles.messageText}>{msg.content}</span>
                                                    <span style={styles.messageTime}>
                                                        {new Date(msg.sentAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {/* Optional Message Tail */}
                                                <div style={isMe ? styles.tailRight : styles.tailLeft} />
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Footer */}
                            <div style={styles.inputFooter}>
                                <div style={styles.footerIcons}>
                                    <Smile size={24} color="var(--icon-color)" style={styles.iconButton} />
                                    <Plus size={24} color="var(--icon-color)" style={styles.iconButton} />
                                </div>
                                
                                <input
                                    style={styles.messageInput}
                                    placeholder="Type a message"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                                
                                <div style={styles.footerIconsRight} onClick={newMessage.trim() ? handleSendMessage : null}>
                                    {newMessage.trim() ? (
                                        <Send size={24} color="var(--icon-color)" style={styles.iconButton} />
                                    ) : (
                                        <Mic size={24} color="var(--icon-color)" style={styles.iconButton} />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={styles.noRoom}>
                            <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png" alt="WhatsApp Web" style={styles.noRoomImage} />
                            <h1 style={styles.noRoomTitle}>WhatsApp Web</h1>
                            <p style={styles.noRoomText}>
                                Send and receive messages without keeping your phone online.<br/>
                                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    appContainer: {
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--app-bg)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backgroundBand: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '127px',
        backgroundColor: 'var(--green-highlight)',
        zIndex: 0,
    },
    container: {
        display: 'flex',
        height: 'calc(100vh - 38px)',
        width: 'calc(100vw - 38px)',
        maxWidth: '1600px',
        backgroundColor: 'var(--bg-default)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
        zIndex: 1,
        overflow: 'hidden',
    },
    sidebar: {
        width: '30%',
        minWidth: '350px',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-default)',
    },
    sidebarHeader: {
        padding: '10px 16px',
        height: '59px',
        background: 'var(--panel-header)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box'
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#6b7c85',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '18px',
        cursor: 'pointer'
    },
    headerIcons: {
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
    },
    searchContainer: {
        padding: '8px 12px',
        background: 'var(--bg-default)',
        borderBottom: '1px solid var(--border-default)',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        background: 'var(--search-input)',
        borderRadius: '8px',
        padding: '0 12px',
        height: '35px',
    },
    searchIcon: {
        marginRight: '12px'
    },
    searchInput: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        color: 'var(--primary-title)',
        fontSize: '14px',
        outline: 'none',
    },
    createRoom: {
        padding: '12px',
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-default)'
    },
    roomInput: {
        flex: 1,
        padding: '8px 12px',
        background: 'var(--search-input)',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--primary-title)',
        fontSize: '14px',
        outline: 'none'
    },
    createBtn: {
        width: '35px',
        height: '35px',
        background: 'var(--search-input)',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--icon-color)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    roomList: {
        flex: 1,
        overflowY: 'auto',
        background: 'var(--bg-default)'
    },
    emptyRooms: {
        padding: '30px 16px',
        color: 'var(--secondary-text)',
        textAlign: 'center',
        fontSize: '14px'
    },
    roomItem: {
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        height: '72px',
    },
    roomAvatar: {
        width: '49px',
        height: '49px',
        borderRadius: '50%',
        background: '#6b7c85',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '18px',
        color: 'white',
        flexShrink: 0,
        marginRight: '15px'
    },
    roomDetails: {
        flex: 1,
        borderBottom: '1px solid var(--border-default)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingRight: '12px'
    },
    roomTopLine: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2px'
    },
    roomName: {
        color: 'var(--primary-title)',
        fontSize: '17px',
        fontWeight: '400'
    },
    roomTime: {
        color: 'var(--secondary-text)',
        fontSize: '12px'
    },
    roomSub: {
        color: 'var(--secondary-text)',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    chatArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-chat)'
    },
    chatHeader: {
        padding: '10px 16px',
        height: '59px',
        background: 'var(--panel-header)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box'
    },
    chatHeaderInfo: {
        display: 'flex',
        alignItems: 'center'
    },
    chatTitleContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
    },
    chatRoomName: {
        color: 'var(--primary-title)',
        fontSize: '16px',
        fontWeight: '400'
    },
    chatRoomSub: {
        color: 'var(--secondary-text)',
        fontSize: '13px',
        marginTop: '2px'
    },
    messages: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    messageRow: {
        display: 'flex',
        marginBottom: '4px',
        width: '100%'
    },
    messageBubble: {
        maxWidth: '65%',
        padding: '6px 7px 8px 9px',
        borderRadius: '8px',
        position: 'relative',
        boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
    },
    senderName: {
        color: '#ff8a8c',
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '2px',
        lineHeight: '22px'
    },
    messageContent: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
    },
    messageText: {
        color: '#e9edef',
        fontSize: '14.2px',
        lineHeight: '19px',
        paddingRight: '12px',
        wordBreak: 'break-word',
    },
    messageTime: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '11px',
        marginTop: '4px',
        marginLeft: 'auto',
        float: 'right',
        lineHeight: '15px'
    },
    tailLeft: {
        position: 'absolute',
        top: 0,
        left: '-8px',
        width: '8px',
        height: '13px',
        background: 'radial-gradient(circle at bottom left, transparent 8px, var(--msg-in) 8px)'
    },
    tailRight: {
        position: 'absolute',
        top: 0,
        right: '-8px',
        width: '8px',
        height: '13px',
        background: 'radial-gradient(circle at bottom right, transparent 8px, var(--msg-out) 8px)'
    },
    inputFooter: {
        padding: '10px 16px',
        background: 'var(--panel-header)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        minHeight: '62px',
        boxSizing: 'border-box'
    },
    footerIcons: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        padding: '0 8px'
    },
    footerIconsRight: {
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        cursor: 'pointer'
    },
    iconButton: {
        cursor: 'pointer'
    },
    messageInput: {
        flex: 1,
        padding: '9px 12px',
        background: 'var(--search-input)',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--primary-title)',
        fontSize: '15px',
        outline: 'none',
        height: '42px',
        boxSizing: 'border-box'
    },
    noRoom: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--panel-header)',
        borderBottom: '6px solid var(--green-highlight)',
        padding: '0 20px',
        textAlign: 'center'
    },
    noRoomImage: {
        width: '320px',
        marginBottom: '28px'
    },
    noRoomTitle: {
        color: 'var(--primary-title)',
        fontSize: '32px',
        fontWeight: '300',
        marginBottom: '18px'
    },
    noRoomText: {
        color: 'var(--secondary-text)',
        fontSize: '14px',
        lineHeight: '20px',
        maxWidth: '560px'
    }
};