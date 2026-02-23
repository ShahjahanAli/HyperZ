---
title: "WebSockets"
description: "Add real-time communication to your HyperZ application with Socket.io WebSockets — events, rooms, and broadcasting."
---

**WebSockets** in HyperZ are powered by [Socket.io](https://socket.io), providing real-time bidirectional communication between the server and connected clients.

## Configuration

WebSocket support is enabled automatically when the application boots. The WebSocket server shares the same HTTP server on port `7700`.

## Server-Side Events

Emit and listen for events on the server:

```typescript
import { WebSocket } from '../../src/websocket/WebSocket.js';

WebSocket.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('chat:message', (data) => {
    // Broadcast to all connected clients
    WebSocket.emit('chat:message', {
      user: data.user,
      message: data.message,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});
```

## Rooms

Organize connections into rooms for targeted broadcasting:

```typescript
socket.on('room:join', (roomId: string) => {
  socket.join(roomId);
  socket.to(roomId).emit('room:userJoined', { userId: socket.id });
});

// Broadcast to a specific room
WebSocket.to('room-42').emit('notification', { message: 'New update!' });
```

## Client-Side

Connect from a browser using the Socket.io client:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:7700');

socket.on('chat:message', (data) => {
  console.log(`${data.user}: ${data.message}`);
});

socket.emit('chat:message', { user: 'Jane', message: 'Hello!' });
```

## Broadcasting from Controllers

Emit events from your controllers or services:

```typescript
import { WebSocket } from '../../src/websocket/WebSocket.js';

export class OrderController extends Controller {
  async store(req: Request, res: Response): Promise<void> {
    const order = await Order.create(req.body);
    WebSocket.emit('order:created', order);
    this.created(res, order);
  }
}
```
