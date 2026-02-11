import { Injectable, signal, computed } from '@angular/core';

export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Servicio de autenticación: guarda credenciales en memoria para Basic Auth.
 * Preparado para ampliar con Bearer (OIDC/Keycloak) en el futuro.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly credentials = signal<AuthCredentials | null>(null);

  readonly isLoggedIn = computed(() => this.credentials() !== null);
  readonly username = computed(() => this.credentials()?.username ?? null);

  /** URL base del middleware (para que el interceptor solo añada header a estas peticiones). */
  readonly middlewareBaseUrl = 'http://127.0.0.1:9000';

  setCredentials(username: string, password: string): void {
    this.credentials.set({ username, password });
  }

  clearCredentials(): void {
    this.credentials.set(null);
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
    return url.startsWith(this.middlewareBaseUrl);
  }
}
