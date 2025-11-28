import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type {
  ClientMessage,
  ServerMessage,
  Conversation,
  Message,
  ConversationMode,
} from '@ai-feedback-widget/shared';

// In-memory storage for MVP
const conversations = new Map<string, Conversation>();
const activeSessions = new Map<WebSocket, { botId?: string; conversationId?: string }>();

export function setupWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');
    activeSessions.set(ws, {});

    ws.on('message', (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (error) {
        console.error('Error parsing message:', error);
        sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      activeSessions.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

function handleClientMessage(ws: WebSocket, message: ClientMessage) {
  const session = activeSessions.get(ws);
  if (!session) return;

  switch (message.type) {
    case 'init':
      handleInit(ws, message.botId, message.metadata);
      break;

    case 'start_conversation':
      handleStartConversation(ws, message.mode);
      break;

    case 'send_message':
      handleSendMessage(ws, message.content, message.attachments);
      break;

    case 'end_conversation':
      handleEndConversation(ws);
      break;

    default:
      sendError(ws, 'Unknown message type');
  }
}

function handleInit(ws: WebSocket, botId: string, metadata?: Record<string, any>) {
  const session = activeSessions.get(ws);
  if (!session) return;

  session.botId = botId;

  const response: ServerMessage = { type: 'ready' };
  ws.send(JSON.stringify(response));
}

function handleStartConversation(ws: WebSocket, mode: ConversationMode) {
  const session = activeSessions.get(ws);
  if (!session || !session.botId) {
    sendError(ws, 'Not initialized');
    return;
  }

  const conversationId = uuidv4();
  const conversation: Conversation = {
    id: conversationId,
    botId: session.botId,
    mode,
    messages: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  conversations.set(conversationId, conversation);
  session.conversationId = conversationId;

  // Send initial greeting
  const greeting = getGreeting(mode);
  const greetingMessage: Message = {
    id: uuidv4(),
    role: 'assistant',
    content: greeting,
    timestamp: new Date(),
  };

  conversation.messages.push(greetingMessage);

  const response: ServerMessage = {
    type: 'conversation_started',
    conversationId,
    mode,
  };
  ws.send(JSON.stringify(response));

  const messageResponse: ServerMessage = {
    type: 'message',
    message: greetingMessage,
  };
  ws.send(JSON.stringify(messageResponse));
}

function handleSendMessage(ws: WebSocket, content: string, attachments?: any[]) {
  const session = activeSessions.get(ws);
  if (!session || !session.conversationId) {
    sendError(ws, 'No active conversation');
    return;
  }

  const conversation = conversations.get(session.conversationId);
  if (!conversation) {
    sendError(ws, 'Conversation not found');
    return;
  }

  // Add user message
  const userMessage: Message = {
    id: uuidv4(),
    role: 'user',
    content,
    attachments,
    timestamp: new Date(),
  };
  conversation.messages.push(userMessage);

  // Generate AI response (mock for now - will integrate OpenAI later)
  const aiResponse = generateMockResponse(content, conversation.mode);
  const assistantMessage: Message = {
    id: uuidv4(),
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date(),
  };
  conversation.messages.push(assistantMessage);

  conversation.updatedAt = new Date();

  // Send AI response
  const response: ServerMessage = {
    type: 'message',
    message: assistantMessage,
  };
  ws.send(JSON.stringify(response));
}

function handleEndConversation(ws: WebSocket) {
  const session = activeSessions.get(ws);
  if (!session || !session.conversationId) {
    sendError(ws, 'No active conversation');
    return;
  }

  const conversation = conversations.get(session.conversationId);
  if (conversation) {
    conversation.status = 'completed';
    conversation.updatedAt = new Date();
  }

  const response: ServerMessage = {
    type: 'conversation_ended',
    conversationId: session.conversationId,
  };
  ws.send(JSON.stringify(response));

  session.conversationId = undefined;
}

function sendError(ws: WebSocket, error: string) {
  const response: ServerMessage = { type: 'error', error };
  ws.send(JSON.stringify(response));
}

function getGreeting(mode: ConversationMode): string {
  switch (mode) {
    case 'bug_report':
      return "I'm here to help you report a bug. Can you tell me what's going wrong?";
    case 'feedback':
      return "I'd love to hear your feedback! What would you like to share?";
    case 'documentation':
      return "Hi! I'm here to help you with any questions about our product. What would you like to know?";
  }
}

function generateMockResponse(userMessage: string, mode: ConversationMode): string {
  // This is a simple mock - will be replaced with actual OpenAI integration
  const lowerMessage = userMessage.toLowerCase();

  if (mode === 'bug_report') {
    if (lowerMessage.includes('button') || lowerMessage.includes('click')) {
      return "Thanks for reporting that. Can you tell me what browser you're using and what happened when you clicked the button?";
    }
    return "I understand. Can you provide a bit more detail about the steps you took before encountering this issue?";
  }

  if (mode === 'feedback') {
    return "Thank you for sharing that feedback! Is there anything specific you'd like to see improved?";
  }

  return "I see. Let me help you with that. Could you provide more details?";
}
