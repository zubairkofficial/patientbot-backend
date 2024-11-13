// websocketClient.js
import WebSocket from 'ws';
import dotenv from 'dotenv';
dotenv.config({path:'./../.env'});

 const SERVER_URL = process.env.WS_URL;
 console.log("Server url", SERVER_URL);

// Connect to the WebSocket server
const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
    console.log('Connected to WebSocket server');

    // Send a message to the server
    ws.send('Hello Server, this is the client!');
});

ws.on('message', (data) => {
    console.log('Received from server:', data);
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', () => {
    console.log('Disconnected from WebSocket server');
});
