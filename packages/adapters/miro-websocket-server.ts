import WebSocket from 'ws'; // Assume installed

interface Client {
  ws: WebSocket;
  boardId?: string;
  userId: string;
}

class MiroWebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, Client> = new Map(); // ws id to client
  private rooms: Map<string, Set<string>> = new Map(); // boardId to set of ws ids

  constructor(server: any) { // Pass http server for upgrade
    this.wss = new WebSocket.Server({ server });
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = this.generateClientId();
    const client: Client = { ws, userId: this.extractUserId(req) }; // From headers or query
    this.clients.set(clientId, client);

    ws.on('message', this.handleMessage.bind(this, clientId));
    ws.on('close', this.handleClose.bind(this, clientId));

    ws.send(JSON.stringify({ type: 'connected', clientId }));
  }

  private handleMessage(clientId: string, message: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.boardId) {
        this.subscribeToRoom(clientId, data.boardId);
        client.boardId = data.boardId;
      } else if (data.type === 'unsubscribe' && data.boardId) {
        this.unsubscribeFromRoom(clientId, data.boardId);
      }
    } catch (error) {
      client.ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
    }
  }

  private handleClose(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client?.boardId) {
      this.unsubscribeFromRoom(clientId, client.boardId);
    }
    this.clients.delete(clientId);
  }

  private subscribeToRoom(clientId: string, boardId: string): void {
    if (!this.rooms.has(boardId)) {
      this.rooms.set(boardId, new Set());
    }
    this.rooms.get(boardId)!.add(clientId);
  }

  private unsubscribeFromRoom(clientId: string, boardId: string): void {
    this.rooms.get(boardId)?.delete(clientId);
    if (this.rooms.get(boardId)?.size === 0) {
      this.rooms.delete(boardId);
    }
  }

  // Broadcast to specific room (board)
  broadcastToRoom(boardId: string, event: any): void {
    const room = this.rooms.get(boardId);
    if (!room) return;

    const message = JSON.stringify({ type: 'update', boardId, event });
    room.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      } else {
        this.clients.delete(clientId);
        room.delete(clientId);
      }
    });
  }

  // Broadcast to all clients
  broadcast(event: any): void {
    const message = JSON.stringify(event);
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      } else {
        this.clients.delete(clientId);
      }
    });
  }

  private generateClientId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private extractUserId(req: any): string {
    // From auth header or query - placeholder
    return 'anonymous';
  }

  // Close server
  close(): void {
    this.wss.close();
  }
}

export { MiroWebSocketServer };