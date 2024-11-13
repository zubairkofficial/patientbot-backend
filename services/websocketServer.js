// websocketServer.js
import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
dotenv.config({path:'./../.env'});


const PORT = process.env.WS_PORT;

console.log("Port", PORT);
// Create a WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Respond to messages from the client
    ws.on('message', (message) => {
        console.log(`Received message from client: ${message}`);
        ws.send(`Server response: You said "${message}"`);
    });

    // Notify when client disconnects
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
