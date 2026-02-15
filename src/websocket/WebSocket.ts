// ──────────────────────────────────────────────────────────────
// HyperZ Framework — WebSocket Manager (Socket.io)
// ──────────────────────────────────────────────────────────────

import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Logger } from '../logging/Logger.js';

type MessageHandler = (socket: Socket, data: any) => void | Promise<void>;

export class WebSocketManager {
    private io: SocketIOServer | null = null;
    private handlers = new Map<string, MessageHandler>();

    /**
     * Attach Socket.io to an HTTP server.
     */
    attach(server: HttpServer, options?: Record<string, any>): SocketIOServer {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: options?.cors?.origin ?? '*',
                methods: ['GET', 'POST'],
            },
            ...options,
        });

        this.io.on('connection', (socket: Socket) => {
            Logger.debug(`[WS] Client connected: ${socket.id}`);

            // Register all event handlers
            for (const [event, handler] of this.handlers) {
                socket.on(event, (data) => handler(socket, data));
            }

            socket.on('disconnect', (reason) => {
                Logger.debug(`[WS] Client disconnected: ${socket.id} (${reason})`);
            });
        });

        Logger.info('  🔌 WebSocket server attached');
        return this.io;
    }

    /**
     * Register an event handler.
     */
    on(event: string, handler: MessageHandler): this {
        this.handlers.set(event, handler);
        return this;
    }

    /**
     * Broadcast to all connected clients.
     */
    broadcast(event: string, data: any): void {
        this.io?.emit(event, data);
    }

    /**
     * Send to a specific room.
     */
    to(room: string, event: string, data: any): void {
        this.io?.to(room).emit(event, data);
    }

    /**
     * Get client count.
     */
    async clientCount(): Promise<number> {
        const sockets = await this.io?.fetchSockets();
        return sockets?.length ?? 0;
    }

    /**
     * Get the raw Socket.io server instance.
     */
    getIO(): SocketIOServer | null {
        return this.io;
    }
}
