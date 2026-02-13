import { Injectable, signal, computed } from '@angular/core';

export interface AuthCredentials {
  username: string;
  password: string;
}

const STORAGE_KEY = 'md_auth';
const TTL_MS = 3 * 60 * 1000; // 3 minutos

interface StoredAuth {
  username: string;
  password: string;
  expiresAt: number;
}

/**
 * Servicio de autenticación: guarda credenciales en memoria y localStorage (TTL 3 min).
 * Si el TTL expira, se requiere volver a autenticar.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly credentials = signal<AuthCredentials | null>(this.loadFromStorage());

  readonly isLoggedIn = computed(() => this.credentials() !== null);
  readonly username = computed(() => this.credentials()?.username ?? null);

  /** URL base del middleware (para que el interceptor añada header). Con proxy usa path relativo. */
  readonly middlewareBaseUrl = '/api';

  /** ID del usuario actual (para cambio de contraseña). */
  private readonly _usuarioId = signal<string | null>(null);
  readonly usuarioId = this._usuarioId.asReadonly();

  private loadFromStorage(): AuthCredentials | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const stored: StoredAuth = JSON.parse(raw);
      if (Date.now() > stored.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return { username: stored.username, password: stored.password };
    } catch {
      return null;
    }
  }

  private saveToStorage(creds: AuthCredentials): void {
    const stored: StoredAuth = {
      ...creds,
      expiresAt: Date.now() + TTL_MS
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  setUsuarioId(id: string | null): void {
    this._usuarioId.set(id);
  }

  setCredentials(username: string, password: string): void {
    const creds = { username, password };
    this.credentials.set(creds);
    this.saveToStorage(creds);
  }

  clearCredentials(): void {
    this.credentials.set(null);
    this._usuarioId.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Devuelve el valor del header Authorization para Basic Auth, o null si no hay credenciales.
   */
  getAuthorizationHeader(): string | null {
    const creds = this.credentials();
    if (!creds?.username || !creds?.password) return null;
    const encoded = btoa(`${creds.username}:${creds.password}`);
    return `Basic ${encoded}`;
  }

  /**
   * Indica si la URL corresponde al middleware (para que el interceptor añada auth).
   */
  isMiddlewareUrl(url: string): boolean {
    return url.includes('/api/v1');
  }
}
