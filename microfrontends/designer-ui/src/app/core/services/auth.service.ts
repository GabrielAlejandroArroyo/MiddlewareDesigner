import { Injectable, signal, computed } from '@angular/core';

export interface AuthCredentials {
  username: string;
  password: string;
}

const STORAGE_KEY = 'md_auth';
const DEFAULT_TTL_MINUTES = 3;

interface StoredAuth {
  username: string;
  password: string;
  expiresAt: number;
  sessionInactivityMinutes?: number;
  usuario_id?: string;
}

/**
 * Servicio de autenticación: guarda credenciales en memoria y localStorage (TTL configurable vía login).
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

  /** Minutos de inactividad antes del logout (0 = deshabilitado). */
  private readonly _sessionInactivityMinutes = signal<number>(0);
  readonly sessionInactivityMinutes = this._sessionInactivityMinutes.asReadonly();

  private loadFromStorage(): AuthCredentials | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const stored: StoredAuth = JSON.parse(raw);
      if (Date.now() > stored.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      this._sessionInactivityMinutes.set(stored.sessionInactivityMinutes ?? 0);
      this._usuarioId.set(stored.usuario_id ?? null);
      return { username: stored.username, password: stored.password };
    } catch {
      return null;
    }
  }

  private saveToStorage(creds: AuthCredentials, ttlMinutes: number, inactivityMinutes: number = 0, usuarioId?: string | null): void {
    const stored: StoredAuth = {
      ...creds,
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      sessionInactivityMinutes: inactivityMinutes,
      ...(usuarioId != null && usuarioId !== '' ? { usuario_id: usuarioId } : {})
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  setUsuarioId(id: string | null): void {
    this._usuarioId.set(id);
  }

  setCredentials(username: string, password: string, sessionTimeoutMinutes?: number, sessionInactivityMinutes?: number, usuarioId?: string | null): void {
    const creds = { username, password };
    const ttlMinutes = sessionTimeoutMinutes ?? DEFAULT_TTL_MINUTES;
    const inactivityMinutes = sessionInactivityMinutes ?? 0;
    this._sessionInactivityMinutes.set(inactivityMinutes);
    if (usuarioId != null && usuarioId !== '') {
      this._usuarioId.set(usuarioId);
    }
    this.credentials.set(creds);
    this.saveToStorage(creds, ttlMinutes, inactivityMinutes, usuarioId);
  }

  clearCredentials(): void {
    this.credentials.set(null);
    this._usuarioId.set(null);
    this._sessionInactivityMinutes.set(0);
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
