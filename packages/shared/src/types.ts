/**
 * Shared types for AI Feedback Widget
 */

// Widget Configuration
export interface WidgetConfig {
  botId: string;
  apiUrl: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  icon?: string;
}

// Bot Configuration (stored in database)
export interface Bot {
  id: string;
  name: string;
  customInstructions: string;
  appearance: {
    primaryColor: string;
    position: 'bottom-right' | 'bottom-left';
    icon?: string;
  };
  notionConfig?: NotionConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotionConfig {
  accessToken: string;
  databaseId: string;
  fieldMapping: FieldMapping[];
}

export interface FieldMapping {
  notionFieldId: string;
  notionFieldName: string;
  fieldType: NotionFieldType;
  isRequired: boolean;
  defaultValue?: any;
}

export type NotionFieldType =
  | 'title'
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email';

// Conversation
export type ConversationMode = 'documentation' | 'bug_report' | 'feedback';

export interface Conversation {
  id: string;
  botId: string;
  mode: ConversationMode;
  messages: Message[];
  status: 'active' | 'completed' | 'processing' | 'processed' | 'failed';
  metadata?: {
    userAgent?: string;
    url?: string;
    userId?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  timestamp: Date;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

// WebSocket Messages
export type ClientMessage =
  | { type: 'init'; botId: string; metadata?: Record<string, any> }
  | { type: 'start_conversation'; mode: ConversationMode }
  | { type: 'send_message'; content: string; attachments?: Attachment[] }
  | { type: 'end_conversation' };

export type ServerMessage =
  | { type: 'ready'; conversationId?: string }
  | { type: 'conversation_started'; conversationId: string; mode: ConversationMode }
  | { type: 'message'; message: Message }
  | { type: 'conversation_ended'; conversationId: string }
  | { type: 'error'; error: string };

// AI Processing
export interface ExtractedData {
  conversationId: string;
  fields: Record<string, any>;
  confidence: number;
  notionEntryId?: string;
}
