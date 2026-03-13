import { Injectable, signal, computed } from '@angular/core';

export interface AuthCredentials {
  username: string;
  password: string;
}

const STORAGE_KEY = 'rt_auth';
const DEFAULT_TTL_MINUTES = 30;

interface StoredAuth {
  username: string;
  password: string;
  expiresAt: number;
  usuario_id?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly credentials = signal<AuthCredentials | null>(this.loadFromStorage());
  readonly isLoggedIn = computed(() => this.credentials() !== null);
  readonly username = computed(() => this.credentials()?.username ?? null);

  private readonly _usuarioId = signal<string | null>(null);
  readonly usuarioId = this._usuarioId.asReadonly();

  readonly middlewareBaseUrl = '/api';

  private loadFromStorage(): AuthCredentials | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const stored: StoredAuth = JSON.parse(raw);
      if (Date.now() > stored.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      this._usuarioId.set(stored.usuario_id ?? null);
      return { username: stored.username, password: stored.password };
    } catch {
      return null;
    }
  }

  setCredentials(username: string, password: string, ttlMinutes?: number, usuarioId?: string | null): void {
    const creds = { username, password };
    this.credentials.set(creds);
    if (usuarioId) this._usuarioId.set(usuarioId);
    const stored: StoredAuth = {
      ...creds,
      expiresAt: Date.now() + (ttlMinutes ?? DEFAULT_TTL_MINUTES) * 60 * 1000,
      ...(usuarioId ? { usuario_id: usuarioId } : {}),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  clearCredentials(): void {
    this.credentials.set(null);
    this._usuarioId.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  getAuthorizationHeader(): string | null {
    const creds = this.credentials();
    if (!creds?.username || !creds?.password) return null;
    return `Basic ${btoa(`${creds.username}:${creds.password}`)}`;
  }

  isMiddlewareUrl(url: string): boolean {
    return url.includes('/api/v1');
  }
}
