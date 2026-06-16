import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client = null;

export const connectWebSocket = (onMessageReceived) => {
    client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        onConnect: () => {
            console.log('✅ WebSocket connected!');
        },
        onDisconnect: () => {
            console.log('❌ WebSocket disconnected');
        },
        reconnectDelay: 5000,
    });

    client.activate();
    return client;
};

export const subscribeToRoom = (client, roomId, onMessage) => {
    if (client && client.connected) {
        return client.subscribe(`/topic/room/${roomId}`, (message) => {
            const data = JSON.parse(message.body);
            onMessage(data);
        });
    }
};

export const sendMessage = (client, content, roomId, senderEmail) => {
    if (client && client.connected) {
        client.publish({
            destination: '/app/sendMessage',
            body: JSON.stringify({ content, roomId, senderEmail }),
        });
    }
};

export const disconnectWebSocket = () => {
    if (client) {
        client.deactivate();
    }
};