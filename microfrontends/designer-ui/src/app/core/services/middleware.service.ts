import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class MiddlewareService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:9000/api/v1/config';

  getBackendServices(includeDeleted: boolean = false): Observable<BackendService[]> {
    return this.http.get<BackendService[]>(`${this.apiUrl}/backend-services?include_deleted=${includeDeleted}`);
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
}
