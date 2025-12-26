import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MiddlewareService, Endpoint } from '../../core/services/middleware.service';

@Component({
  selector: 'app-action-definition',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <!-- Encabezado -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-1">
              <li class="breadcrumb-item"><a routerLink="/">Gestión</a></li>
              <li class="breadcrumb-item"><a [routerLink]="['/inspect', serviceId]">Contrato</a></li>
              <li class="breadcrumb-item active" aria-current="page">Definir Acción</li>
            </ol>
          </nav>
          <h2 class="mb-0 fw-bold text-primary">
            Configurar Acción: <code class="text-dark">{{ path }}</code>
          </h2>
          <div class="mt-2">
            <span class="badge py-2 px-3" [ngClass]="getMethodClass(method)">{{ method }}</span>
            <span class="ms-2 text-muted small">Servicio: {{ serviceId }}</span>
          </div>
        </div>
        <button class="btn btn-light border shadow-sm" [routerLink]="['/inspect', serviceId]">
          Cancelar y Volver
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Cargando detalles del endpoint...</p>
      </div>

      <div *ngIf="error" class="alert alert-danger shadow-sm border-0 animate-in">
        <h5 class="alert-heading fw-bold">Error</h5>
        <p class="mb-0">{{ error }}</p>
        <hr>
        <button class="btn btn-sm btn-outline-danger" (click)="loadEndpointDetails()">Reintentar</button>
      </div>

      <div *ngIf="endpoint && !loading" class="row g-4">
        <!-- Columna Izquierda: Configuración -->
        <div class="col-lg-5">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0 fw-bold">Propiedades de la Acción</h5>
            </div>
            <div class="card-body">
              <div class="mb-4">
                <label class="form-label small fw-bold text-uppercase text-muted">Nombre de la Acción / Pantalla</label>
                <input type="text" class="form-control form-control-lg" [(ngModel)]="actionName" 
                       placeholder="Ej: Alta de Nuevo País">
                <div class="form-text">Este nombre se usará como título en la interfaz generada.</div>
              </div>

              <div class="mb-4">
                <label class="form-label small fw-bold text-uppercase text-muted">Descripción del Proceso</label>
                <textarea class="form-control" rows="3" [(ngModel)]="actionDescription"
                          placeholder="Describe brevemente qué hace esta acción..."></textarea>
              </div>

              <div class="alert alert-info border-0 bg-info bg-opacity-10 small mb-4">
                <div class="d-flex gap-2">
                  <i class="bi bi-info-circle-fill"></i>
                  <span>Al guardar, el middleware registrará estos metadatos para la generación automática de la UI.</span>
                </div>
              </div>

              <button (click)="saveDefinition()" class="btn btn-primary btn-lg w-100 shadow-sm fw-bold mt-2">
                Guardar Definición de Acción
              </button>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Análisis de DTOs -->
        <div class="col-lg-7">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white p-0 overflow-hidden">
              <ul class="nav nav-tabs border-bottom-0">
                <li class="nav-item">
                  <button class="nav-link py-3 px-4 fw-bold" [class.active]="activeTab === 'params'" (click)="activeTab = 'params'">PARÁMETROS</button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-3 px-4 fw-bold" [class.active]="activeTab === 'request'" (click)="changeMainTab('request')">REQUEST DTO</button>
                </li>
                <li class="nav-item">
                  <button class="nav-link py-3 px-4 fw-bold" [class.active]="activeTab === 'response'" (click)="changeMainTab('response')">RESPONSE DTO</button>
                </li>
                <li class="nav-item ms-auto me-2 d-flex align-items-center">
                  <button class="btn btn-sm btn-outline-info fw-bold px-3 shadow-sm" 
                          [class.active]="activeTab === 'preview'"
                          (click)="activeTab = 'preview'">
                    <i class="bi bi-eye-fill me-1"></i> VISTA PREVIA UI
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body p-4">
              <!-- Vista Previa UI (SERIALIZADO) -->
              <div *ngIf="activeTab === 'preview'" class="animate-in">
                <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                  <h6 class="fw-bold mb-0 text-uppercase text-info">Previsualización del Componente Generado</h6>
                  <span class="badge bg-info-subtle text-info border border-info">Modo: {{ getComponentType() }}</span>
                </div>

                <!-- Caso GET: Grilla Dinámica -->
                <div *ngIf="method === 'GET'">
                  <div class="card border shadow-none bg-light mb-3">
                    <div class="card-body py-2 d-flex justify-content-between align-items-center">
                      <div class="d-flex gap-2">
                        <input type="text" class="form-control form-control-sm" style="width: 200px" placeholder="Buscar...">
                        <button class="btn btn-sm btn-primary">Filtrar</button>
                      </div>
                      <button *ngIf="availableActions.create" class="btn btn-sm btn-success">+ Nuevo Registro</button>
                    </div>
                  </div>
                  <div class="table-responsive rounded-3 border">
                    <table class="table table-sm table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th *ngFor="let prop of getPreviewTableColumns()" class="small text-uppercase ps-3">{{ prop }}</th>
                          <th *ngIf="availableActions.edit || availableActions.delete" class="text-end pe-3 small text-uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let row of [1,2,3]">
                          <td *ngFor="let prop of getPreviewTableColumns()" class="ps-3 py-2 small text-muted">
                            <span *ngIf="prop === 'id'">{{ serviceId.split('-')[0] | uppercase }}_{{ row }}0{{ row }}</span>
                            <span *ngIf="prop !== 'id'">Dato de ejemplo {{ row }}</span>
                          </td>
                          <td *ngIf="availableActions.edit || availableActions.delete" class="text-end pe-3 py-2">
                            <div class="btn-group">
                              <button *ngIf="availableActions.edit" class="btn btn-xs btn-outline-primary py-0 px-2" title="Editar"><i class="bi bi-pencil"></i></button>
                              <button *ngIf="availableActions.delete" class="btn btn-xs btn-outline-danger py-0 px-2" title="Eliminar"><i class="bi bi-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-3 px-1">
                    <span class="small text-muted">Mostrando 3 de 15 registros</span>
                    <nav><ul class="pagination pagination-sm mb-0">
                      <li class="page-item disabled"><span class="page-link">Ant</span></li>
                      <li class="page-item active"><span class="page-link">1</span></li>
                      <li class="page-item"><span class="page-link">2</span></li>
                      <li class="page-item"><span class="page-link">Sig</span></li>
                    </ul></nav>
                  </div>
                </div>

                <!-- Caso POST/PUT/PATCH: Formulario Dinámico -->
                <div *ngIf="method === 'POST' || method === 'PUT' || method === 'PATCH'">
                  <div class="card border-0 bg-white shadow-sm rounded-4 p-4">
                    <h5 class="fw-bold mb-4">{{ method === 'POST' ? 'Crear' : 'Editar' }} {{ actionName || 'Entidad' }}</h5>
                    <div class="row g-3">
                      <div *ngFor="let prop of getFormFields()" class="col-md-6">
                        <label class="form-label small fw-bold text-muted">{{ prop.key | titlecase }}</label>
                        <input *ngIf="prop.type !== 'boolean'" [type]="prop.type === 'integer' ? 'number' : 'text'" 
                               class="form-control" [placeholder]="'Ingrese ' + prop.key">
                        <div *ngIf="prop.type === 'boolean'" class="form-check form-switch mt-2">
                          <input class="form-check-input" type="checkbox">
                          <label class="form-check-label small">Habilitado</label>
                        </div>
                      </div>
                    </div>
                    <div class="d-flex gap-2 mt-5">
                      <button class="btn btn-light border flex-grow-1">Cancelar</button>
                      <button class="btn btn-primary flex-grow-1 fw-bold">{{ method === 'POST' ? 'Guardar Registro' : 'Actualizar Cambios' }}</button>
                    </div>
                  </div>
                </div>

                <!-- Caso DELETE: Confirmación de Borrado -->
                <div *ngIf="method === 'DELETE'" class="text-center py-4">
                  <div class="icon-circle bg-danger bg-opacity-10 text-danger mx-auto mb-4" style="width: 80px; height: 80px; font-size: 40px">
                    <i class="bi bi-exclamation-triangle"></i>
                  </div>
                  <h4 class="fw-bold">Confirmar Eliminación</h4>
                  <p class="text-muted">Estás a punto de eliminar el registro: <strong class="text-dark">{{ serviceId | uppercase }}_1001</strong></p>
                  
                  <div class="card bg-warning bg-opacity-10 border-warning my-4 mx-auto" style="max-width: 400px">
                    <div class="card-body p-3 small text-start">
                      <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="delType" id="logica" checked>
                        <label class="form-check-label fw-bold" for="logica">Baja Lógica (Recomendado)</label>
                        <div class="text-muted ms-4">Oculta el registro pero mantiene la integridad referencial.</div>
                      </div>
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="delType" id="fisica">
                        <label class="form-check-label fw-bold text-danger" for="fisica">Baja Definitiva</label>
                        <div class="text-muted ms-4">Elimina permanentemente el dato de la base de datos.</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-flex gap-2 justify-content-center mt-4">
                    <button class="btn btn-light border px-4">Cancelar</button>
                    <button class="btn btn-danger px-4 fw-bold">Proceder con la Baja</button>
                  </div>
                </div>
              </div>

              <!-- Contenido Pestaña: Parámetros -->
              <div *ngIf="activeTab === 'params'">
                <div *ngIf="!endpoint?.parameters || endpoint?.parameters?.length === 0" class="text-center py-5 text-muted">
                  <p class="mb-0 italic">No se detectaron parámetros de entrada (query/path).</p>
                </div>
                <div class="list-group list-group-flush" *ngIf="endpoint?.parameters && endpoint?.parameters!.length > 0">
                  <div *ngFor="let p of endpoint?.parameters" class="list-group-item px-0 border-light py-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <span class="badge bg-secondary-subtle text-secondary border me-2">{{ p.in }}</span>
                        <strong class="text-dark">{{ p.name }}</strong>
                      </div>
                      <span class="text-primary small fw-bold font-monospace">{{ p.schema?.type || 'string' }}</span>
                    </div>
                    <p class="small text-muted mt-1 mb-0" *ngIf="p.description">{{ p.description }}</p>
                  </div>
                </div>
              </div>

              <!-- Contenido Pestaña: DTOs -->
              <div *ngIf="activeTab === 'request' || activeTab === 'response'">
                <div *ngIf="detectedDtos.length === 0" class="text-center py-5 text-muted bg-light rounded-3">
                  <p class="mb-0 italic">No se detectaron modelos estructurados para esta sección.</p>
                </div>

                <div *ngIf="detectedDtos.length > 0">
                  <div class="d-flex flex-wrap gap-2 mb-4 border-bottom pb-3">
                    <button *ngFor="let dto of detectedDtos" 
                            (click)="activeDtoId = dto.name"
                            class="btn btn-sm py-1 px-3 rounded-pill"
                            [class.btn-info]="activeDtoId === dto.name"
                            [class.text-white]="activeDtoId === dto.name"
                            [class.btn-outline-secondary]="activeDtoId !== dto.name">
                      {{ dto.name }}
                    </button>
                  </div>

                  <div *ngFor="let dto of detectedDtos">
                    <div *ngIf="activeDtoId === dto.name" class="bg-dark p-4 rounded-4 font-monospace small overflow-auto animate-in shadow-inner" style="max-height: 450px">
                      <div class="mb-1">
                        <span class="text-warning">interface</span> <span class="text-info">{{ dto.name }}</span> <span class="text-white">&#123;</span>
                        <div *ngFor="let prop of dto.properties | keyvalue" class="ms-4 my-1">
                          <span class="text-light">{{ prop.key }}</span><span class="text-white">:</span> 
                          <span [ngClass]="getPropColor(prop.value)">{{ getSimplePropType(prop.value) }}</span><span class="text-white">;</span>
                        </div>
                        <span class="text-white">&#125;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .badge-GET { background-color: #61affe; }
      .badge-POST { background-color: #49cc90; }
      .badge-PUT { background-color: #fca130; }
      .badge-DELETE { background-color: #f93e3e; }
      .badge-PATCH { background-color: #50e3c2; }
      
      .nav-tabs .nav-link { color: #6c757d; border: none; border-bottom: 3px solid transparent; }
      .nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 3px solid #0d6efd; background: transparent; }
      
      .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
      .animate-in { animation: fadeIn 0.3s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .text-primary { color: #61affe !important; }
      .text-success { color: #49cc90 !important; }
      .text-info { color: #50e3c2 !important; }
    </style>
  `
})
export class ActionDefinitionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private middlewareService = inject(MiddlewareService);

  serviceId: string = '';
  path: string = '';
  method: string = '';
  
  endpoint: Endpoint | null = null;
  loading = true;
  error: string | null = null;

  // UI State
  activeTab: 'params' | 'request' | 'response' | 'preview' = 'params';
  actionName: string = '';
  actionDescription: string = '';
  detectedDtos: any[] = [];
  activeDtoId: string = '';
  availableActions = { create: false, edit: false, delete: false };

  ngOnInit() {
    this.serviceId = this.route.snapshot.paramMap.get('id') || '';
    this.path = this.route.snapshot.queryParamMap.get('path') || '';
    this.method = this.route.snapshot.queryParamMap.get('method') || '';
    
    if (!this.serviceId || !this.path || !this.method) {
      this.error = "Faltan parámetros necesarios para identificar el endpoint.";
      this.loading = false;
      return;
    }

    this.loadEndpointDetails();
  }

  loadEndpointDetails() {
    this.loading = true;
    this.middlewareService.inspectService(this.serviceId).subscribe({
      next: (data) => {
        const found = data.endpoints.find((e: Endpoint) => e.path === this.path && e.method === this.method);
        if (found) {
          this.endpoint = found;
          this.actionName = found.configuracion_ui?.label || found.summary || '';
          this.actionDescription = found.configuracion_ui?.description || '';
          
          // Detectar otras acciones activas en el mismo microservicio
          this.availableActions.create = data.endpoints.some((e: any) => e.is_enabled && e.method === 'POST');
          this.availableActions.edit = data.endpoints.some((e: any) => e.is_enabled && (e.method === 'PUT' || e.method === 'PATCH'));
          this.availableActions.delete = data.endpoints.some((e: any) => e.is_enabled && e.method === 'DELETE');
        } else {
          this.error = "No se encontró la definición del endpoint solicitado.";
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = "Error al conectar con el middleware.";
        this.loading = false;
      }
    });
  }

  changeMainTab(tab: 'request' | 'response') {
    this.activeTab = tab;
    this.updateDetectedDtos();
  }

  updateDetectedDtos() {
    const rootDto = this.activeTab === 'request' ? this.endpoint?.request_dto : this.endpoint?.response_dto;
    this.detectedDtos = [];
    if (rootDto) {
      this.extractAllDtos(rootDto);
      if (this.detectedDtos.length > 0) {
        this.activeDtoId = this.detectedDtos[0].name;
      }
    }
  }

  extractAllDtos(dto: any) {
    if (!dto || !dto.name) return;
    if (this.detectedDtos.find(d => d.name === dto.name)) return;
    this.detectedDtos.push(dto);
    if (dto.properties) {
      Object.values(dto.properties).forEach((prop: any) => {
        if (prop.properties) this.extractAllDtos(prop);
        else if (prop.type === 'array' && prop.items?.properties) this.extractAllDtos(prop.items);
      });
    }
  }

  getSimplePropType(prop: any): string {
    if (prop.type === 'array') {
      const itemName = prop.items?.name || prop.items?.type || 'any';
      return `${itemName}[]`;
    }
    return prop.name || prop.type || 'any';
  }

  getPropColor(prop: any): string {
    if (prop.properties || (prop.type === 'array' && prop.items?.properties)) return 'text-info';
    if (prop.type === 'array') return 'text-success';
    return 'text-primary';
  }

  saveDefinition() {
    if (!this.endpoint) return;

    const mapping = {
      backend_service_id: this.serviceId,
      endpoint_path: this.path,
      metodo: this.method,
      frontend_service_id: 'default',
      configuracion_ui: {
        ...this.endpoint.configuracion_ui,
        label: this.actionName,
        description: this.actionDescription,
        parameters: this.endpoint.parameters,
        request_dto: this.endpoint.request_dto,
        response_dto: this.endpoint.response_dto
      }
    };

    this.middlewareService.toggleEndpointMapping(mapping).subscribe({
      next: () => {
        alert('Definición guardada correctamente');
        this.router.navigate(['/inspect', this.serviceId]);
      },
      error: (err) => alert('Error al guardar: ' + err.message)
    });
  }

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }

  // Lógica para Vista Previa UI
  getComponentType(): string {
    if (this.method === 'GET') return 'GRILLA / LISTADO';
    if (this.method === 'POST') return 'FORMULARIO ALTA';
    if (this.method === 'PUT' || this.method === 'PATCH') return 'FORMULARIO EDICIÓN';
    if (this.method === 'DELETE') return 'BORRADO';
    return 'GENÉRICO';
  }

  getPreviewTableColumns(): string[] {
    const responseDto = this.endpoint?.response_dto;
    if (responseDto?.properties) {
      // Si es un listado (tipo RORO), buscamos las propiedades del item del array
      const listProp: any = Object.values(responseDto.properties).find((p: any) => p.type === 'array');
      if (listProp?.items?.properties) {
        return Object.keys(listProp.items.properties).slice(0, 5); // Tomar las primeras 5 columnas
      }
      // Si no es un array, devolvemos las propiedades del objeto directamente
      return Object.keys(responseDto.properties).slice(0, 5);
    }
    return ['id', 'descripcion', 'estado'];
  }

  getFormFields(): { key: string, type: string }[] {
    const dto = (this.method === 'POST' || this.method === 'PUT' || this.method === 'PATCH') 
                ? this.endpoint?.request_dto : this.endpoint?.response_dto;
    
    if (dto?.properties) {
      return Object.entries(dto.properties).map(([k, v]: [string, any]) => ({
        key: k,
        type: v.type || 'string'
      })).filter(f => !['fecha_alta_creacion', 'fecha_alta_modificacion'].includes(f.key)); // No mostrar auditoría en form
    }
    return [{ key: 'id', type: 'string' }, { key: 'descripcion', type: 'string' }];
  }
}

