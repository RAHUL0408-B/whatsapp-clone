import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Users, Plus } from 'lucide-react';
import { getContacts, getOrCreateDirectChat, createRoom } from '../services/api';

export default function NewChatModal({ isOpen, onClose, currentUserEmail, onSelectChat }) {
    const [contacts, setContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadContacts = async () => {
            setLoading(true);
            try {
                const res = await getContacts(currentUserEmail, searchQuery);
                setContacts(res.data);
            } catch (err) {
                console.error('Failed to load contacts', err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(loadContacts, searchQuery ? 250 : 0);
        return () => clearTimeout(timer);
    }, [isOpen, searchQuery, currentUserEmail]);

    if (!isOpen) return null;

    const handleStartDirectChat = async (targetEmail) => {
        try {
            const res = await getOrCreateDirectChat(currentUserEmail, targetEmail);
            onSelectChat(res.data);
            onClose();
        } catch (err) {
            alert('Failed to start chat with this contact');
        }
    };

    const handleCreateNewGroup = async (customName = null) => {
        const name = customName || window.prompt('Enter new group or chat name:');
        if (!name || !name.trim()) return;
        try {
            const res = await createRoom(name.trim(), currentUserEmail);
            onSelectChat(res.data);
            onClose();
        } catch (err) {
            alert('Failed to create new chat!');
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <MessageSquare size={22} color="#00a884" />
                        <h2 style={styles.title}>New Chat</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} color="var(--icon-color)" />
                    </button>
                </div>

                {/* Search */}
                <div style={styles.searchBox}>
                    <Search size={18} color="var(--icon-color)" style={{ marginRight: '10px' }} />
                    <input
                        style={styles.searchInput}
                        placeholder="Search name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Quick Add Group Option */}
                <div style={styles.quickOptions}>
                    <div style={styles.quickOptionItem} onClick={() => handleCreateNewGroup()}>
                        <div style={styles.quickOptionIcon}>
                            <Users size={20} color="white" />
                        </div>
                        <div style={styles.quickOptionText}>
                            <div style={styles.quickOptionTitle}>New group</div>
                            <div style={styles.quickOptionSub}>Create a group chat with friends</div>
                        </div>
                    </div>
                </div>

                {/* Contacts List */}
                <div style={styles.contactsList}>
                    <div style={styles.sectionHeader}>CONTACTS ON WHATSAPP</div>

                    {loading ? (
                        <div style={styles.empty}>Loading contacts...</div>
                    ) : contacts.length === 0 ? (
                        <div style={styles.empty}>
                            <p style={{ margin: '0 0 12px 0' }}>No contacts found matching "{searchQuery}"</p>
                            {searchQuery.trim() && (
                                <button 
                                    style={styles.createCustomBtn}
                                    onClick={() => handleCreateNewGroup(searchQuery.trim())}
                                >
                                    <Plus size={16} style={{ marginRight: '6px' }} />
                                    Create chat "{searchQuery.trim()}"
                                </button>
                            )}
                        </div>
                    ) : (
                        contacts.map((contact) => (
                            <div
                                key={contact.id}
                                style={styles.contactItem}
                                onClick={() => handleStartDirectChat(contact.email)}
                            >
                                <div style={styles.avatarContainer}>
                                    <div style={styles.avatar}>
                                        {contact.username?.[0]?.toUpperCase()}
                                    </div>
                                    {contact.online && <div style={styles.onlineDot} />}
                                </div>
                                <div style={styles.contactDetails}>
                                    <div style={styles.contactTop}>
                                        <span style={styles.username}>{contact.username}</span>
                                        {contact.online && <span style={styles.onlineText}>online</span>}
                                    </div>
                                    <div style={styles.aboutText}>
                                        {contact.about || contact.email}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 20, 26, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(3px)',
    },
    modal: {
        width: '440px',
        maxHeight: '620px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
    },
    header: {
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-default)',
        backgroundColor: 'var(--panel-header)',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    title: {
        fontSize: '18px',
        fontWeight: '600',
        color: 'var(--primary-title)',
        margin: 0,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        backgroundColor: 'var(--search-input)',
        margin: '12px 16px',
        borderRadius: '8px',
    },
    searchInput: {
        width: '100%',
        background: 'none',
        border: 'none',
        outline: 'none',
        color: 'var(--primary-title)',
        fontSize: '14px',
    },
    quickOptions: {
        padding: '0 16px 8px 16px',
        borderBottom: '1px solid var(--border-default)',
    },
    quickOptionItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        gap: '14px',
        transition: 'background-color 0.15s ease',
    },
    quickOptionIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#00a884',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickOptionText: {
        display: 'flex',
        flexDirection: 'column',
    },
    quickOptionTitle: {
        fontSize: '15px',
        fontWeight: '500',
        color: 'var(--primary-title)',
    },
    quickOptionSub: {
        fontSize: '12.5px',
        color: 'var(--secondary-text)',
    },
    contactsList: {
        flex: 1,
        overflowY: 'auto',
        padding: '10px 0',
    },
    sectionHeader: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#00a884',
        padding: '6px 20px',
        letterSpacing: '0.5px',
    },
    contactItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        cursor: 'pointer',
        gap: '14px',
        transition: 'background-color 0.15s ease',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        backgroundColor: '#00a884',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '600',
        fontSize: '16px',
    },
    onlineDot: {
        position: 'absolute',
        bottom: '0',
        right: '0',
        width: '11px',
        height: '11px',
        borderRadius: '50%',
        backgroundColor: 'var(--online-green)',
        border: '2px solid var(--bg-sidebar)',
    },
    contactDetails: {
        flex: 1,
        overflow: 'hidden',
    },
    contactTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    username: {
        fontSize: '15px',
        fontWeight: '500',
        color: 'var(--primary-title)',
    },
    onlineText: {
        fontSize: '12px',
        color: 'var(--online-green)',
    },
    aboutText: {
        fontSize: '13px',
        color: 'var(--secondary-text)',
        marginTop: '2px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    empty: {
        padding: '30px 20px',
        textAlign: 'center',
        color: 'var(--secondary-text)',
        fontSize: '14px',
    },
    createCustomBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#00a884',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
    },
};
