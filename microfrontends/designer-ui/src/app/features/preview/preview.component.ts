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
        <div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-1">
              <li class="breadcrumb-item"><a routerLink="/">Gestión</a></li>
              <li class="breadcrumb-item active" aria-current="page">Previsualización</li>
            </ol>
          </nav>
          <h2 class="mb-0 fw-bold">Previsualización de Aplicación</h2>
        </div>
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

    <!-- Modal de Pruebas (Tester Funcional) - PANTALLA COMPLETA -->
    <div *ngIf="activeTest" class="full-screen-overlay animate-in">
      <div class="full-screen-container bg-white shadow-lg d-flex flex-column">
        <!-- Header -->
        <div class="p-3 border-bottom bg-dark text-white d-flex justify-content-between align-items-center flex-shrink-0">
          <div class="d-flex align-items-center">
            <div class="icon-circle bg-primary me-3" style="width: 40px; height: 40px; font-size: 1.2rem">
              <i class="bi bi-terminal"></i>
            </div>
            <div>
              <nav aria-label="breadcrumb" class="tester-breadcrumb">
                <ol class="breadcrumb mb-0">
                  <li class="breadcrumb-item small"><a class="text-info text-decoration-none" (click)="activeTest = null">Previsualización</a></li>
                  <li class="breadcrumb-item small text-white-50">{{ selectedServiceId }}</li>
                  <li class="breadcrumb-item small active text-white" aria-current="page">{{ activeTest.configuracion_ui?.label }}</li>
                </ol>
              </nav>
              <h5 class="mb-0 fw-bold">Probar: {{ activeTest.configuracion_ui?.label }}</h5>
              <div class="d-flex gap-2 align-items-center mt-1">
                <span class="badge" [ngClass]="getMethodClass(activeTest.method)">{{ activeTest.method }}</span>
                <code class="text-info x-small">{{ activeTest.path }}</code>
              </div>
            </div>
          </div>
          <button (click)="activeTest = null" class="btn btn-outline-light border-0 rounded-circle p-2" style="width: 40px; height: 40px">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <!-- Contenido principal -->
        <div class="flex-grow-1 overflow-auto bg-light p-4 p-md-5">
          <div class="container-xxl">
            <!-- Alerta de Respuesta -->
            <div *ngIf="testResponse" class="alert shadow-sm border-0 mb-4 animate-in" 
                 [ngClass]="testResponse.success ? 'alert-success' : 'alert-danger'">
              <div class="d-flex justify-content-between">
                <strong class="small text-uppercase">{{ testResponse.success ? 'Resultado de la Operación' : 'Error en la Operación' }}</strong>
                <button class="btn-close btn-close-sm" (click)="testResponse = null"></button>
              </div>
              <div class="mb-0 mt-2">
                <div *ngIf="isObject(testResponse.data)" class="bg-dark bg-opacity-10 p-3 rounded-3 overflow-auto" style="max-height: 200px">
                  <pre class="mb-0 small">{{ testResponse.data | json }}</pre>
                </div>
                <div *ngIf="!isObject(testResponse.data)" class="fw-bold">{{ testResponse.data }}</div>
              </div>
            </div>

            <!-- Caso GET: Listado Real -->
            <div *ngIf="activeTest.method === 'GET'">
              <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div class="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
                  <h6 class="fw-bold mb-0 text-secondary uppercase">REGISTROS RECUPERADOS DEL BACKEND</h6>
                  <div class="d-flex gap-2">
                    <button *ngIf="activeTest.configuracion_ui?.linked_actions?.create" 
                            class="btn btn-success px-4 fw-bold shadow-sm"
                            (click)="openSubTester('create')">
                      <i class="bi bi-plus-lg me-2"></i> Crear Nuevo
                    </button>
                    <button class="btn btn-primary px-4 fw-bold shadow-sm" (click)="executeGet()">
                      <i class="bi bi-arrow-repeat me-2"></i> Actualizar Grilla
                    </button>
                  </div>
                </div>
                <div class="table-responsive">
                  <table class="table table-hover align-middle mb-0">
                    <thead class="table-dark">
                      <tr>
                        <th *ngFor="let col of testerColumns" class="ps-4 py-3" [title]="'Atributo técnico: ' + col.key">
                          {{ col.label }}
                        </th>
                        <th *ngIf="hasLinkedActions()" class="text-center py-3">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of testData">
                        <td *ngFor="let col of testerColumns" class="ps-4 py-3">
                          <div *ngIf="activeTest.configuracion_ui?.fields_config?.response?.[col.key]?.refService">
                            <span class="fw-medium ref-underline cursor-help" 
                                  [title]="'Referencia a servicio: ' + activeTest.configuracion_ui.fields_config.response[col.key].refService">
                              {{ getRefValue(row[col.key], activeTest.configuracion_ui.fields_config.response[col.key].refService, activeTest.configuracion_ui.fields_config.response[col.key].refDisplay, activeTest.configuracion_ui.fields_config.response[col.key].refDescriptionService) }}
                            </span>
                          </div>
                          <span *ngIf="!activeTest.configuracion_ui?.fields_config?.response?.[col.key]?.refService">{{ row[col.key] }}</span>
                        </td>
                        <td *ngIf="hasLinkedActions()" class="text-center py-3">
                          <div class="btn-group shadow-sm">
                            <button *ngIf="activeTest.configuracion_ui.linked_actions.view" 
                                    class="btn btn-sm btn-outline-info px-3" title="Visualizar"
                                    (click)="openSubTester('view', row)">
                              <i class="bi bi-eye"></i>
                            </button>
                            <button *ngIf="activeTest.configuracion_ui.linked_actions.edit" 
                                    class="btn btn-sm btn-outline-warning px-3" title="Editar"
                                    (click)="openSubTester('update', row)">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button *ngIf="activeTest.configuracion_ui.linked_actions.delete" 
                                    class="btn btn-sm btn-outline-danger px-3" title="Eliminar"
                                    (click)="openSubTester('delete', row)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr *ngIf="testData.length === 0">
                        <td [attr.colspan]="testerColumns.length" class="text-center py-5 text-muted">
                          <i class="bi bi-cloud-download fs-1 d-block mb-3 opacity-25"></i>
                          No hay datos disponibles. Presiona "Ejecutar Consulta" para cargar.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Caso POST/PUT/PATCH: Formulario Real -->
            <div *ngIf="['POST', 'PUT', 'PATCH'].includes(activeTest.method)">
              <div class="row justify-content-center">
                <div class="col-lg-8">
              <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <h4 class="fw-bold mb-0 text-primary">
                    {{ activeTest.method === 'GET' ? 'Visualización de Registro' : 'Formulario de Configuración' }}
                  </h4>
                  <span *ngIf="activeTest.method === 'GET'" class="badge bg-info-subtle text-info px-3 py-2 border border-info border-opacity-25">
                    MODO SOLO LECTURA
                  </span>
                </div>
                <div class="row g-4">
                  <div *ngFor="let prop of testerFields" class="col-md-6">
                    <label class="form-label fw-bold text-secondary mb-2">
                      {{ prop.label }}
                      <span *ngIf="prop.required && activeTest.method !== 'GET'" class="text-danger">*</span>
                    </label>
                    
                    <!-- Caso REFERENCIA: Selector Desplegable Real -->
                    <div *ngIf="prop.refService" class="input-group">
                      <span class="input-group-text bg-light">
                        <i class="bi bi-link-45deg"></i>
                      </span>
                      <select class="form-select" [(ngModel)]="formData[prop.key]" [disabled]="!prop.editable || activeTest.method === 'GET'" [title]="'Atributo técnico: ' + prop.key">
                        <option [value]="undefined">Seleccione {{ prop.refService }}...</option>
                        <option *ngFor="let opt of getFilteredOptions(prop.refService, prop.dependsOn)" [value]="opt.id">
                          {{ opt.descripcion || opt.nombre || opt.id }} (ID: {{ opt.id }})
                        </option>
                      </select>
                    </div>
                    <div *ngIf="prop.dependsOn && !formData[prop.dependsOn] && activeTest.method !== 'GET'" class="small text-warning mt-2 d-flex align-items-center">
                      <i class="bi bi-exclamation-triangle me-2"></i> Debe seleccionar <strong>{{ prop.dependsOn }}</strong> primero.
                    </div>

                    <!-- Caso ESTÁNDAR -->
                    <input *ngIf="!prop.refService" [type]="prop.type === 'integer' ? 'number' : 'text'" 
                           [(ngModel)]="formData[prop.key]"
                           class="form-control" 
                           [placeholder]="'Valor para ' + prop.label"
                           [disabled]="!prop.editable || activeTest.method === 'GET'"
                           [class.bg-light]="!prop.editable || activeTest.method === 'GET'"
                           [class.border-info]="prop.unique && activeTest.method !== 'GET'"
                           [title]="'Atributo técnico: ' + prop.key">
                    <div *ngIf="prop.unique && activeTest.method !== 'GET'" class="small text-info mt-2">
                      <i class="bi bi-magic me-2"></i> Valor autogenerado (Campo único)
                    </div>
                  </div>
                </div>
                <div class="mt-5 pt-4 border-top d-flex gap-3">
                  <button class="btn btn-light border flex-grow-1 py-3 fw-bold" (click)="activeTest = null">
                    {{ activeTest.method === 'GET' ? 'Cerrar Visualización' : 'Cancelar' }}
                  </button>
                  <button *ngIf="activeTest.method !== 'GET'" class="btn btn-primary flex-grow-1 py-3 fw-bold shadow-sm" (click)="executeMutation()">
                    <i class="bi bi-cloud-upload me-2"></i>
                    {{ activeTest.method === 'POST' ? 'CREAR REGISTRO' : 'ACTUALIZAR REGISTRO' }}
                  </button>
                </div>
              </div>
                </div>
              </div>
            </div>

            <!-- Caso DELETE -->
            <div *ngIf="activeTest.method === 'DELETE'" class="row justify-content-center">
              <div class="col-lg-6">
                <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                  <div class="icon-circle bg-danger text-white mx-auto mb-4" style="width: 100px; height: 100px; font-size: 3rem">
                    <i class="bi bi-trash3"></i>
                  </div>
                  <h3 class="fw-bold mb-3">Eliminar por ID</h3>
                  <p class="text-muted mb-4">Ingresa el identificador único del registro que deseas eliminar permanentemente.</p>
                  <div class="input-group input-group-lg mb-4" style="max-width: 400px; margin: 0 auto">
                    <input type="text" [(ngModel)]="selectedId" class="form-control text-center fw-bold" placeholder="ID DEL REGISTRO">
                  </div>
                  
                  <div class="card bg-warning bg-opacity-10 border-warning mb-5 mx-auto text-start" style="max-width: 450px">
                    <div class="card-body p-3 small">
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="delType" id="logica" checked>
                        <label class="form-check-label fw-bold" for="logica">Baja Lógica (Ocultar registro)</label>
                      </div>
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="delType" id="fisica">
                        <label class="form-check-label fw-bold text-danger" for="fisica">Baja Definitiva (Borrado físico)</label>
                        <div class="text-muted x-small ms-4 mt-1">Solo se permitirá si no existen registros asociados en otros servicios.</div>
                      </div>
                    </div>
                  </div>

                  <div class="d-flex gap-3 justify-content-center">
                    <button class="btn btn-light border px-5 py-3 fw-bold" (click)="activeTest = null">CANCELAR</button>
                    <button class="btn btn-danger px-5 py-3 fw-bold shadow-sm" (click)="executeDelete()">ELIMINAR DEFINITIVAMENTE</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Contextual de Visualización -->
      <div *ngIf="activeSubTest && activeSubTest.type === 'view'" class="custom-modal-overlay" (click)="activeSubTest = null">
        <div class="custom-modal shadow-lg p-0 bg-white rounded-4 overflow-hidden animate-in" (click)="$event.stopPropagation()" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
          <div class="p-4 border-bottom bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
            <div>
              <h4 class="mb-0 fw-bold text-info">
                <i class="bi bi-eye me-2"></i>
                Visualizar Registro
              </h4>
              <p class="mb-0 small text-muted mt-1">
                {{ activeSubTest.ep?.configuracion_ui?.label || activeSubTest.ep?.summary || 'Detalles del registro' }}
              </p>
            </div>
            <button (click)="activeSubTest = null" class="btn-close"></button>
          </div>
          <div class="p-4">
            <div *ngIf="getViewFields().length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-info-circle fs-1 d-block mb-3 opacity-25"></i>
              No hay campos configurados para visualizar.
            </div>
            <div *ngIf="getViewFields().length > 0" class="row g-4">
              <div *ngFor="let field of getViewFields()" class="col-md-6">
                <label class="form-label fw-bold text-secondary mb-2 d-flex align-items-center">
                  {{ field.label }}
                  <span *ngIf="field.refService" class="badge bg-info-subtle text-info ms-2 small" [title]="'Referencia a: ' + field.refService">
                    <i class="bi bi-link-45deg me-1"></i>{{ field.refService }}
                  </span>
                  <span class="text-muted small ms-2" [title]="'Atributo técnico: ' + field.key">({{ field.key }})</span>
                </label>
                <div class="form-control bg-light border-0 py-3 d-flex align-items-center" [title]="'Atributo técnico: ' + field.key">
                  <span *ngIf="field.value !== null && field.value !== undefined" class="flex-grow-1">
                    {{ field.value }}
                  </span>
                  <span *ngIf="field.value === null || field.value === undefined" class="text-muted fst-italic flex-grow-1">
                    Sin valor
                  </span>
                </div>
              </div>
            </div>
            <div class="mt-5 pt-4 border-top d-flex justify-content-end">
              <button class="btn btn-primary px-5 py-2 fw-bold shadow-sm" (click)="activeSubTest = null">
                <i class="bi bi-check-lg me-2"></i>
                Cerrar
              </button>
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
  selectedId: string = '';
  testResponse: any = null;
  testerColumns: { key: string, label: string }[] = [];
  testerFields: {key: string, label: string, type: string, editable: boolean, required: boolean, unique: boolean, refService?: string, refDisplay?: string, refDescriptionService?: string, dependsOn?: string}[] = [];

  // Sub-Tester State (para navegación desde grilla)
  activeSubTest: { type: 'create' | 'update' | 'delete' | 'view', ep: any, data?: any } | null = null;
  
  // Guardar el endpoint GET original (grilla) cuando se abre un formulario de edición
  originalGridEndpoint: any = null;

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

  openTester(ep: any, preserveFormData: boolean = false) {
    this.activeTest = ep;
    this.testData = [];
    
    // Solo limpiar formData y selectedId si no se debe preservar (para edición)
    if (!preserveFormData) {
      this.formData = {};
      this.selectedId = '';
    }
    
    this.testResponse = null;
    
    // Pre-calcular columnas y campos
    this.testerColumns = this.calculateColumns(ep);
    this.testerFields = this.calculateFields(ep);

    // Auto-generar valores para campos ÚNICOS (como ID) si es un POST
    // Solo si no estamos preservando datos (no es edición)
    if (!preserveFormData) {
      this.generateUniqueIds();
    }

    // Cargar datos para referencias externas si existen
    this.testerFields.forEach(f => {
      if (f.refService) this.fetchRefData(f.refService);
      if (f.refDescriptionService && f.refDescriptionService !== f.refService) {
        this.fetchRefData(f.refDescriptionService);
      }
    });

    // También revisar las columnas del GET por si tienen referencias
    const responseConfig = ep.configuracion_ui?.fields_config?.response || {};
    Object.values(responseConfig).forEach((c: any) => {
      if (c.refService) this.fetchRefData(c.refService);
      if (c.refDescriptionService && c.refDescriptionService !== c.refService) {
        this.fetchRefData(c.refDescriptionService);
      }
    });

    // AUTO-LISTAR: Si es un GET sin parámetros (Grilla), ejecutar la consulta automáticamente al abrir
    // Si tiene parámetros, no ejecutar automáticamente (se ejecutará desde openSubTester si es necesario)
    if (ep.method === 'GET' && !ep.path.includes('{')) {
      // Pequeño delay para asegurar que el componente esté listo
      setTimeout(() => this.executeGet(), 100);
    }
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

  getRefValue(val: any, serviceId: string, display: string, descriptionServiceId?: string): string {
    const sourceServiceId = display === 'desc' && descriptionServiceId ? descriptionServiceId : serviceId;
    const list = this.refDataCache[sourceServiceId];
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

  calculateColumns(ep: any): { key: string, label: string }[] {
    const responseDto = ep.response_dto;
    if (!responseDto || !responseDto.properties) return [
      { key: 'id', label: 'ID' },
      { key: 'descripcion', label: 'Descripción' }
    ];

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
      .map(col => ({
        key: col,
        label: config[col]?.visualName || col
      }));
  }

  calculateFields(ep: any): {key: string, label: string, type: string, editable: boolean, required: boolean, unique: boolean, refService?: string, refDisplay?: string, refDescriptionService?: string}[] {
    const props = ep.request_dto?.properties || ep.response_dto?.properties;
    if (!props) return [];

    const config = ep.configuracion_ui?.fields_config?.request || {};
    return Object.entries(props)
      .map(([k, v]: any) => ({ 
        key: k, 
        label: config[k]?.visualName || k,
        type: v.type,
        editable: config[k]?.editable !== false,
        required: config[k]?.required === true,
        unique: config[k]?.unique === true,
        order: config[k]?.order || 0,
        refService: config[k]?.refService,
        refDisplay: config[k]?.refDisplay,
        refDescriptionService: config[k]?.refDescriptionService,
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
    
    let url = `${baseUrl}:${this.selectedServiceRaw.puerto}${this.activeTest.path}`;
    
    // Si el path tiene parámetros (como {pais_id}), reemplazarlos con selectedId o formData
    if (url.includes('{')) {
      // Primero intentar con formData (para casos donde el parámetro tiene un nombre específico)
      Object.keys(this.formData).forEach(key => {
        if (this.formData[key]) {
          url = url.replace(`{${key}}`, this.formData[key]);
          url = url.replace(`{${key}_id}`, this.formData[key]);
        }
      });
      
      // Si aún hay parámetros sin reemplazar, usar selectedId
      if (url.includes('{') && this.selectedId) {
        url = url.replace(/\{.*?\}/, this.selectedId);
      }
      
      // Si aún hay parámetros, intentar extraer el nombre del parámetro del path
      if (url.includes('{')) {
        const paramMatch = this.activeTest.path.match(/\{(\w+)\}/);
        if (paramMatch && this.formData[paramMatch[1]]) {
          url = url.replace(/\{.*?\}/, this.formData[paramMatch[1]]);
        }
      }
    }
    
    this.http.get<any>(url).subscribe({
      next: (res) => {
        // Si es un GET por ID (tiene parámetros en el path), mostrar como objeto único
        if (this.activeTest.path.includes('{')) {
          // Para visualización, mostrar el objeto directamente
          this.testData = Array.isArray(res) ? res : [res];
          this.testResponse = { success: true, data: res };
        } else {
          // GET de lista: procesar como array
          if (res && typeof res === 'object') {
            const listKey = Object.keys(res).find(k => Array.isArray(res[k]));
            this.testData = listKey ? res[listKey] : (Array.isArray(res) ? res : [res]);
          }
          this.testResponse = { success: true, data: res };
        }
      },
      error: (err) => {
        console.error('Error en GET:', err);
        const errorMsg = err.error?.detail || err.message || 'Error de conexión con el microservicio';
        this.testResponse = { success: false, data: errorMsg };
        this.testData = [];
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
      // Primero intentar con formData (para casos donde el parámetro tiene un nombre específico)
      Object.keys(this.formData).forEach(key => {
        if (this.formData[key] !== null && this.formData[key] !== undefined) {
          url = url.replace(`{${key}}`, String(this.formData[key]));
          url = url.replace(`{${key}_id}`, String(this.formData[key]));
        }
      });
      
      // Intentar con selectedId si aún hay llaves (esto cubre el estándar de pasar el ID a la ruta)
      if (url.includes('{') && this.selectedId) {
        url = url.replace(/\{.*?\}/, this.selectedId);
      }
      
      // Si aún hay parámetros, intentar extraer el nombre del parámetro del path
      if (url.includes('{')) {
        const paramMatch = this.activeTest.path.match(/\{(\w+)\}/);
        if (paramMatch) {
          // Intentar con el nombre del parámetro desde formData
          if (this.formData[paramMatch[1]]) {
            url = url.replace(/\{.*?\}/, String(this.formData[paramMatch[1]]));
          } else if (this.selectedId) {
            url = url.replace(/\{.*?\}/, this.selectedId);
          }
        }
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
        } else if ((this.activeTest.method === 'PUT' || this.activeTest.method === 'PATCH') && this.originalGridEndpoint) {
          // Si es una actualización y tenemos el endpoint original de la grilla, volver a la grilla
          setTimeout(() => {
            // Cerrar el formulario de edición
            this.activeTest = null;
            this.formData = {};
            this.selectedId = '';
            
            // Volver a abrir la grilla original y ejecutar el GET
            this.openTester(this.originalGridEndpoint, false);
            this.originalGridEndpoint = null; // Limpiar referencia
          }, 500); // Pequeño delay para que el usuario vea el mensaje de éxito
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
    if (!this.selectedServiceRaw || !this.activeTest || !this.selectedId) return;
    
    let baseUrl = this.selectedServiceRaw.host;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}`;
    
    let url = `${baseUrl}:${this.selectedServiceRaw.puerto}${this.activeTest.path}`;
    
    // Reemplazar parámetros de ruta dinámicamente
    if (url.includes('{')) {
      url = url.replace(/\{.*?\}/, this.selectedId);
    }
    
    this.http.delete(url).subscribe({
      next: (res) => {
        this.testResponse = { success: true, data: res };
        this.selectedId = ''; // Limpiar tras éxito
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

  hasLinkedActions(): boolean {
    const la = this.activeTest?.configuracion_ui?.linked_actions;
    return !!(la && (la.create || la.edit || la.delete || la.view));
  }

  // --- LÓGICA DE SUB-TESTER (Navegación desde Grilla) ---

  openSubTester(type: 'create' | 'update' | 'delete' | 'view', rowData?: any) {
    if (!this.inspectionData || !this.activeTest) return;

    const linkedActions = this.activeTest.configuracion_ui?.linked_actions;
    if (!linkedActions) return;

    // Para visualización, mostrar directamente en modal contextual sin hacer GET
    if (type === 'view' && rowData) {
      let targetPath = linkedActions.view;
      if (!targetPath) return;

      // Encontrar el endpoint de visualización para obtener su configuración
      const targetEp = this.inspectionData.endpoints.find((e: any) => e.path === targetPath && e.method === 'GET');
      
      if (targetEp) {
        // Establecer activeSubTest con los datos del registro para mostrar en modal
        this.activeSubTest = {
          type: 'view',
          ep: targetEp,
          data: rowData
        };
      }
      return;
    }

    // Para create, update, delete: usar la lógica original
    let targetPath = '';
    switch(type) {
      case 'create': targetPath = linkedActions.create; break;
      case 'update': targetPath = linkedActions.edit; break;
      case 'delete': targetPath = linkedActions.delete; break;
    }

    if (!targetPath) return;

    // Encontrar el endpoint real en inspectionData
    const targetEp = this.inspectionData.endpoints.find((e: any) => e.path === targetPath && 
      (type === 'create' ? e.method === 'POST' : 
       type === 'update' ? (e.method === 'PUT' || e.method === 'PATCH') :
       e.method === 'DELETE'));

    if (targetEp) {
      const idField = this.activeTest.configuracion_ui?.linked_actions?.id_field || 'id';
      
      // Capturar el ID de la fila según el campo configurado como Primary Key
      if (rowData) {
        // Establecer selectedId primero
        this.selectedId = String(rowData[idField] || rowData['id'] || '');
        
        // Si es edición, cargar todos los datos en formData ANTES de abrir el tester
        if (type === 'update') {
          // Guardar el endpoint GET original (grilla) para volver después de actualizar
          this.originalGridEndpoint = this.activeTest;
          
          // Cargar todos los datos del registro en formData
          // Asegurar que todos los valores sean strings o números según corresponda
          const formDataCopy: any = {};
          Object.keys(rowData).forEach(key => {
            const value = rowData[key];
            // Preservar el tipo original pero convertir null/undefined a string vacío si es necesario
            formDataCopy[key] = value !== null && value !== undefined ? value : '';
          });
          this.formData = formDataCopy;
          
          // Abrir el tester preservando los datos del formulario
          this.openTester(targetEp, true);
        } else {
          // Para create y delete, abrir normalmente sin preservar datos
          this.openTester(targetEp, false);
        }
      } else {
        // Si no hay rowData, abrir normalmente
        this.openTester(targetEp, false);
      }
    }
  }

  getViewFields(): { key: string, label: string, value: any, refService?: string, refDisplay?: string, refDescriptionService?: string }[] {
    if (!this.activeSubTest || this.activeSubTest.type !== 'view' || !this.activeSubTest.ep) return [];
    
    const ep = this.activeSubTest.ep;
    const responseDto = ep.response_dto;
    if (!responseDto || !responseDto.properties) return [];

    const fields: { key: string, label: string, value: any, refService?: string, refDisplay?: string, refDescriptionService?: string }[] = [];
    const fieldsConfig = ep.configuracion_ui?.fields_config?.response || {};

    Object.keys(responseDto.properties).forEach(key => {
      const prop = responseDto.properties[key];
      const config = fieldsConfig[key] || {};
      
      // Solo mostrar campos que están configurados para mostrarse
      if (config.show !== false) {
        const visualName = config.visualName || key;
        let displayValue = this.activeSubTest?.data?.[key];
        
        // Si tiene referencia a otro servicio, obtener el valor descriptivo
        if (config.refService && displayValue) {
          displayValue = this.getRefValue(displayValue, config.refService, config.refDisplay || 'desc', config.refDescriptionService);
        }
        
        // Formatear valores especiales
        if (displayValue !== null && displayValue !== undefined) {
          if (typeof displayValue === 'boolean') {
            displayValue = displayValue ? 'Sí' : 'No';
          } else if (displayValue instanceof Date || (typeof displayValue === 'string' && displayValue.match(/^\d{4}-\d{2}-\d{2}/))) {
            // Intentar formatear como fecha
            try {
              const date = new Date(displayValue);
              displayValue = date.toLocaleString('es-AR');
            } catch (e) {
              // Mantener el valor original si no es una fecha válida
            }
          }
        }
        
        fields.push({
          key: key,
          label: visualName,
          value: displayValue,
          refService: config.refService,
          refDisplay: config.refDisplay,
          refDescriptionService: config.refDescriptionService
        });
      }
    });

    // Ordenar por el orden configurado si existe
    fields.sort((a, b) => {
      const orderA = fieldsConfig[a.key]?.order || 999;
      const orderB = fieldsConfig[b.key]?.order || 999;
      return orderA - orderB;
    });

    return fields;
  }
}
