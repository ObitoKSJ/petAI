import type {
  ServerSession,
  ServerMessage,
  SessionConfig,
  PetInfo,
} from '@/types';
import { generateId } from '@/lib/utils';

const DEFAULT_CONFIG: SessionConfig = {
  maxTokens: 6000,
  maxMessages: 50,
  expirationMs: 30 * 60 * 1000, // 30 minutes
  truncationStrategy: 'oldest',
};

export class SessionService {
  private sessions: Map<string, ServerSession>;
  private config: SessionConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<SessionConfig> = {}) {
    this.sessions = new Map();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupJob();
  }

  // === Session Lifecycle ===

  createSession(petInfo?: PetInfo): ServerSession {
    const now = new Date();
    const session: ServerSession = {
      id: generateId(),
      messages: [],
      petInfo,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      metadata: { totalTokens: 0 },
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): ServerSession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = new Date();
    }
    return session || null;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  updatePetInfo(sessionId: string, petInfo: PetInfo): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.petInfo = { ...session.petInfo, ...petInfo };
    session.updatedAt = new Date();
    return true;
  }

  // === Message Management ===

  addMessage(
    sessionId: string,
    message: Omit<ServerMessage, 'id' | 'timestamp'>
  ): ServerMessage | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const newMessage: ServerMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
      tokenCount: this.estimateTokens(message.content),
    };

    session.messages.push(newMessage);
    session.updatedAt = new Date();
    session.lastAccessedAt = new Date();

    if (session.metadata) {
      session.metadata.totalTokens =
        (session.metadata.totalTokens || 0) + (newMessage.tokenCount || 0);
    }

    this.applyTruncation(session);
    return newMessage;
  }

  getMessages(sessionId: string): ServerMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  getMessagesForAPI(
    sessionId: string
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages = this.getMessages(sessionId);
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  // === Token Management ===

  private estimateTokens(text: string): number {
    // Chinese: ~1.5 tokens per char, English: ~0.25 tokens per char
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars / 4);
  }

  private calculateTotalTokens(session: ServerSession): number {
    return session.messages.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
  }

  private applyTruncation(session: ServerSession): void {
    const totalTokens = this.calculateTotalTokens(session);

    if (
      totalTokens <= this.config.maxTokens &&
      session.messages.length <= this.config.maxMessages
    ) {
      return;
    }

    if (this.config.truncationStrategy === 'oldest') {
      while (
        session.messages.length > 0 &&
        (this.calculateTotalTokens(session) > this.config.maxTokens ||
          session.messages.length > this.config.maxMessages)
      ) {
        const removed = session.messages.shift();
        if (session.metadata && removed?.tokenCount) {
          session.metadata.totalTokens =
            (session.metadata.totalTokens || 0) - removed.tokenCount;
        }
      }
    }
  }

  // === Cleanup ===

  private startCleanupJob(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastAccessedAt.getTime() > this.config.expirationMs) {
        this.sessions.delete(sessionId);
      }
    }
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // === Debug/Admin ===

  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }
}

export const sessionService = new SessionService();
