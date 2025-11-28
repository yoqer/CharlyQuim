import type { ClientMessage, ServerMessage, Message, ConversationMode } from '@ai-feedback-widget/shared';

interface WebSocketClientCallbacks {
  onMessage: (message: Message) => void;
  onReady: () => void;
  onError: (error: string) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private apiUrl: string;
  private callbacks: WebSocketClientCallbacks;
  private conversationId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(apiUrl: string, callbacks: WebSocketClientCallbacks) {
    this.apiUrl = apiUrl;
    this.callbacks = callbacks;
  }

  connect(botId: string) {
    const wsUrl = this.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    this.ws = new WebSocket(`${wsUrl}/ws`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.send({ type: 'init', botId });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Failed to parse server message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.callbacks.onError('Connection error');
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect(botId);
    };
  }

  private handleServerMessage(message: ServerMessage) {
    switch (message.type) {
      case 'ready':
        this.callbacks.onReady();
        break;

      case 'conversation_started':
        this.conversationId = message.conversationId;
        break;

      case 'message':
        this.callbacks.onMessage(message.message);
        break;

      case 'conversation_ended':
        this.conversationId = null;
        break;

      case 'error':
        this.callbacks.onError(message.error);
        break;
    }
  }

  private handleReconnect(botId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(botId), delay);
    } else {
      this.callbacks.onError('Connection lost. Please refresh the page.');
    }
  }

  startConversation(mode: ConversationMode) {
    this.send({ type: 'start_conversation', mode });
  }

  sendMessage(content: string) {
    this.send({ type: 'send_message', content });
  }

  endConversation() {
    this.send({ type: 'end_conversation' });
  }

  private send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
      this.callbacks.onError('Not connected to server');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
