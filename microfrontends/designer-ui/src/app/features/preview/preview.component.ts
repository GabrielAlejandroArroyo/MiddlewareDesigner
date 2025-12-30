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
            <div class="mb-0 mt-2 small overflow-auto" style="max-height: 150px">
              <pre *ngIf="isObject(testResponse.data)" class="mb-0">{{ testResponse.data | json }}</pre>
              <div *ngIf="!isObject(testResponse.data)" class="fw-bold">{{ testResponse.data }}</div>
            </div>
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
                    <td *ngFor="let col of testerColumns" class="ps-3 py-2">
                      <div *ngIf="activeTest.configuracion_ui?.fields_config?.response?.[col]?.refService" class="d-flex align-items-center gap-1">
                        <span class="badge bg-info-subtle text-info x-small border border-info border-opacity-25">
                          {{ activeTest.configuracion_ui.fields_config.response[col].refService }}
                        </span>
                        <span>{{ getRefValue(row[col], activeTest.configuracion_ui.fields_config.response[col].refService, activeTest.configuracion_ui.fields_config.response[col].refDisplay) }}</span>
                      </div>
                      <span *ngIf="!activeTest.configuracion_ui?.fields_config?.response?.[col]?.refService">{{ row[col] }}</span>
                    </td>
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
                <label class="form-label small fw-bold text-muted">
                  {{ prop.key }}
                  <span *ngIf="prop.required" class="text-danger">*</span>
                </label>
                
                <!-- Caso REFERENCIA: Selector Desplegable Real -->
                <div *ngIf="prop.refService" class="input-group input-group-sm">
                  <span class="input-group-text bg-info-subtle text-info border-info border-opacity-25 x-small">
                    <i class="bi bi-link-45deg"></i>
                  </span>
                  <select class="form-select" [(ngModel)]="formData[prop.key]" [disabled]="!prop.editable">
                    <option [value]="undefined">Seleccione {{ prop.refService }}...</option>
                    <option *ngFor="let opt of getFilteredOptions(prop.refService, prop.dependsOn)" [value]="opt.id">
                      {{ opt.descripcion || opt.nombre || opt.id }} (ID: {{ opt.id }})
                    </option>
                  </select>
                </div>
                <div *ngIf="prop.dependsOn && !formData[prop.dependsOn]" class="x-small text-warning mt-1">
                  <i class="bi bi-exclamation-triangle"></i> Debe seleccionar <strong>{{ prop.dependsOn }}</strong> primero.
                </div>

                <!-- Caso ESTÁNDAR -->
                <input *ngIf="!prop.refService" [type]="prop.type === 'integer' ? 'number' : 'text'" 
                       [(ngModel)]="formData[prop.key]"
                       class="form-control form-control-sm" 
                       [placeholder]="'Valor para ' + prop.key"
                       [disabled]="!prop.editable"
                       [class.bg-light]="!prop.editable"
                       [class.border-info]="prop.unique">
                <div *ngIf="prop.unique" class="x-small text-info mt-1">
                  <i class="bi bi-magic"></i> Valor autogenerado por ser campo <strong>único</strong>
                </div>
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
  
  // Cache para datos de referencias externas
  refDataCache: {[key: string]: any[]} = {};

  // Tester State
  activeTest: any = null;
  testData: any[] = [];
  formData: any = {};
  deleteId: string = '';
  testResponse: any = null;
  testerColumns: string[] = [];
  testerFields: {key: string, type: string, editable: boolean, required: boolean, unique: boolean, refService?: string, refDisplay?: string, dependsOn?: string}[] = [];

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
    
    // Pre-calcular columnas y campos
    this.testerColumns = this.calculateColumns(ep);
    this.testerFields = this.calculateFields(ep);

    // Auto-generar valores para campos ÚNICOS (como ID) si es un POST
    this.generateUniqueIds();

    // Cargar datos para referencias externas si existen
    this.testerFields.forEach(f => {
      if (f.refService) this.fetchRefData(f.refService);
    });

    // También revisar las columnas del GET por si tienen referencias
    const responseConfig = ep.configuracion_ui?.fields_config?.response || {};
    Object.values(responseConfig).forEach((c: any) => {
      if (c.refService) this.fetchRefData(c.refService);
    });
  }

  private generateUniqueIds() {
    if (this.activeTest?.method === 'POST') {
      this.testerFields.forEach(f => {
        if (f.unique) {
          // Generar un ID aleatorio corto pero identificativo
          const prefix = this.activeTest.path.split('/')[2]?.substring(0, 3).toUpperCase() || 'ID';
          const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
          this.formData[f.key] = `${prefix}_${randomSuffix}`;
        }
      });
    }
  }

  fetchRefData(serviceId: string) {
    if (this.refDataCache[serviceId]) return;

    const service = this.services.find(s => s.id === serviceId);
    if (!service) return;

    // Intentar encontrar el endpoint GET principal del servicio referenciado
    this.middlewareService.inspectService(serviceId).subscribe(data => {
      const getEndpoint = data.endpoints.find((e: any) => e.method === 'GET' && !e.path.includes('{'));
      if (getEndpoint) {
        let baseUrl = service.host;
        if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
        const url = `${baseUrl}:${service.puerto}${getEndpoint.path}`;

        this.http.get<any>(url).subscribe(res => {
          // Extraer la lista (manejo de patrón RORO)
          const listKey = Object.keys(res).find(k => Array.isArray(res[k]));
          this.refDataCache[serviceId] = listKey ? res[listKey] : (Array.isArray(res) ? res : [res]);
        });
      }
    });
  }

  getRefValue(val: any, serviceId: string, display: string): string {
    const list = this.refDataCache[serviceId];
    if (!list || !val) return val;

    const item = list.find(i => String(i.id) === String(val));
    if (!item) return val;

    if (display === 'desc') {
      return item.descripcion || item.nombre || item.label || val;
    }
    return val;
  }

  getFilteredOptions(refService: string, dependsOn?: string): any[] {
    const data = this.refDataCache[refService] || [];
    if (!dependsOn || !this.formData[dependsOn]) return data;
    
    // Filtrar la lista del servicio referenciado buscando el campo que coincide con la dependencia
    // Por ejemplo: si id_provincia depende de id_pais, filtramos provincias donde provincia.id_pais == formData.id_pais
    return data.filter(item => String(item[dependsOn]) === String(this.formData[dependsOn]));
  }

  calculateColumns(ep: any): string[] {
    const responseDto = ep.response_dto;
    if (!responseDto || !responseDto.properties) return ['id', 'descripcion'];

    // Buscamos dinámicamente la propiedad que sea un array (lista de resultados)
    const listProp: any = Object.values(responseDto.properties).find((p: any) => p.type === 'array');
    
    let properties = {};
    if (listProp && listProp.items && listProp.items.properties) {
      properties = listProp.items.properties;
    } else {
      properties = responseDto.properties;
    }

    const config = ep.configuracion_ui?.fields_config?.response || {};
    return Object.keys(properties)
      .filter(col => config[col]?.show !== false)
      .sort((a, b) => (config[a]?.order || 0) - (config[b]?.order || 0))
      .slice(0, 5);
  }

  calculateFields(ep: any): {key: string, type: string, editable: boolean, required: boolean, unique: boolean, refService?: string, refDisplay?: string}[] {
    const props = ep.request_dto?.properties || ep.response_dto?.properties;
    if (!props) return [];

    const config = ep.configuracion_ui?.fields_config?.request || {};
    return Object.entries(props)
      .map(([k, v]: any) => ({ 
        key: k, 
        type: v.type,
        editable: config[k]?.editable !== false,
        required: config[k]?.required === true,
        unique: config[k]?.unique === true,
        order: config[k]?.order || 0,
        refService: config[k]?.refService,
        refDisplay: config[k]?.refDisplay,
        dependsOn: config[k]?.dependsOn
      }))
      .filter(f => config[f.key]?.show !== false)
      .sort((a, b) => a.order - b.order);
  }

  // --- EJECUCIÓN REAL DE PRUEBAS ---

  executeGet() {
    if (!this.selectedServiceRaw || !this.activeTest) return;
    
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
      error: (err) => {
        console.error('Error en GET:', err);
        const errorMsg = err.error?.detail || err.message || 'Error de conexión con el microservicio';
        this.testResponse = { success: false, data: errorMsg };
      }
    });
  }

  executeMutation() {
    if (!this.selectedServiceRaw || !this.activeTest) return;
    
    let baseUrl = this.selectedServiceRaw.host;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
    
    let url = `${baseUrl}:${this.selectedServiceRaw.puerto}${this.activeTest.path}`;
    
    // Reemplazar parámetros de ruta dinámicamente si existen
    if (url.includes('{')) {
      Object.keys(this.formData).forEach(key => {
        url = url.replace(`{${key}}`, this.formData[key]);
      });
      // Fallback para ids comunes si no coinciden exactamente
      if (url.includes('{')) {
        url = url.replace(/\{.*_id\}/, this.formData.id);
      }
    }
    
    const obs = this.activeTest.method === 'POST' 
      ? this.http.post(url, this.formData)
      : this.http.put(url, this.formData);

    obs.subscribe({
      next: (res) => {
        this.testResponse = { success: true, data: res };
        if (this.activeTest.method === 'POST') {
          this.formData = {}; // Limpiar form tras éxito
          this.generateUniqueIds(); // Regenerar IDs para la siguiente carga
        }
      },
      error: (err) => {
        console.error('Error en Mutation:', err);
        const errorMsg = err.error?.detail || err.message || 'Error al procesar la solicitud';
        this.testResponse = { success: false, data: errorMsg };
      }
    });
  }

  executeDelete() {
    if (!this.selectedServiceRaw || !this.activeTest || !this.deleteId) return;
    
    let baseUrl = this.selectedServiceRaw.host;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
    
    let url = `${baseUrl}:${this.selectedServiceRaw.puerto}${this.activeTest.path}`;
    
    // Reemplazar parámetros de ruta dinámicamente
    if (url.includes('{')) {
      url = url.replace(/\{.*\}/, this.deleteId);
    }
    
    this.http.delete(url).subscribe({
      next: (res) => {
        this.testResponse = { success: true, data: res };
        this.deleteId = ''; // Limpiar tras éxito
      },
      error: (err) => {
        console.error('Error en DELETE:', err);
        const errorMsg = err.error?.detail || err.message || 'Error al eliminar el registro';
        this.testResponse = { success: false, data: errorMsg };
      }
    });
  }

  // --- HELPERS ---

  isObject(val: any): boolean {
    return val !== null && typeof val === 'object';
  }

  getMethodClass(method: string): string { return `badge-${method}`; }
  getBorderClass(method: string): string { return `border-${method}`; }
  getComponentType(method: string): string {
    if (method === 'GET') return 'Grilla';
    if (method === 'POST') return 'Formulario';
    if (method === 'DELETE') return 'Diálogo';
    return 'Editor';
  }
}
