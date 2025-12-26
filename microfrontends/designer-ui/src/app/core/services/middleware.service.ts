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
}

export interface Endpoint {
  path: string;
  method: string;
  summary: string;
  operationId: string;
}

@Injectable({
  providedIn: 'root'
})
export class MiddlewareService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:9000/api/v1/config';

  getBackendServices(): Observable<BackendService[]> {
    return this.http.get<BackendService[]>(`${this.apiUrl}/backend-services`);
  }

  registerBackend(service: Partial<BackendService>): Observable<BackendService> {
    return this.http.post<BackendService>(`${this.apiUrl}/backend-services`, service);
  }

  inspectService(serviceId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/backend-services/${serviceId}/inspect`);
  }
}
