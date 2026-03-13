import { Component, inject, OnInit, ElementRef, ViewChild, AfterViewChecked, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiHelpService, ChatMessage } from '../../core/services/ai-help.service';

@Component({
  selector: 'ai-help-fab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Action Button -->
    <button class="ai-fab shadow-lg" (click)="togglePanel()" [class.active]="isPanelOpen()"
            title="Asistente IA">
      <i class="bi" [class.bi-robot]="!isPanelOpen()" [class.bi-x-lg]="isPanelOpen()"></i>
    </button>

    <!-- Chat Panel -->
    <div class="ai-panel shadow-lg" [class.open]="isPanelOpen()">
      <!-- Header -->
      <div class="ai-panel-header">
        <div class="d-flex align-items-center gap-2">
          <div class="ai-avatar">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <div class="fw-bold">Asistente IA</div>
            <div class="ai-status-line">
              <span class="ai-status-dot" [class.online]="ollamaOnline()" [class.offline]="!ollamaOnline()"></span>
              <small>{{ ollamaOnline() ? 'Ollama conectado' : 'Ollama no disponible' }}</small>
            </div>
          </div>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-link text-white p-1" (click)="clearHistory()" title="Limpiar historial">
            <i class="bi bi-trash3"></i>
          </button>
          <button class="btn btn-sm btn-link text-white p-1" (click)="togglePanel()" title="Cerrar">
            <i class="bi bi-dash-lg"></i>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="ai-panel-body" #chatBody>
        <!-- Welcome -->
        <div *ngIf="aiService.messages().length === 0" class="ai-welcome">
          <div class="ai-welcome-icon">
            <i class="bi bi-lightbulb"></i>
          </div>
          <p class="fw-bold mb-1">Hola, soy tu asistente</p>
          <p class="small text-muted mb-3">Preguntame sobre cualquier función de Middleware Designer. Detecto automáticamente en qué pantalla estás.</p>
          <div class="d-flex flex-wrap gap-2 justify-content-center">
            <button class="ai-suggestion-chip" (click)="sendSuggestion('¿Cómo registro un nuevo backend?')">
              <i class="bi bi-gear me-1"></i>Registrar backend
            </button>
            <button class="ai-suggestion-chip" (click)="sendSuggestion('¿Cómo creo una aplicación con roles?')">
              <i class="bi bi-window-stack me-1"></i>Crear aplicación
            </button>
            <button class="ai-suggestion-chip" (click)="sendSuggestion('¿Qué es la previsualización?')">
              <i class="bi bi-eye me-1"></i>Previsualización
            </button>
            <button class="ai-suggestion-chip" (click)="sendSuggestion('¿Cómo funciona el menú de aplicaciones?')">
              <i class="bi bi-list-ul me-1"></i>Menú de apps
            </button>
          </div>
        </div>

        <!-- Messages list -->
        <div *ngFor="let msg of aiService.messages(); let i = index" class="ai-message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
          <div class="ai-msg-avatar">
            <i class="bi" [class.bi-person-fill]="msg.role === 'user'" [class.bi-robot]="msg.role === 'assistant'"></i>
          </div>
          <div class="ai-msg-bubble">
            <div class="ai-msg-content" [innerHTML]="formatMessage(msg.content)"></div>
            <div class="ai-msg-meta">
              <small>{{ msg.timestamp | date:'HH:mm' }}</small>
              <span *ngIf="msg.isStreaming" class="ai-typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Ollama not available warning -->
      <div *ngIf="!ollamaOnline() && isPanelOpen()" class="ai-warning">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <div>
          <strong>Ollama no detectado.</strong>
          <div class="small">Instalá <a href="https://ollama.com" target="_blank" class="text-warning">Ollama</a> y ejecutá: <code>ollama pull llama3.2</code></div>
        </div>
      </div>

      <!-- Input -->
      <div class="ai-panel-footer">
        <div class="ai-input-row">
          <div class="ai-context-badge" *ngIf="currentPageName()">
            <i class="bi bi-geo-alt-fill me-1"></i>{{ currentPageName() }}
          </div>
          <div class="ai-input-wrapper">
            <input class="ai-input" type="text" [(ngModel)]="userInput"
                   (keydown.enter)="send()" placeholder="Preguntá algo..."
                   [disabled]="aiService.isLoading()">
            <button class="ai-send-btn" (click)="aiService.isLoading() ? aiService.cancelStream() : send()"
                    [disabled]="!aiService.isLoading() && !userInput.trim()">
              <i class="bi" [class.bi-send-fill]="!aiService.isLoading()" [class.bi-stop-circle-fill]="aiService.isLoading()"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { position: fixed; bottom: 0; right: 0; z-index: 9999; }

    .ai-fab {
      position: fixed; bottom: 24px; right: 24px;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none; color: #fff; font-size: 1.5rem;
      cursor: pointer; z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      transition: all .3s cubic-bezier(.4,0,.2,1);
    }
    .ai-fab:hover { transform: scale(1.1); box-shadow: 0 8px 25px rgba(99,102,241,.4); }
    .ai-fab.active { background: linear-gradient(135deg, #ef4444, #dc2626); transform: rotate(90deg); }

    .ai-panel {
      position: fixed; bottom: 90px; right: 24px;
      width: 400px; max-height: 600px; height: 70vh;
      border-radius: 16px; overflow: hidden;
      display: flex; flex-direction: column;
      opacity: 0; transform: translateY(20px) scale(.95);
      pointer-events: none;
      transition: all .3s cubic-bezier(.4,0,.2,1);
      background: var(--md-card-bg, #fff);
      border: 1px solid var(--md-border-color, #e5e7eb);
    }
    .ai-panel.open {
      opacity: 1; transform: translateY(0) scale(1); pointer-events: all;
    }

    .ai-panel-header {
      padding: 14px 16px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .ai-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .ai-status-line { display: flex; align-items: center; gap: 5px; }
    .ai-status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      display: inline-block;
    }
    .ai-status-dot.online { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
    .ai-status-dot.offline { background: #ef4444; }

    .ai-panel-body {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }

    .ai-welcome {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 20px 10px;
      color: var(--md-text-primary, #333);
    }
    .ai-welcome-icon {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: #7c3aed; margin-bottom: 12px;
    }

    .ai-suggestion-chip {
      border: 1px solid var(--md-border-color, #e5e7eb);
      background: var(--md-bg-secondary, #f9fafb);
      color: var(--md-text-primary, #333);
      border-radius: 20px; padding: 6px 14px;
      font-size: .8rem; cursor: pointer;
      transition: all .2s;
    }
    .ai-suggestion-chip:hover {
      background: #ede9fe; border-color: #8b5cf6; color: #6d28d9;
    }

    .ai-message {
      display: flex; gap: 8px; max-width: 95%;
    }
    .ai-message.user { align-self: flex-end; flex-direction: row-reverse; }
    .ai-message.assistant { align-self: flex-start; }

    .ai-msg-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .85rem; flex-shrink: 0;
    }
    .ai-message.user .ai-msg-avatar { background: #dbeafe; color: #2563eb; }
    .ai-message.assistant .ai-msg-avatar { background: #ede9fe; color: #7c3aed; }

    .ai-msg-bubble {
      border-radius: 14px; padding: 10px 14px;
      font-size: .875rem; line-height: 1.5;
      word-break: break-word;
    }
    .ai-message.user .ai-msg-bubble {
      background: #6366f1; color: #fff; border-bottom-right-radius: 4px;
    }
    .ai-message.assistant .ai-msg-bubble {
      background: var(--md-bg-secondary, #f3f4f6);
      color: var(--md-text-primary, #333);
      border-bottom-left-radius: 4px;
    }
    .ai-msg-content { white-space: pre-wrap; }
    .ai-msg-content code {
      background: rgba(0,0,0,.08); border-radius: 4px; padding: 1px 5px;
      font-size: .82rem;
    }
    .ai-msg-meta {
      display: flex; align-items: center; gap: 6px;
      margin-top: 4px; opacity: .6; font-size: .7rem;
    }

    .ai-typing-indicator { display: inline-flex; gap: 3px; }
    .ai-typing-indicator span {
      width: 5px; height: 5px; border-radius: 50%;
      background: currentColor; opacity: .4;
      animation: aiDot 1.4s infinite;
    }
    .ai-typing-indicator span:nth-child(2) { animation-delay: .2s; }
    .ai-typing-indicator span:nth-child(3) { animation-delay: .4s; }
    @keyframes aiDot {
      0%, 80%, 100% { opacity: .4; transform: scale(1); }
      40% { opacity: 1; transform: scale(1.3); }
    }

    .ai-warning {
      display: flex; align-items: flex-start; gap: 4px;
      padding: 8px 16px;
      background: #fef3c7; color: #92400e;
      font-size: .8rem; flex-shrink: 0;
    }
    .ai-warning code { background: rgba(0,0,0,.08); padding: 1px 4px; border-radius: 3px; }
    .ai-warning a { color: #d97706; font-weight: 600; }

    .ai-panel-footer {
      border-top: 1px solid var(--md-border-color, #e5e7eb);
      padding: 10px 12px; flex-shrink: 0;
      background: var(--md-card-bg, #fff);
    }
    .ai-context-badge {
      display: inline-flex; align-items: center;
      font-size: .7rem; color: #6d28d9;
      background: #ede9fe; border-radius: 10px;
      padding: 2px 10px; margin-bottom: 6px;
    }
    .ai-input-wrapper { display: flex; gap: 8px; }
    .ai-input {
      flex: 1; border: 1px solid var(--md-border-color, #e5e7eb);
      border-radius: 12px; padding: 10px 14px;
      font-size: .875rem; outline: none;
      background: var(--md-bg-secondary, #f9fafb);
      color: var(--md-text-primary, #333);
      transition: border-color .2s;
    }
    .ai-input:focus { border-color: #8b5cf6; }
    .ai-input:disabled { opacity: .6; }

    .ai-send-btn {
      width: 40px; height: 40px; border-radius: 50%;
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; color: #fff;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      transition: all .2s;
    }
    .ai-send-btn:hover:not(:disabled) { transform: scale(1.05); }
    .ai-send-btn:disabled { opacity: .5; cursor: not-allowed; }

    @media (max-width: 480px) {
      .ai-panel { width: calc(100vw - 16px); right: 8px; bottom: 80px; max-height: 75vh; }
      .ai-fab { bottom: 16px; right: 16px; }
    }
  `]
})
export class AiHelpComponent implements OnInit, AfterViewChecked {
  aiService = inject(AiHelpService);
  private router = inject(Router);

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  isPanelOpen = signal(false);
  ollamaOnline = signal(false);
  userInput = '';
  private shouldScroll = false;

  private pageContextMap: Record<string, string> = {
    '/': 'Panel Principal (Dashboard) - Vista general del ecosistema.',
    '/backends': 'Gestión de Backends - Registrar y administrar microservicios backend con contratos OpenAPI.',
    '/preview': 'Previsualización - Visualizar y habilitar endpoints de los servicios registrados.',
    '/apps': 'Gestión de Aplicaciones - Crear aplicaciones con roles, módulos por rol y menú personalizable.',
    '/custom-designer': 'Diseño de Flujos - Crear páginas y flujos customizados.',
  };

  ngOnInit(): void {
    this.aiService.checkStatus();
    this.aiService.ollamaStatus;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.chatBody?.nativeElement) {
      this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  currentPageName(): string {
    const url = this.router.url.split('?')[0];
    for (const [path, name] of Object.entries(this.pageContextMap)) {
      if (url === path || (path !== '/' && url.startsWith(path))) return name.split(' - ')[0];
    }
    return '';
  }

  private getPageContext(): string {
    const url = this.router.url.split('?')[0];
    for (const [path, desc] of Object.entries(this.pageContextMap)) {
      if (url === path || (path !== '/' && url.startsWith(path))) return `Página actual: ${desc}`;
    }
    return `Ruta actual: ${url}`;
  }

  togglePanel(): void {
    const wasOpen = this.isPanelOpen();
    this.isPanelOpen.set(!wasOpen);
    if (!wasOpen) {
      this.aiService.checkStatus();
      setTimeout(() => {
        const status = this.aiService.ollamaStatus();
        this.ollamaOnline.set(status?.available ?? false);
      }, 1500);
    }
  }

  send(): void {
    if (!this.userInput.trim() || this.aiService.isLoading()) return;
    const q = this.userInput.trim();
    this.userInput = '';
    this.shouldScroll = true;
    this.aiService.sendMessage(q, this.getPageContext()).then(() => {
      this.shouldScroll = true;
    });
  }

  sendSuggestion(text: string): void {
    this.userInput = text;
    this.send();
  }

  clearHistory(): void {
    this.aiService.clearHistory();
  }

  formatMessage(content: string): string {
    if (!content) return '';
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return html;
  }
}
