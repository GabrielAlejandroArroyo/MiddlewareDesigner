import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** En desarrollo (ng serve) usa proxy; en producción apunta al middleware. */
const MIDDLEWARE_BASE = '/api/v1';

export interface LoginResponse {
  success: boolean;
  requires_password_change: boolean;
  usuario_id?: string;
  session_timeout_minutes?: number;
  session_inactivity_minutes?: number;
}

export interface BackendService {
  id: string;
  nombre: string;
  host: string;
  puerto: number;
  openapi_url: string;
  descripcion: string;
  is_active: boolean;
  baja_logica: boolean;
  swagger_hash?: string;
  swagger_last_updated?: string;
  has_swagger_changes?: boolean;
}

export interface Endpoint {
  path: string;
  method: string;
  summary: string;
  operationId: string;
  is_enabled?: boolean;
  parameters?: any[];
  request_dto?: any;
  response_dto?: any;
  configuracion_ui?: any;
}

export interface AppDefinition {
  id: number;
  id_aplicacion?: string;
  nombre: string;
  descripcion?: string;
  slug: string;
  is_active: boolean;
  baja_logica: boolean;
  created_at?: string;
  updated_at?: string;
  roles: AppRoleConfig[];
  menu_config?: AppMenuConfig;
}

export interface AppRoleConfig {
  id: number;
  app_definition_id: number;
  id_role: string;
  role_nombre: string;
  is_active: boolean;
  modules: AppRoleModule[];
}

export interface AppRoleModule {
  id: number;
  app_role_config_id: number;
  backend_service_id: string;
  endpoint_path: string;
  metodo: string;
  is_enabled: boolean;
}

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

export interface AppMenuConfig {
  id: number;
  app_definition_id: number;
  menu_structure: MenuItem[];
}

export interface AppRuntimeResponse {
  app_id: number;
  app_nombre: string;
  app_slug: string;
  role_id: string;
  role_nombre: string;
  menu_structure: MenuItem[];
  modules: any[];
}

// --- Interfaces para microservicios externos ---

export interface Aplicacion {
  id: string;
  descripcion: string;
  tipo: string;
  baja_logica: boolean;
  fecha_alta_creacion?: string;
  fecha_alta_modificacion?: string;
}

export interface Rol {
  id: string;
  descripcion: string;
  id_aplicacion: string;
  baja_logica: boolean;
  fecha_alta_creacion?: string;
  fecha_alta_modificacion?: string;
}

export interface AplicacionRole {
  id: string;
  id_aplicacion: string;
  id_role: string;
  baja_logica: boolean;
  fecha_alta_creacion?: string;
  fecha_alta_modificacion?: string;
}

