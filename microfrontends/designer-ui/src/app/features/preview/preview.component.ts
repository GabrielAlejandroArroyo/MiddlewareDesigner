import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiddlewareService, BackendService, Endpoint } from '../../core/services/middleware.service';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0 fw-bold">Previsualización de Aplicación</h2>
        <button class="btn btn-light border shadow-sm" (click)="loadEnabledServices()">
          Actualizar Datos
        </button>
      </div>

      <div class="row g-4">
        <!-- Sidebar: Servicios Habilitados -->
        <div class="col-md-3">
          <div class="card shadow-sm border-0 sticky-top" style="top: 20px">
            <div class="card-header bg-primary text-white fw-bold py-3">
              <i class="bi bi-list-nested me-2"></i> Módulos Generados
            </div>
            <div class="list-group list-group-flush">
              <div *ngIf="loading" class="p-4 text-center">
                <div class="spinner-border spinner-border-sm text-primary"></div>
              </div>
              
              <div *ngIf="!loading && services.length === 0" class="p-4 text-center text-muted small">
                No hay servicios habilitados aún.
              </div>

              <div *ngFor="let svc of services" class="list-group-item p-0">
                <button class="btn w-100 text-start py-3 px-4 border-0 rounded-0 d-flex justify-content-between align-items-center"
                        [class.bg-light]="selectedServiceId === svc.id"
                        (click)="selectService(svc.id)">
                  <div>
                    <span class="d-block fw-bold small text-primary">{{ svc.id | uppercase }}</span>
                    <span class="small text-muted">{{ svc.nombre }}</span>
                  </div>
                  <i class="bi bi-chevron-right small text-muted"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="col-md-9">
          <div *ngIf="!selectedServiceId" class="card shadow-sm border-0 bg-light py-5 text-center rounded-4">
            <div class="card-body">
              <i class="bi bi-grid-3x3-gap text-muted" style="font-size: 4rem"></i>
              <h4 class="mt-4 fw-bold">Selecciona un módulo para previsualizar</h4>
              <p class="text-muted mx-auto" style="max-width: 400px">
                Aquí verás cómo interactúan los componentes generados a partir de los contratos OpenAPI habilitados en el middleware.
              </p>
            </div>
          </div>

          <div *ngIf="selectedServiceId && inspectionData" class="animate-in">
            <div class="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
              <div class="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
                <div>
                  <h3 class="fw-bold mb-1 text-dark">{{ inspectionData.service_name }}</h3>
                  <p class="text-muted mb-0">Visualizando componentes activos del microservicio</p>
                </div>
                <span class="badge bg-success-subtle text-success px-3 py-2 border border-success border-opacity-25">
                  Módulo Operativo
                </span>
              </div>
            </div>

            <div class="row g-4">
              <div *ngFor="let ep of enabledEndpoints" class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm border-0 border-top border-4 action-card shadow-hover"
                     [ngClass]="getBorderClass(ep.method)">
                  <div class="card-body p-4 d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                      <span class="badge" [ngClass]="getMethodClass(ep.method)">{{ ep.method }}</span>
                      <code class="x-small text-muted">{{ ep.path }}</code>
                    </div>
                    <h5 class="fw-bold mb-2">{{ ep.configuracion_ui?.label || ep.summary || 'Acción sin nombre' }}</h5>
                    <p class="small text-muted mb-4">{{ ep.configuracion_ui?.description || 'Sin descripción adicional.' }}</p>
                    
                    <div class="mt-auto pt-3 border-top d-flex flex-column gap-2">
                      <div class="d-flex align-items-center justify-content-between">
                        <span class="small text-muted"><i class="bi bi-ui-checks me-1"></i> {{ getComponentType(ep.method) }}</span>
                        <button [routerLink]="['/inspect', selectedServiceId, 'action-definition']" 
                                [queryParams]="{ path: ep.path, method: ep.method }"
                                class="btn btn-sm btn-link p-0">Configurar</button>
                      </div>
                      <!-- Botón Probar Solicitado -->
                      <button (click)="openTester(ep)" class="btn btn-sm btn-primary w-100 fw-bold shadow-sm py-2">
                        <i class="bi bi-play-fill"></i> PROBAR FUNCIONALIDAD
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Pruebas (Tester Funcional) -->
    <div *ngIf="activeTest" class="custom-modal-overlay">
      <div class="custom-modal shadow-lg p-0 bg-white rounded-4 overflow-hidden animate-in">
        <div class="p-3 border-bottom bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold"><i class="bi bi-terminal me-2 text-info"></i> Probar: {{ activeTest.configuracion_ui?.label }}</h5>
          <button (click)="activeTest = null" class="btn-close btn-close-white"></button>
        </div>
        
        <div class="p-4 scrollable-modal-content">
          <!-- Alerta de Respuesta -->
          <div *ngIf="testResponse" class="alert shadow-sm border-0 mb-4 animate-in" 
               [ngClass]="testResponse.success ? 'alert-success' : 'alert-danger'">
            <div class="d-flex justify-content-between">
              <strong class="small text-uppercase">{{ testResponse.success ? 'Éxito' : 'Error' }}</strong>
              <button class="btn-close btn-close-sm" (click)="testResponse = null"></button>
            </div>
            <pre class="mb-0 mt-2 small overflow-auto" style="max-height: 150px">{{ testResponse.data | json }}</pre>
          </div>

          <!-- Caso GET: Listado Real -->
          <div *ngIf="activeTest.method === 'GET'">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="fw-bold mb-0">Datos del Backend</h6>
              <button class="btn btn-sm btn-outline-primary" (click)="executeGet()">Ejecutar Consulta</button>
            </div>
            <div class="table-responsive border rounded-3 bg-light" style="max-height: 300px">
              <table class="table table-sm mb-0">
                <thead class="table-dark small">
                  <tr>
                    <th *ngFor="let col of testerColumns" class="ps-3">{{ col }}</th>
                  </tr>
                </thead>
                <tbody class="small">
                  <tr *ngFor="let row of testData">
                    <td *ngFor="let col of testerColumns" class="ps-3 py-2">{{ row[col] }}</td>
                  </tr>
                  <tr *ngIf="testData.length === 0">
                    <td [attr.colspan]="testerColumns.length" class="text-center py-4 text-muted">
                      No hay datos o pulsa "Ejecutar Consulta"
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Caso POST/PUT/PATCH: Formulario Real -->
          <div *ngIf="['POST', 'PUT', 'PATCH'].includes(activeTest.method)">
            <h6 class="fw-bold mb-3">Formulario de Entrada</h6>
            <div class="row g-3">
              <div *ngFor="let prop of testerFields" class="col-md-6">
                <label class="form-label small fw-bold text-muted">{{ prop.key }}</label>
                <input [type]="prop.type === 'integer' ? 'number' : 'text'" 
                       [(ngModel)]="formData[prop.key]"
                       class="form-control form-control-sm" 
                       [placeholder]="'Valor para ' + prop.key"
                       [disabled]="!prop.editable"
                       [class.bg-light]="!prop.editable">
              </div>
            </div>
            <div class="mt-4 pt-3 border-top d-flex gap-2">
              <button class="btn btn-light border flex-grow-1" (click)="activeTest = null">Cancelar</button>
              <button class="btn btn-primary flex-grow-1 fw-bold" (click)="executeMutation()">
                {{ activeTest.method === 'POST' ? 'Crear Registro' : 'Actualizar Registro' }}
              </button>
            </div>
          </div>

          <!-- Caso DELETE -->
          <div *ngIf="activeTest.method === 'DELETE'" class="text-center py-3">
            <i class="bi bi-trash3 text-danger fs-1 mb-3"></i>
            <h5 class="fw-bold">Eliminar por ID</h5>
            <p class="text-muted small">Ingresa el identificador único para procesar la baja.</p>
            <div class="input-group mb-4" style="max-width: 300px; margin: 0 auto">
              <input type="text" [(ngModel)]="deleteId" class="form-control text-center" placeholder="ID del registro">
            </div>
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-light border px-4" (click)="activeTest = null">Cancelar</button>
              <button class="btn btn-danger px-4 fw-bold" (click)="executeDelete()">Eliminar Definitivamente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PreviewComponent implements OnInit {
  private middlewareService = inject(MiddlewareService);
  private http = inject(HttpClient);
  
  services: BackendService[] = [];
  loading = true;
  selectedServiceId: string | null = null;
  selectedServiceRaw: BackendService | null = null;
  inspectionData: any = null;
  enabledEndpoints: any[] = [];

  // Tester State
  activeTest: any = null;
  testData: any[] = [];
  formData: any = {};
  deleteId: string = '';
  testResponse: any = null;
  testerColumns: string[] = [];
  testerFields: {key: string, type: string, editable: boolean}[] = [];

  ngOnInit() {
    this.loadEnabledServices();
  }

  loadEnabledServices() {
    this.loading = true;
    this.middlewareService.getBackendServices(false).subscribe({
      next: (data) => {
        this.services = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  selectService(id: string) {
    this.selectedServiceId = id;
    this.selectedServiceRaw = this.services.find(s => s.id === id) || null;
    this.loading = true;
    this.middlewareService.inspectService(id).subscribe({
      next: (data) => {
        this.inspectionData = data;
        this.enabledEndpoints = data.endpoints.filter((e: any) => e.is_enabled);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  openTester(ep: any) {
    this.activeTest = ep;
    this.testData = [];
    this.formData = {};
    this.deleteId = '';
    this.testResponse = null;
    
    // Pre-calcular columnas y campos para evitar bucles infinitos de detección de cambios
    this.testerColumns = this.calculateColumns(ep);
    this.testerFields = this.calculateFields(ep);
  }

  calculateColumns(ep: any): string[] {
    const properties = ep.response_dto?.properties?.paises?.items?.properties || 
                     ep.response_dto?.properties?.provincias?.items?.properties ||
                     ep.response_dto?.properties;
    
    if (!properties) return ['id', 'descripcion'];

    const config = ep.configuracion_ui?.fields_config?.response || {};
    return Object.keys(properties).filter(col => config[col]?.show !== false).slice(0, 5);
  }

  calculateFields(ep: any): {key: string, type: string, editable: boolean}[] {
    const props = ep.request_dto?.properties || ep.response_dto?.properties;
    if (!props) return [];

    const config = ep.configuracion_ui?.fields_config?.request || {};
    return Object.entries(props)
      .map(([k, v]: any) => ({ 
        key: k, 
        type: v.type,
        editable: config[k]?.editable !== false
      }))
      .filter(f => config[f.key]?.show !== false);
  }

  // --- EJECUCIÓN REAL DE PRUEBAS ---

  executeGet() {
    if (!this.selectedServiceRaw || !this.activeTest) return;
    
    // Asegurar que la URL sea válida
    let baseUrl = this.selectedServiceRaw.host;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
    
    const url = `${baseUrl}:${this.selectedServiceRaw.puerto}${this.activeTest.path}`;
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res && typeof res === 'object') {
          const listKey = Object.keys(res).find(k => Array.isArray(res[k]));
          this.testData = listKey ? res[listKey] : (Array.isArray(res) ? res : [res]);
        }
        this.testResponse = { success: true, data: res };
      },
      error: (err) => this.testResponse = { success: false, data: err }
    });
  }

  executeMutation() {
    if (!this.selectedServiceRaw || !this.activeTest) return;
    
    let baseUrl = this.selectedServiceRaw.host;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
    
    const url = `${baseUrl}:${this.selectedServiceRaw.puerto}${this.activeTest.path}`;
    
    const obs = this.activeTest.method === 'POST' 
      ? this.http.post(url, this.formData)
      : this.http.put(url.replace('{pais_id}', this.formData.id).replace('{provincia_id}', this.formData.id), this.formData);

    obs.subscribe({
      next: (res) => {
        this.testResponse = { success: true, data: res };
        if (this.activeTest.method === 'POST') this.formData = {}; // Limpiar form tras éxito
      },
      error: (err) => this.testResponse = { success: false, data: err }
    });
  }

  executeDelete() {
    if (!this.selectedServiceRaw || !this.activeTest || !this.deleteId) return;
    
    let baseUrl = this.selectedServiceRaw.host;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
    
    const url = `${baseUrl}:${this.selectedServiceRaw.puerto}${this.activeTest.path.replace('{pais_id}', this.deleteId).replace('{provincia_id}', this.deleteId)}`;
    
    this.http.delete(url).subscribe({
      next: (res) => {
        this.testResponse = { success: true, data: res };
        this.deleteId = ''; // Limpiar tras éxito
      },
      error: (err) => this.testResponse = { success: false, data: err }
    });
  }

  // --- HELPERS ---

  getMethodClass(method: string): string { return `badge-${method}`; }
  getBorderClass(method: string): string { return `border-${method}`; }
  getComponentType(method: string): string {
    if (method === 'GET') return 'Grilla';
    if (method === 'POST') return 'Formulario';
    if (method === 'DELETE') return 'Diálogo';
    return 'Editor';
  }
}
