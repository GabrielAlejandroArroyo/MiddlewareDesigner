import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
}

export interface AiStatus {
  available: boolean;
  models: string[];
  current_model?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AiHelpService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal(false);
  readonly ollamaStatus = signal<AiStatus | null>(null);

  private abortController: AbortController | null = null;

  checkStatus(): void {
    this.http.get<AiStatus>('/api/v1/ai-help/status').subscribe({
      next: (s) => this.ollamaStatus.set(s),
      error: () => this.ollamaStatus.set({ available: false, models: [], error: 'No se pudo verificar' }),
    });
  }

  async sendMessage(question: string, pageContext: string): Promise<void> {
    if (this.isLoading()) return;

    const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date() };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.isLoading.set(true);

    const assistantMsg: ChatMessage = { role: 'assistant', content: '', timestamp: new Date(), isStreaming: true };
    this.messages.update(msgs => [...msgs, assistantMsg]);

    const historyForApi = this.messages()
      .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.isStreaming))
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const body = JSON.stringify({
      question,
      context: pageContext || undefined,
      history: historyForApi.length > 1 ? historyForApi.slice(0, -1) : undefined,
    });

    const authHeader = this.authService.getAuthorizationHeader();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    this.abortController = new AbortController();

    try {
      const resp = await fetch('/api/v1/ai-help/chat', {
        method: 'POST',
        headers,
        body,
        signal: this.abortController.signal,
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        this.updateLastAssistantMessage(`Error: ${resp.status} - ${errorText}`, false);
        this.isLoading.set(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) {
        this.updateLastAssistantMessage('Error: respuesta sin body', false);
        this.isLoading.set(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        this.updateLastAssistantMessage(fullText, true);
      }

      this.updateLastAssistantMessage(fullText, false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.updateLastAssistantMessage(this.getLastAssistantContent() + '\n\n_(cancelado)_', false);
      } else {
        this.updateLastAssistantMessage(`Error de conexión: ${err.message}`, false);
      }
    } finally {
      this.isLoading.set(false);
      this.abortController = null;
    }
  }

  cancelStream(): void {
    this.abortController?.abort();
  }

  clearHistory(): void {
    this.messages.set([]);
  }

  private updateLastAssistantMessage(content: string, isStreaming: boolean): void {
    this.messages.update(msgs => {
      const updated = [...msgs];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
        updated[lastIdx] = { ...updated[lastIdx], content, isStreaming };
      }
      return updated;
    });
  }

  private getLastAssistantContent(): string {
    const msgs = this.messages();
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') return msgs[i].content;
    }
    return '';
  }
}