export interface UsuarioRol {
  internal_id: number;
  id: string;
  id_usuario: string;
  id_aplicacion: string;
  id_rol: string;
  baja_logica: boolean;
  fecha_alta_creacion?: string;
  fecha_alta_modificacion?: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  requiere_cambio_password: boolean;
  baja_logica: boolean;
  fecha_alta_creacion?: string;
  fecha_alta_modificacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MiddlewareService {
  private http = inject(HttpClient);
  private apiUrl = `${MIDDLEWARE_BASE}/config`;

  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${MIDDLEWARE_BASE}/auth/login`, { username, password });
  }

  getBackendServices(includeDeleted: boolean = false): Observable<BackendService[]> {
    return this.http.get<BackendService[]>(`${this.apiUrl}/backend-services?include_deleted=${includeDeleted}`);
  }

  checkBackendHealth(serviceId: string): Observable<{ status: 'online' }> {
    return this.http.get<{ status: 'online' }>(`${this.apiUrl}/backend-services/${serviceId}/health`);
  }

  registerBackend(service: Partial<BackendService>): Observable<BackendService> {
    return this.http.post<BackendService>(`${this.apiUrl}/backend-services`, service);
  }

  inspectService(serviceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/backend-services/${serviceId}/inspect`);
  }

  deleteBackend(serviceId: string, physical: boolean = false): Observable<any> {
    return this.http.delete(`${this.apiUrl}/backend-services/${serviceId}?physical=${physical}`);
  }

  reactivateBackend(serviceId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/backend-services/${serviceId}/alta-logica`, {});
  }

  toggleEndpointMapping(mapping: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/mappings/toggle`, mapping);
  }

  removeEndpointMapping(backendId: string, path: string, method: string): Observable<any> {
    const params = {
      backend_service_id: backendId,
      endpoint_path: path,
      metodo: method,
      frontend_service_id: 'default'
    };
    return this.http.delete(`${this.apiUrl}/mappings`, { params });
  }

  checkSwaggerChanges(serviceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/backend-services/${serviceId}/check-changes`);
  }

  refreshSwagger(serviceId: string, preserveConfig: boolean = true): Observable<any> {
    return this.http.post(`${this.apiUrl}/backend-services/${serviceId}/refresh-swagger?preserve_config=${preserveConfig}`, {});
  }

  getBackendServicesWithChanges(includeDeleted: boolean = false): Observable<BackendService[]> {
    return this.http.get<BackendService[]>(`${this.apiUrl}/backend-services?include_deleted=${includeDeleted}&check_changes=true`);
  }

  getBackendMappings(serviceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/backend-services/${serviceId}/mappings`);
  }

  // --- App Definitions ---

  private appsUrl = `${MIDDLEWARE_BASE}/apps`;

  getApps(includeDeleted = false): Observable<AppDefinition[]> {
    return this.http.get<AppDefinition[]>(`${this.appsUrl}?include_deleted=${includeDeleted}`);
  }

  getApp(appId: number): Observable<AppDefinition> {
    return this.http.get<AppDefinition>(`${this.appsUrl}/${appId}`);
  }

  createApp(data: { nombre: string; descripcion?: string; slug?: string; id_aplicacion?: string }): Observable<AppDefinition> {
    return this.http.post<AppDefinition>(this.appsUrl, data);
  }

  updateApp(appId: number, data: Partial<AppDefinition>): Observable<AppDefinition> {
    return this.http.put<AppDefinition>(`${this.appsUrl}/${appId}`, data);
  }

  deleteApp(appId: number): Observable<any> {
    return this.http.delete(`${this.appsUrl}/${appId}`);
  }

  // --- App Roles ---

  getAppRoles(appId: number): Observable<AppRoleConfig[]> {
    return this.http.get<AppRoleConfig[]>(`${this.appsUrl}/${appId}/roles`);
  }

  addAppRole(appId: number, data: { id_role: string; role_nombre: string }): Observable<AppRoleConfig> {
    return this.http.post<AppRoleConfig>(`${this.appsUrl}/${appId}/roles`, data);
  }

  removeAppRole(appId: number, roleConfigId: number): Observable<any> {
    return this.http.delete(`${this.appsUrl}/${appId}/roles/${roleConfigId}`);
  }

  // --- App Role Modules ---

  getAppRoleModules(appId: number, roleConfigId: number): Observable<AppRoleModule[]> {
    return this.http.get<AppRoleModule[]>(`${this.appsUrl}/${appId}/roles/${roleConfigId}/modules`);
  }

  setAppRoleModules(appId: number, roleConfigId: number, modules: Partial<AppRoleModule>[]): Observable<AppRoleModule[]> {
    return this.http.put<AppRoleModule[]>(`${this.appsUrl}/${appId}/roles/${roleConfigId}/modules`, { modules });
  }

  // --- App Menu ---

  getAppMenu(appId: number): Observable<AppMenuConfig> {
    return this.http.get<AppMenuConfig>(`${this.appsUrl}/${appId}/menu`);
  }

  saveAppMenu(appId: number, menuStructure: MenuItem[]): Observable<AppMenuConfig> {
    return this.http.put<AppMenuConfig>(`${this.appsUrl}/${appId}/menu`, { menu_structure: menuStructure });
  }

  autoGenerateMenu(appId: number): Observable<AppMenuConfig> {
    return this.http.post<AppMenuConfig>(`${this.appsUrl}/${appId}/menu/auto-generate`, {});
  }

  // --- Runtime ---

  getAppRuntime(appId: number, roleId: string): Observable<AppRuntimeResponse> {
    return this.http.get<AppRuntimeResponse>(`${this.appsUrl}/${appId}/runtime/${roleId}`);
  }

  getAppBySlug(slug: string): Observable<AppDefinition> {
    return this.http.get<AppDefinition>(`${this.appsUrl}/by-slug/${slug}`);
  }

  // --- Microservicios externos (acceso directo via proxy) ---

  getAplicaciones(includeBaja = true): Observable<Aplicacion[]> {
    return this.http.get<any>(`/aplicacion-api/api/v1/aplicaciones/?include_baja_logica=${includeBaja}`).pipe(
      map((res: any) => res.aplicacion || res || [])
    );
  }

  getRolesByAplicacion(idAplicacion: string, includeBaja = true): Observable<Rol[]> {
    return this.http.get<any>(`/roles-api/api/v1/roles/aplicacion/${idAplicacion}?include_baja_logica=${includeBaja}`).pipe(
      map((res: any) => res.roles || res || [])
    );
  }

  getAllRoles(includeBaja = true): Observable<Rol[]> {
    return this.http.get<any>(`/roles-api/api/v1/roles/?include_baja_logica=${includeBaja}`).pipe(
      map((res: any) => res.roles || res || [])
    );
  }

  getAplicacionRoles(includeBaja = true): Observable<AplicacionRole[]> {
    return this.http.get<any>(`/aplicacion-role-api/api/v1/aplicacion-roles/?include_baja=${includeBaja}`).pipe(
      map((res: any) => res.aplicacion_roles || res || [])
    );
  }

  createAplicacionRole(data: { id_aplicacion: string; id_role: string }): Observable<AplicacionRole> {
    return this.http.post<AplicacionRole>(`/aplicacion-role-api/api/v1/aplicacion-roles/`, data);
  }

  deleteAplicacionRole(id: string): Observable<any> {
    return this.http.delete(`/aplicacion-role-api/api/v1/aplicacion-roles/${id}`);
  }

  getUsuarioRoles(includeBaja = true): Observable<UsuarioRol[]> {
    return this.http.get<any>(`/usuario-rol-api/api/v1/usuario-roles/?include_baja=${includeBaja}`).pipe(
      map((res: any) => res.usuario_roles || res || [])
    );
  }

  getUsuarios(includeBaja = false): Observable<Usuario[]> {
    return this.http.get<any>(`/usuario-api/api/v1/usuarios/?include_baja_logica=${includeBaja}`).pipe(
      map((res: any) => res.usuarios || res || [])
    );
  }

  getUsuario(usuarioId: string): Observable<Usuario> {
    return this.http.get<Usuario>(`/usuario-api/api/v1/usuarios/${usuarioId}`);
  }
}
