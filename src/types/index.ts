// Client-side message type
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

// Legacy client-side session (kept for compatibility)
export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PetInfo {
  name?: string;
  type?: string;
  breed?: string;
  age?: number;
}

// === Server-side Session Management Types ===

// Server message format (compatible with KIMI API)
export interface ServerMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokenCount?: number;
}

// Server-side session with full metadata
export interface ServerSession {
  id: string;
  messages: ServerMessage[];
  petInfo?: PetInfo;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  metadata?: {
    userAgent?: string;
    totalTokens?: number;
  };
}

// Session configuration
export interface SessionConfig {
  maxTokens: number;
  maxMessages: number;
  expirationMs: number;
  truncationStrategy: 'oldest' | 'summary';
}

// API Response types
export interface CreateSessionResponse {
  sessionId: string;
  createdAt: Date;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  messageId?: string;
}

export interface SessionHistoryResponse {
  sessionId: string;
  messages: ServerMessage[];
  petInfo?: PetInfo;
}
