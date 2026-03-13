import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

const MIDDLEWARE_BASE = '/api/v1';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  order: number;
  target_service_id?: string;
  target_endpoint_path?: string;
  target_endpoint_method?: string;
  children: MenuItem[];
}

export interface RuntimeModule {
  backend_service_id: string;
  backend_service_nombre?: string;
  backend_service_host?: string;
  backend_service_puerto?: number;
  endpoint_path: string;
  metodo: string;
  configuracion_ui: any;
}

export interface AppRuntimeConfig {
  app_id: number;
  app_nombre: string;
  app_slug: string;
  role_id: string;
  role_nombre: string;
  menu_structure: MenuItem[];
  modules: RuntimeModule[];
}

export interface AppInfo {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  is_active: boolean;
  roles: { id: number; id_role: string; role_nombre: string }[];
}

export interface LoginResponse {
  success: boolean;
  requires_password_change: boolean;
  usuario_id?: string;
  session_timeout_minutes?: number;
  session_inactivity_minutes?: number;
}

@Injectable({ providedIn: 'root' })
export class RuntimeService {
  private http = inject(HttpClient);

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${MIDDLEWARE_BASE}/auth/login`, { username, password });
  }

  getAvailableApps(): Observable<AppInfo[]> {
    return this.http.get<AppInfo[]>(`${MIDDLEWARE_BASE}/apps/available`);
  }

  getAppBySlug(slug: string): Observable<AppInfo> {
    return this.http.get<AppInfo>(`${MIDDLEWARE_BASE}/apps/by-slug/${slug}`);
  }

  getAppRuntime(appId: number, roleId: string): Observable<AppRuntimeConfig> {
    return this.http.get<AppRuntimeConfig>(`${MIDDLEWARE_BASE}/apps/${appId}/runtime/${roleId}`);
  }

  getUserRoles(usuarioId: string): Observable<any[]> {
    return this.http.get<{ usuario_roles: any[]; total: number }>(
      `/usuario-rol-api/api/v1/usuario-roles?id_usuario=${usuarioId}`
    ).pipe(map(res => res.usuario_roles || []));
  }
}
