import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getMessages, goOffline, getRoomsDetailed } from '../services/api';
import { connectWebSocket, subscribeToRoom, sendMessage } from '../services/websocket';
import { 
    Search, MoreVertical, MessageSquare, Plus, 
    Smile, Mic, Send, Users, CircleDashed, Phone, Video, 
    CheckCheck, Lock, Settings, Radio, ArrowLeft, 
    Camera, Image, FileText, BarChart2, LogOut, X, Archive
} from 'lucide-react';
import NewChatModal from '../components/NewChatModal';

export default function Chat() {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [wsClient, setWsClient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [activeRailTab, setActiveRailTab] = useState('chats'); // 'chats', 'status', 'channels', 'communities', 'settings', 'profile'
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'groups'
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showRoomMenu, setShowRoomMenu] = useState(false);
    const [messageReactions, setMessageReactions] = useState({});

    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const email = localStorage.getItem('email');
    const username = localStorage.getItem('username');

    const popularEmojis = [
        '😀', '😂', '🤣', '😍', '🥰', '😎', '🙏', '👍', 
        '🔥', '❤️', '🎉', '✨', '👏', '🥳', '💯', '🚀'
    ];

    // Connect WebSocket on mount
    useEffect(() => {
        const client = connectWebSocket(
            () => setConnected(true),
            () => setConnected(false)
        );
        setWsClient(client);
        return () => client?.deactivate();
    }, []);

    const fetchRooms = useCallback(async () => {
        if (!email) return;
        try {
            const res = await getRoomsDetailed(email);
            setRooms(res.data);
            if (activeRoom) {
                const refreshed = res.data.find(r => r.id === activeRoom.id);
                if (refreshed) setActiveRoom(refreshed);
            }
        } catch (err) {
            console.error('Failed to load user rooms', err);
        }
    }, [email, activeRoom]);

    // Fetch user's joined rooms on mount
    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Subscribe to room when activeRoom or connection status changes
    useEffect(() => {
        if (wsClient && connected && activeRoom) {
            loadMessages(activeRoom.id);
            const sub = subscribeToRoom(wsClient, activeRoom.id, (msg) => {
                setMessages(prev => [...prev, msg]);
                setRooms(prev => prev.map(r => {
                    if (r.id === activeRoom.id) {
                        return {
                            ...r,
                            lastMessage: msg.content,
                            lastMessageTime: msg.sentAt
                        };
                    }
                    return r;
                }));
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

    const handleCreateGroup = async () => {
        const groupName = window.prompt('Enter name for the new group chat:');
        if (!groupName || !groupName.trim()) return;
        try {
            const res = await createRoom(groupName.trim(), email);
            setRooms(prev => {
                if (prev.some(r => r.id === res.data.id)) return prev;
                return [...prev, res.data];
            });
            setActiveRoom(res.data);
            setShowMoreMenu(false);
        } catch (err) {
            alert('Failed to create group!');
        }
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !activeRoom) return;
        sendMessage(wsClient, newMessage, activeRoom.id, email);
        setNewMessage('');
        setShowEmojiPicker(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    const handleLogout = async () => {
        await goOffline(email);
        localStorage.clear();
        navigate('/login');
    };

    const handleReaction = (msgId, emoji) => {
        setMessageReactions(prev => ({
            ...prev,
            [msgId]: prev[msgId] === emoji ? null : emoji
        }));
    };

    // Filter rooms by query & filter tab
    const filteredRooms = rooms.filter(r => {
        const matchesQuery = (r.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesQuery) return false;
        if (activeFilter === 'groups') return r.isGroup;
        if (activeFilter === 'unread') return r.unreadCount > 0;
        return true;
    });

    const getAvatarColor = (name) => {
        const colors = ['#00a884', '#1f7a8c', '#6f42c1', '#d97706', '#0284c7', '#e11d48', '#059669'];
        const index = Math.abs((name || 'U').charCodeAt(0)) % colors.length;
        return colors[index];
    };

    return (
        <div style={styles.appContainer}>
            <div style={styles.container}>
                
                {/* 1. LEFT NAVIGATION RAIL (WhatsApp Web Modern UI) */}
                <div style={styles.navRail}>
                    <div style={styles.navRailTop}>
                        {/* Chats icon */}
                        <div 
                            style={{
                                ...styles.navRailBtn,
                                backgroundColor: activeRailTab === 'chats' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                color: activeRailTab === 'chats' ? '#00a884' : 'var(--icon-color)'
                            }}
                            onClick={() => setActiveRailTab('chats')}
                            title="Chats"
                        >
                            <MessageSquare size={22} />
                            {activeRailTab === 'chats' && <div style={styles.activeRailIndicator} />}
                        </div>

                        {/* Status icon */}
                        <div 
                            style={{
                                ...styles.navRailBtn,
                                backgroundColor: activeRailTab === 'status' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                color: activeRailTab === 'status' ? '#00a884' : 'var(--icon-color)'
                            }}
                            onClick={() => setActiveRailTab('status')}
                            title="Status"
                        >
                            <CircleDashed size={22} />
                        </div>

                        {/* Channels icon */}
                        <div 
                            style={{
                                ...styles.navRailBtn,
                                backgroundColor: activeRailTab === 'channels' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                color: activeRailTab === 'channels' ? '#00a884' : 'var(--icon-color)'
                            }}
                            onClick={() => setActiveRailTab('channels')}
                            title="Channels"
                        >
                            <Radio size={22} />
                        </div>

                        {/* Communities icon */}
                        <div 
                            style={{
                                ...styles.navRailBtn,
                                backgroundColor: activeRailTab === 'communities' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                color: activeRailTab === 'communities' ? '#00a884' : 'var(--icon-color)'
                            }}
                            onClick={() => setActiveRailTab('communities')}
                            title="Communities"
                        >
                            <Users size={22} />
                        </div>
                    </div>

                    <div style={styles.navRailBottom}>
                        {/* Settings icon */}
                        <div 
                            style={{
                                ...styles.navRailBtn,
                                color: 'var(--icon-color)'
                            }}
                            onClick={() => setActiveRailTab('settings')}
                            title="Settings"
                        >
                            <Settings size={22} />
                        </div>

                        {/* User Profile Avatar */}
                        <div 
                            style={styles.railAvatar} 
                            onClick={() => setActiveRailTab(activeRailTab === 'profile' ? 'chats' : 'profile')}
                            title={`Logged in as ${username}`}
                        >
                            {username?.[0]?.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* 2. SECOND COLUMN: CHATS LIST OR DRAWER */}
                <div style={styles.sidebar}>

                    {/* A. PROFILE DRAWER */}
                    {activeRailTab === 'profile' && (
                        <div className="slide-drawer" style={styles.drawerContainer}>
                            <div style={styles.drawerHeader}>
                                <button style={styles.drawerBackBtn} onClick={() => setActiveRailTab('chats')}>
                                    <ArrowLeft size={20} color="var(--primary-title)" />
                                </button>
                                <span style={styles.drawerHeaderTitle}>Profile</span>
                            </div>
                            <div style={styles.profileBody}>
                                <div style={styles.profileAvatarLarge}>
                                    {username?.[0]?.toUpperCase()}
                                    <div style={styles.cameraOverlay} title="Change Profile Photo">
                                        <Camera size={20} color="white" />
                                    </div>
                                </div>
                                <div style={styles.profileSection}>
                                    <div style={styles.profileSectionLabel}>Your name</div>
                                    <div style={styles.profileSectionValue}>{username}</div>
                                    <div style={styles.profileSectionHint}>This is not your username or pin. This name will be visible to your WhatsApp contacts.</div>
                                </div>
                                <div style={styles.profileSection}>
                                    <div style={styles.profileSectionLabel}>Email</div>
                                    <div style={styles.profileSectionValue}>{email}</div>
                                </div>
                                <div style={styles.profileSection}>
                                    <div style={styles.profileSectionLabel}>About</div>
                                    <div style={styles.profileSectionValue}>Hey there! I am using WhatsApp.</div>
                                </div>
                                <button style={styles.logoutBtn} onClick={handleLogout}>
                                    <LogOut size={18} style={{ marginRight: '8px' }} />
                                    Log out of WhatsApp
                                </button>
                            </div>
                        </div>
                    )}

                    {/* B. STATUS DRAWER */}
                    {activeRailTab === 'status' && (
                        <div className="slide-drawer" style={styles.drawerContainer}>
                            <div style={styles.drawerHeader}>
                                <button style={styles.drawerBackBtn} onClick={() => setActiveRailTab('chats')}>
                                    <ArrowLeft size={20} color="var(--primary-title)" />
                                </button>
                                <span style={styles.drawerHeaderTitle}>Status</span>
                            </div>
                            <div style={styles.statusBody}>
                                <div style={styles.myStatusItem}>
                                    <div style={styles.myStatusAvatar}>
                                        {username?.[0]?.toUpperCase()}
                                        <div style={styles.addStatusBadge}>+</div>
                                    </div>
                                    <div style={styles.statusInfo}>
                                        <div style={styles.statusTitle}>My Status</div>
                                        <div style={styles.statusSub}>No updates</div>
                                    </div>
                                </div>
                                <div style={styles.sectionHeaderTitle}>RECENT UPDATES</div>
                                <div style={styles.statusItem}>
                                    <div style={styles.statusAvatarRing}>
                                        <div style={styles.statusAvatarInner}>A</div>
                                    </div>
                                    <div style={styles.statusInfo}>
                                        <div style={styles.statusTitle}>Alice</div>
                                        <div style={styles.statusSub}>Today at 18:30</div>
                                    </div>
                                </div>
                                <div style={styles.statusItem}>
                                    <div style={styles.statusAvatarRing}>
                                        <div style={styles.statusAvatarInner}>B</div>
                                    </div>
                                    <div style={styles.statusInfo}>
                                        <div style={styles.statusTitle}>Bob</div>
                                        <div style={styles.statusSub}>Today at 14:15</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* C. DEFAULT CHATS LIST */}
                    {activeRailTab !== 'profile' && activeRailTab !== 'status' && (
                        <>
                            {/* Chats Header */}
                            <div style={styles.sidebarHeader}>
                                <span style={styles.sidebarMainTitle}>Chats</span>
                                <div style={styles.headerIcons}>
                                    <div 
                                        style={styles.headerIconBtn} 
                                        onClick={() => setIsNewChatOpen(true)}
                                        title="New chat"
                                    >
                                        <Plus size={20} color="var(--icon-color)" />
                                    </div>
                                    <div 
                                        style={styles.headerIconBtn}
                                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                                        title="Menu"
                                    >
                                        <MoreVertical size={20} color="var(--icon-color)" />
                                    </div>
                                    {showMoreMenu && (
                                        <div className="pop-in" style={styles.dropdownMenu}>
                                            <div style={styles.dropdownItem} onClick={handleCreateGroup}>New group</div>
                                            <div style={styles.dropdownItem} onClick={() => { setActiveRailTab('profile'); setShowMoreMenu(false); }}>Settings</div>
                                            <div style={styles.dropdownItem} onClick={handleLogout}>Log out</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Search & Filter Bar */}
                            <div style={styles.searchContainer}>
                                <div style={styles.searchBox}>
                                    <Search size={18} color="var(--icon-color)" style={styles.searchIcon} />
                                    <input
                                        style={styles.searchInput}
                                        placeholder="Search or start new chat"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <X 
                                            size={16} 
                                            color="var(--icon-color)" 
                                            style={{ cursor: 'pointer', marginRight: '8px' }} 
                                            onClick={() => setSearchQuery('')}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Filter Chips (All, Unread, Groups) */}
                            <div style={styles.filterRow}>
                                <button 
                                    style={{
                                        ...styles.filterPill,
                                        backgroundColor: activeFilter === 'all' ? '#00a884' : 'var(--search-input)',
                                        color: activeFilter === 'all' ? '#111b21' : 'var(--secondary-text)',
                                        fontWeight: activeFilter === 'all' ? '600' : 'normal'
                                    }}
                                    onClick={() => setActiveFilter('all')}
                                >
                                    All
                                </button>
                                <button 
                                    style={{
                                        ...styles.filterPill,
                                        backgroundColor: activeFilter === 'unread' ? '#00a884' : 'var(--search-input)',
                                        color: activeFilter === 'unread' ? '#111b21' : 'var(--secondary-text)',
                                        fontWeight: activeFilter === 'unread' ? '600' : 'normal'
                                    }}
                                    onClick={() => setActiveFilter('unread')}
                                >
                                    Unread
                                </button>
                                <button 
                                    style={{
                                        ...styles.filterPill,
                                        backgroundColor: activeFilter === 'groups' ? '#00a884' : 'var(--search-input)',
                                        color: activeFilter === 'groups' ? '#111b21' : 'var(--secondary-text)',
                                        fontWeight: activeFilter === 'groups' ? '600' : 'normal'
                                    }}
                                    onClick={() => setActiveFilter('groups')}
                                >
                                    Groups
                                </button>
                            </div>

                            {/* Archived Row */}
                            <div style={styles.archivedRow} onClick={() => alert('Archived chats folder')}>
                                <Archive size={18} color="var(--icon-color)" style={{ marginRight: '16px' }} />
                                <span style={styles.archivedText}>Archived</span>
                            </div>

                            {/* Room List */}
                            <div style={styles.roomList}>
                                {filteredRooms.length === 0 && (
                                    <div style={styles.emptyRooms}>
                                        <p style={{ margin: '0 0 12px 0', color: 'var(--secondary-text)', fontSize: '14px' }}>
                                            No chats found
                                        </p>
                                        <button 
                                            onClick={() => setIsNewChatOpen(true)}
                                            style={styles.startNewChatBtn}
                                        >
                                            Start a New Chat
                                        </button>
                                    </div>
                                )}
                                {filteredRooms.map(room => {
                                    const isSelected = activeRoom?.id === room.id;
                                    return (
                                        <div
                                            key={room.id}
                                            style={{
                                                ...styles.roomItem,
                                                backgroundColor: isSelected ? 'var(--bg-sidebar-hover)' : 'transparent'
                                            }}
                                            onClick={() => setActiveRoom(room)}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <div 
                                                    style={{
                                                        ...styles.roomAvatar,
                                                        backgroundColor: getAvatarColor(room.name)
                                                    }}
                                                >
                                                    {room.name?.[0]?.toUpperCase()}
                                                </div>
                                                {room.partnerOnline && <div style={styles.onlineBadge} />}
                                            </div>
                                            <div style={styles.roomDetails}>
                                                <div style={styles.roomTopLine}>
                                                    <span style={styles.roomName}>{room.name}</span>
                                                    <span style={styles.roomTime}>
                                                        {room.lastMessageTime 
                                                            ? new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : ''}
                                                    </span>
                                                </div>
                                                <div style={styles.roomBottomLine}>
                                                    <div style={styles.roomSub}>
                                                        {room.lastMessage ? (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <CheckCheck size={14} color="#8696a0" />
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {room.lastMessage}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span>{room.isGroup ? 'Group chat' : 'Tap to view chat'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* 3. RIGHT COLUMN: ACTIVE CHAT OR WHATSAPP WEB HERO SPLASH */}
                <div style={styles.chatArea}>
                    {activeRoom ? (
                        <>
                            {/* Active Chat Header */}
                            <div style={styles.chatHeader}>
                                <div style={styles.chatHeaderInfo}>
                                    <div style={{ position: 'relative' }}>
                                        <div 
                                            style={{
                                                ...styles.roomAvatar,
                                                backgroundColor: getAvatarColor(activeRoom.name)
                                            }}
                                        >
                                            {activeRoom.name?.[0]?.toUpperCase()}
                                        </div>
                                        {activeRoom.partnerOnline && <div style={styles.onlineBadge} />}
                                    </div>
                                    <div style={styles.chatTitleContainer}>
                                        <div style={styles.chatRoomName}>{activeRoom.name}</div>
                                        <div style={{
                                            ...styles.chatRoomSub,
                                            color: activeRoom.partnerOnline ? 'var(--online-green)' : 'var(--secondary-text)'
                                        }}>
                                            {activeRoom.partnerOnline ? 'online' : (activeRoom.isGroup ? `${activeRoom.memberCount || 2} members` : 'offline')}
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.headerIcons}>
                                    <div 
                                        style={styles.headerIconBtn} 
                                        title="Voice call"
                                        onClick={() => alert(`Voice calling ${activeRoom.name}...`)}
                                    >
                                        <Phone size={19} color="var(--icon-color)" />
                                    </div>
                                    <div 
                                        style={styles.headerIconBtn} 
                                        title="Video call"
                                        onClick={() => alert(`Video calling ${activeRoom.name}...`)}
                                    >
                                        <Video size={19} color="var(--icon-color)" />
                                    </div>
                                    <div style={styles.headerIconDivider} />
                                    <div style={styles.headerIconBtn} title="Search in chat">
                                        <Search size={19} color="var(--icon-color)" />
                                    </div>
                                    <div 
                                        style={styles.headerIconBtn} 
                                        title="More options"
                                        onClick={() => setShowRoomMenu(!showRoomMenu)}
                                    >
                                        <MoreVertical size={19} color="var(--icon-color)" />
                                    </div>
                                    {showRoomMenu && (
                                        <div className="pop-in" style={styles.roomDropdownMenu}>
                                            <div style={styles.dropdownItem} onClick={() => { alert(`Contact Info: ${activeRoom.name}`); setShowRoomMenu(false); }}>Contact info</div>
                                            <div style={styles.dropdownItem} onClick={() => { setActiveRoom(null); setShowRoomMenu(false); }}>Close chat</div>
                                            <div style={styles.dropdownItem} onClick={() => { alert('Notifications muted'); setShowRoomMenu(false); }}>Mute notifications</div>
                                            <div style={styles.dropdownItem} onClick={() => { setMessages([]); setShowRoomMenu(false); }}>Clear chat</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Chat Messages Body with Doodle Background */}
                            <div className="chat-bg" style={styles.messagesContainer}>
                                
                                {/* Yellow Encryption Notice Banner */}
                                <div style={styles.encryptionCard}>
                                    <Lock size={12} color="#ffd279" style={{ marginRight: '6px', flexShrink: 0 }} />
                                    <span>Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them. Tap to learn more.</span>
                                </div>

                                {/* Date Divider Pill */}
                                <div style={styles.dateDividerContainer}>
                                    <span style={styles.dateDividerPill}>TODAY</span>
                                </div>

                                {/* Message List */}
                                {messages.map((msg, index) => {
                                    const isMe = (msg.senderEmail && email) 
                                        ? msg.senderEmail.toLowerCase() === email.toLowerCase() 
                                        : msg.senderUsername === username;
                                    const reaction = messageReactions[msg.id || index];

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
                                                    backgroundColor: isMe ? 'var(--msg-out)' : 'var(--msg-in)',
                                                    borderTopRightRadius: isMe ? 0 : '8px',
                                                    borderTopLeftRadius: isMe ? '8px' : 0,
                                                }}
                                            >
                                                {/* Speech bubble tail */}
                                                <div className={isMe ? 'bubble-tail-out' : 'bubble-tail-in'} />

                                                {/* Group Chat Sender Name */}
                                                {!isMe && (
                                                    <div style={styles.senderName}>
                                                        {msg.senderUsername}
                                                    </div>
                                                )}

                                                {/* Message Text and Timestamp */}
                                                <div style={styles.messageContent}>
                                                    <span style={styles.messageText}>{msg.content}</span>
                                                    <span style={styles.messageTime}>
                                                        {new Date(msg.sentAt).toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        {isMe && (
                                                            <CheckCheck size={14} color="var(--tick-blue)" style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Reaction badge if applied */}
                                                {reaction && (
                                                    <div style={styles.reactionBadge}>
                                                        {reaction}
                                                    </div>
                                                )}

                                                {/* Hover Reaction Bar */}
                                                <div style={styles.reactionHoverBar}>
                                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(e => (
                                                        <span 
                                                            key={e} 
                                                            style={styles.reactionEmoji}
                                                            onClick={() => handleReaction(msg.id || index, e)}
                                                        >
                                                            {e}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input Footer */}
                            <div style={styles.inputFooter}>
                                
                                {/* Emoji Picker Popover */}
                                {showEmojiPicker && (
                                    <div className="pop-in" style={styles.emojiPickerPopover}>
                                        <div style={styles.emojiGrid}>
                                            {popularEmojis.map(emoji => (
                                                <span 
                                                    key={emoji} 
                                                    style={styles.emojiPickerItem}
                                                    onClick={() => setNewMessage(prev => prev + emoji)}
                                                >
                                                    {emoji}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Attachment Speed-dial Popover */}
                                {showAttachMenu && (
                                    <div className="pop-in" style={styles.attachMenuPopover}>
                                        <div style={styles.attachMenuItem} onClick={() => { alert('Photos & Videos picker'); setShowAttachMenu(false); }}>
                                            <div style={{ ...styles.attachIconCircle, backgroundColor: '#c85a80' }}><Image size={18} color="white" /></div>
                                            <span>Photos & Videos</span>
                                        </div>
                                        <div style={styles.attachMenuItem} onClick={() => { alert('Camera'); setShowAttachMenu(false); }}>
                                            <div style={{ ...styles.attachIconCircle, backgroundColor: '#ec407a' }}><Camera size={18} color="white" /></div>
                                            <span>Camera</span>
                                        </div>
                                        <div style={styles.attachMenuItem} onClick={() => { alert('Document picker'); setShowAttachMenu(false); }}>
                                            <div style={{ ...styles.attachIconCircle, backgroundColor: '#5f66cd' }}><FileText size={18} color="white" /></div>
                                            <span>Document</span>
                                        </div>
                                        <div style={styles.attachMenuItem} onClick={() => { alert('Poll creation'); setShowAttachMenu(false); }}>
                                            <div style={{ ...styles.attachIconCircle, backgroundColor: '#f59e0b' }}><BarChart2 size={18} color="white" /></div>
                                            <span>Poll</span>
                                        </div>
                                    </div>
                                )}

                                <div style={styles.footerActionGroup}>
                                    <div 
                                        style={{
                                            ...styles.footerIconBtn,
                                            color: showEmojiPicker ? '#00a884' : 'var(--icon-color)'
                                        }}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        title="Emoji"
                                    >
                                        <Smile size={24} />
                                    </div>
                                    <div 
                                        style={{
                                            ...styles.footerIconBtn,
                                            color: showAttachMenu ? '#00a884' : 'var(--icon-color)',
                                            transform: showAttachMenu ? 'rotate(45deg)' : 'none',
                                            transition: 'transform 0.2s ease'
                                        }}
                                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                                        title="Attach"
                                    >
                                        <Plus size={24} />
                                    </div>
                                </div>
                                
                                <div style={styles.messageInputWrapper}>
                                    <input
                                        style={styles.messageInput}
                                        placeholder="Type a message"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                </div>
                                
                                <div 
                                    style={styles.footerSendBtn} 
                                    onClick={newMessage.trim() ? handleSendMessage : null}
                                    title={newMessage.trim() ? 'Send' : 'Voice note'}
                                >
                                    {newMessage.trim() ? (
                                        <Send size={22} color="var(--icon-color)" />
                                    ) : (
                                        <Mic size={22} color="var(--icon-color)" />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Authentic WhatsApp Web Hero Splash Screen */
                        <div style={styles.noRoomContainer}>
                            <div style={styles.noRoomIllustration}>
                                <img 
                                    src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669aeJeom.png" 
                                    alt="WhatsApp Web" 
                                    style={styles.noRoomImage} 
                                />
                            </div>
                            <h1 style={styles.noRoomTitle}>WhatsApp Web</h1>
                            <p style={styles.noRoomText}>
                                Send and receive messages without keeping your phone online.<br/>
                                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                            </p>
                            <div style={styles.lockBadge}>
                                <Lock size={13} color="var(--secondary-text)" style={{ marginRight: '6px' }} />
                                <span>End-to-end encrypted</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Contacts Modal */}
            <NewChatModal
                isOpen={isNewChatOpen}
                onClose={() => setIsNewChatOpen(false)}
                currentUserEmail={email}
                onSelectChat={(room) => {
                    fetchRooms();
                    setActiveRoom(room);
                }}
            />
        </div>
    );
}

const styles = {
    appContainer: {
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    container: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-sidebar)',
        overflow: 'hidden',
    },
    
    /* 1. Left Nav Rail */
    navRail: {
        width: '64px',
        backgroundColor: 'var(--bg-rail)',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        zIndex: 5,
        flexShrink: 0,
    },
    navRailTop: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        alignItems: 'center',
    },
    navRailBottom: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        alignItems: 'center',
    },
    navRailBtn: {
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.15s ease',
    },
    activeRailIndicator: {
        position: 'absolute',
        left: '-11px',
        top: '9px',
        width: '4px',
        height: '24px',
        borderRadius: '0 4px 4px 0',
        backgroundColor: '#00a884',
    },
    railAvatar: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#6b7c85',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '15px',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },

    /* 2. Second Column Sidebar */
    sidebar: {
        width: '400px',
        minWidth: '340px',
        borderRight: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-sidebar)',
        position: 'relative',
        height: '100%',
    },
    sidebarHeader: {
        padding: '16px 20px 10px 20px',
        height: '60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--bg-sidebar)',
        position: 'relative',
    },
    sidebarMainTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--primary-title)',
        letterSpacing: '-0.3px',
    },
    headerIcons: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
    },
    headerIconBtn: {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '50%',
        transition: 'background-color 0.15s ease',
    },
    headerIconDivider: {
        width: '1px',
        height: '20px',
        backgroundColor: 'var(--border-default)',
    },

    /* Search & Filter */
    searchContainer: {
        padding: '6px 14px 10px 14px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--search-input)',
        borderRadius: '8px',
        padding: '0 12px',
        height: '36px',
    },
    searchIcon: {
        marginRight: '14px',
        flexShrink: 0,
    },
    searchInput: {
        width: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        color: 'var(--primary-title)',
        fontSize: '14px',
    },
    filterRow: {
        display: 'flex',
        gap: '8px',
        padding: '0 14px 12px 14px',
    },
    filterPill: {
        border: 'none',
        borderRadius: '16px',
        padding: '6px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },

    /* Archived Row */
    archivedRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
    },
    archivedText: {
        fontSize: '15px',
        fontWeight: '500',
        color: 'var(--primary-title)',
    },

    /* Room List */
    roomList: {
        flex: 1,
        overflowY: 'auto',
    },
    emptyRooms: {
        textAlign: 'center',
        padding: '40px 20px',
    },
    startNewChatBtn: {
        backgroundColor: '#00a884',
        color: 'white',
        border: 'none',
        borderRadius: '24px',
        padding: '9px 18px',
        fontSize: '14px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    roomItem: {
        display: 'flex',
        padding: '10px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border-subtle)',
        alignItems: 'center',
        transition: 'background-color 0.1s ease',
    },
    roomAvatar: {
        width: '49px',
        height: '49px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '18px',
        flexShrink: 0,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: 'var(--online-green)',
        border: '2px solid var(--bg-sidebar)',
    },
    roomDetails: {
        marginLeft: '14px',
        flex: 1,
        overflow: 'hidden',
    },
    roomTopLine: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '4px',
    },
    roomName: {
        fontSize: '16px',
        color: 'var(--primary-title)',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    roomTime: {
        fontSize: '12px',
        color: 'var(--secondary-text)',
    },
    roomBottomLine: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roomSub: {
        fontSize: '14px',
        color: 'var(--secondary-text)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },

    /* 3. Right Chat Area */
    chatArea: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-chat)',
        position: 'relative',
        height: '100%',
    },
    chatHeader: {
        height: '60px',
        padding: '10px 18px',
        backgroundColor: 'var(--panel-header)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-default)',
        zIndex: 2,
    },
    chatHeaderInfo: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
    },
    chatTitleContainer: {
        marginLeft: '14px',
    },
    chatRoomName: {
        fontSize: '16px',
        color: 'var(--primary-title)',
        fontWeight: '600',
    },
    chatRoomSub: {
        fontSize: '12px',
        textTransform: 'capitalize',
        marginTop: '1px',
    },
    messagesContainer: {
        flex: 1,
        padding: '16px 50px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    encryptionCard: {
        backgroundColor: 'var(--system-message-bg)',
        color: '#ffd279',
        fontSize: '12.5px',
        padding: '7px 14px',
        borderRadius: '8px',
        textAlign: 'center',
        margin: '0 auto 16px auto',
        maxWidth: '560px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '1.4',
    },
    dateDividerContainer: {
        textAlign: 'center',
        marginBottom: '16px',
    },
    dateDividerPill: {
        backgroundColor: 'var(--system-message-bg)',
        color: 'var(--secondary-text)',
        fontSize: '12px',
        fontWeight: '500',
        padding: '5px 12px',
        borderRadius: '8px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    },
    messageRow: {
        display: 'flex',
        marginBottom: '5px',
        position: 'relative',
    },
    messageBubble: {
        maxWidth: '65%',
        padding: '6px 10px 7px 10px',
        borderRadius: '8px',
        position: 'relative',
        boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
    },
    senderName: {
        fontSize: '12.5px',
        fontWeight: '600',
        color: '#53bdeb',
        marginBottom: '2px',
    },
    messageContent: {
        display: 'flex',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        gap: '8px',
    },
    messageText: {
        fontSize: '14.2px',
        color: 'var(--primary-title)',
        lineHeight: '1.38',
        wordBreak: 'break-word',
    },
    messageTime: {
        fontSize: '11px',
        color: 'var(--secondary-text)',
        marginLeft: 'auto',
        whiteSpace: 'nowrap',
        lineHeight: '1',
    },
    reactionBadge: {
        position: 'absolute',
        bottom: '-10px',
        right: '10px',
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-default)',
        borderRadius: '10px',
        padding: '1px 5px',
        fontSize: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    },
    reactionHoverBar: {
        position: 'absolute',
        top: '-32px',
        right: '0',
        backgroundColor: 'var(--panel-header)',
        border: '1px solid var(--border-default)',
        borderRadius: '20px',
        padding: '3px 8px',
        display: 'none',
        gap: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        zIndex: 10,
    },
    reactionEmoji: {
        fontSize: '16px',
        cursor: 'pointer',
        padding: '2px',
        transition: 'transform 0.1s ease',
    },

    /* Input Footer */
    inputFooter: {
        minHeight: '62px',
        backgroundColor: 'var(--panel-header)',
        display: 'flex',
        alignItems: 'center',
        padding: '6px 16px',
        borderTop: '1px solid var(--border-default)',
        position: 'relative',
        zIndex: 3,
    },
    footerActionGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginRight: '12px',
    },
    footerIconBtn: {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageInputWrapper: {
        flex: 1,
        backgroundColor: 'var(--input-bg)',
        borderRadius: '8px',
        padding: '9px 14px',
        display: 'flex',
        alignItems: 'center',
    },
    messageInput: {
        width: '100%',
        border: 'none',
        outline: 'none',
        backgroundColor: 'transparent',
        color: 'var(--primary-title)',
        fontSize: '15px',
    },
    footerSendBtn: {
        marginLeft: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
    },

    /* Popovers */
    emojiPickerPopover: {
        position: 'absolute',
        bottom: '70px',
        left: '20px',
        backgroundColor: 'var(--bg-rail)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        zIndex: 20,
    },
    emojiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '8px',
    },
    emojiPickerItem: {
        fontSize: '22px',
        cursor: 'pointer',
        padding: '4px',
        textAlign: 'center',
        borderRadius: '6px',
    },
    attachMenuPopover: {
        position: 'absolute',
        bottom: '70px',
        left: '52px',
        backgroundColor: 'var(--bg-rail)',
        border: '1px solid var(--border-default)',
        borderRadius: '12px',
        padding: '10px 0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        zIndex: 20,
        minWidth: '190px',
    },
    attachMenuItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        gap: '12px',
        fontSize: '14px',
        color: 'var(--primary-title)',
        cursor: 'pointer',
    },
    attachIconCircle: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '55px',
        right: '16px',
        backgroundColor: 'var(--panel-header)',
        border: '1px solid var(--border-default)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        zIndex: 30,
        minWidth: '160px',
        padding: '6px 0',
    },
    roomDropdownMenu: {
        position: 'absolute',
        top: '55px',
        right: '16px',
        backgroundColor: 'var(--panel-header)',
        border: '1px solid var(--border-default)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        zIndex: 30,
        minWidth: '180px',
        padding: '6px 0',
    },
    dropdownItem: {
        padding: '10px 18px',
        fontSize: '14px',
        color: 'var(--primary-title)',
        cursor: 'pointer',
    },

    /* Drawers */
    drawerContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-sidebar)',
    },
    drawerHeader: {
        height: '108px',
        backgroundColor: 'var(--panel-header)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0 24px 20px 24px',
        gap: '24px',
    },
    drawerBackBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '0',
    },
    drawerHeaderTitle: {
        fontSize: '19px',
        fontWeight: '600',
        color: 'var(--primary-title)',
    },
    profileBody: {
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
    },
    profileAvatarLarge: {
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        backgroundColor: '#00a884',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '70px',
        fontWeight: '600',
        position: 'relative',
        marginBottom: '28px',
    },
    cameraOverlay: {
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        backgroundColor: '#00a884',
        padding: '8px',
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        cursor: 'pointer',
    },
    profileSection: {
        width: '100%',
        marginBottom: '24px',
    },
    profileSectionLabel: {
        fontSize: '13px',
        color: '#00a884',
        marginBottom: '8px',
        fontWeight: '500',
    },
    profileSectionValue: {
        fontSize: '16px',
        color: 'var(--primary-title)',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-default)',
    },
    profileSectionHint: {
        fontSize: '12px',
        color: 'var(--secondary-text)',
        marginTop: '6px',
        lineHeight: '1.4',
    },
    logoutBtn: {
        marginTop: '16px',
        width: '100%',
        padding: '12px',
        backgroundColor: '#ea3943',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    statusBody: {
        padding: '16px',
        overflowY: 'auto',
    },
    myStatusItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        gap: '14px',
        borderBottom: '1px solid var(--border-default)',
        cursor: 'pointer',
    },
    myStatusAvatar: {
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        backgroundColor: '#00a884',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        position: 'relative',
    },
    addStatusBadge: {
        position: 'absolute',
        bottom: '-2px',
        right: '-2px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        backgroundColor: '#00a884',
        border: '2px solid var(--bg-sidebar)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        color: 'white',
    },
    statusInfo: {
        display: 'flex',
        flexDirection: 'column',
    },
    statusTitle: {
        fontSize: '16px',
        fontWeight: '500',
        color: 'var(--primary-title)',
    },
    statusSub: {
        fontSize: '13px',
        color: 'var(--secondary-text)',
        marginTop: '2px',
    },
    sectionHeaderTitle: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#00a884',
        padding: '16px 12px 8px 12px',
    },
    statusItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        gap: '14px',
        cursor: 'pointer',
    },
    statusAvatarRing: {
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        border: '2px solid #00a884',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
    },
    statusAvatarInner: {
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: '#6b7c85',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
    },

    /* Hero / Empty Screen */
    noRoomContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'var(--bg-chat)',
    },
    noRoomIllustration: {
        marginBottom: '28px',
    },
    noRoomImage: {
        width: '280px',
        opacity: 0.85,
    },
    noRoomTitle: {
        fontSize: '30px',
        fontWeight: '300',
        color: 'var(--primary-title)',
        marginBottom: '14px',
    },
    noRoomText: {
        fontSize: '14px',
        color: 'var(--secondary-text)',
        lineHeight: '1.6',
        maxWidth: '520px',
        marginBottom: '32px',
    },
    lockBadge: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
        color: 'var(--secondary-text)',
    },
};