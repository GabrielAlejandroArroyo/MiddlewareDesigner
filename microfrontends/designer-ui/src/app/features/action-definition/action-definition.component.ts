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
                                   <div *ngIf="getFieldConfig(prop, 'response').refService" class="d-flex align-items-center gap-1">
                                      <span class="badge bg-info-subtle text-info x-small border border-info border-opacity-25">
                                        {{ getFieldConfig(prop, 'response').refService }}
                                      </span>
                                      <span>{{ getFieldConfig(prop, 'response').refDisplay === 'id' ? 'ID_REF' : 'DESCR_REF' }}_{{ row }}</span>
                                   </div>
                                   <div *ngIf="!getFieldConfig(prop, 'response').refService">
                                      <span *ngIf="prop === 'id'">{{ serviceId.split('-')[0] | uppercase }}_{{ row }}0{{ row }}</span>
                                      <span *ngIf="prop !== 'id'">Dato de ejemplo {{ row }}</span>
                                   </div>
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
                               
                               <!-- Campo con Referencia: Se muestra como SELECT -->
                               <div *ngIf="getFieldConfig(prop.key, 'request').refService" class="input-group input-group-sm">
                                 <span class="input-group-text bg-info-subtle text-info border-info border-opacity-25 x-small">
                                   <i class="bi bi-link-45deg"></i>
                                 </span>
                                 <select class="form-select" [disabled]="!prop.editable">
                                   <option value="">Seleccione {{ getFieldConfig(prop.key, 'request').refService }}...</option>
                                   <option value="1">Ejemplo Relacionado 1</option>
                                   <option value="2">Ejemplo Relacionado 2</option>
                                 </select>
                               </div>

                               <!-- Campo Estándar -->
                               <ng-container *ngIf="!getFieldConfig(prop.key, 'request').refService">
                                 <input *ngIf="prop.type !== 'boolean'" [type]="prop.type === 'integer' ? 'number' : 'text'" 
                                        class="form-control" [placeholder]="'Ingrese ' + prop.key"
                                        [disabled]="!prop.editable"
                                        [class.bg-light]="!prop.editable">
                                 <div *ngIf="prop.type === 'boolean'" class="form-check form-switch mt-2">
                                   <input class="form-check-input" type="checkbox" [disabled]="!prop.editable">
                                   <label class="form-check-label small">Habilitado</label>
                                 </div>
                               </ng-container>
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
                       <div class="table-responsive" *ngIf="endpoint?.parameters && endpoint?.parameters!.length > 0">
                         <table class="table table-sm align-middle">
                           <thead>
                             <tr class="small text-muted uppercase">
                               <th>PARÁMETRO</th>
                               <th>UBICACIÓN</th>
                               <th class="text-center">ORDEN</th>
                               <th class="text-center">VISUALIZAR</th>
                               <th class="text-center">EDITABLE</th>
                             </tr>
                           </thead>
                           <tbody>
                             <tr *ngFor="let p of endpoint?.parameters">
                               <td>
                                 <strong class="text-dark">{{ p.name }}</strong>
                                 <div class="x-small text-muted font-monospace">{{ p.schema?.type || 'string' }}</div>
                               </td>
                               <td><span class="badge bg-light text-dark border">{{ p.in }}</span></td>
                               <td class="text-center">
                                 <input type="number" class="form-control form-control-sm text-center mx-auto" 
                                        style="width: 60px"
                                        [(ngModel)]="getFieldConfig(p.name, 'params').order"
                                        placeholder="0">
                               </td>
                               <td class="text-center">
                                 <div class="form-check form-switch d-inline-block">
                                   <input class="form-check-input" type="checkbox" 
                                          [(ngModel)]="getFieldConfig(p.name, 'params').show"
                                          (ngModelChange)="toggleVisibility(p.name, 'params')">
                                 </div>
                               </td>
                               <td class="text-center">
                                 <div class="form-check form-switch d-inline-block">
                                   <input class="form-check-input" type="checkbox" [(ngModel)]="getFieldConfig(p.name, 'params').editable">
                                 </div>
                               </td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                     </div>

                     <!-- Contenido Pestaña: Request o Response DTO con Subpestañas -->
                     <div *ngIf="activeTab === 'request' || activeTab === 'response'">
                       <h6 class="fw-bold mb-3 small text-uppercase text-muted">
                         {{ activeTab === 'request' ? 'Modelo de Entrada' : 'Modelo de Salida' }}
                       </h6>
                       
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
                           <div *ngIf="activeDtoId === dto.name" class="animate-in">
                             <div class="table-responsive border rounded-3 overflow-hidden">
                               <table class="table table-hover align-middle mb-0">
                                 <thead class="table-dark small">
                                   <tr>
                                     <th class="ps-3">ATRIBUTO</th>
                                     <th>TIPO</th>
                                     <th class="text-center" style="width: 100px">ORDEN</th>
                                     <th class="text-center" style="width: 100px">VISUALIZAR</th>
                                     <th class="text-center" style="width: 100px" *ngIf="activeTab === 'request'">EDITABLE</th>
                                     <th style="width: 250px">REFERENCIA EXTERNA (DEPENDE DE)</th>
                                   </tr>
                                 </thead>
                                 <tbody class="small">
                                   <tr *ngFor="let prop of dto.properties | keyvalue">
                                     <td class="ps-3">
                                       <span class="fw-bold">{{ prop.key }}</span>
                                     </td>
                                     <td>
                                       <span [ngClass]="getPropColor(prop.value)">{{ getSimplePropType(prop.value) }}</span>
                                     </td>
                                     <td class="text-center">
                                       <input type="number" class="form-control form-control-sm text-center mx-auto" 
                                              style="width: 60px"
                                              [(ngModel)]="getFieldConfig(prop.key, activeTab).order"
                                              placeholder="0">
                                     </td>
                                     <td class="text-center">
                                       <div class="form-check form-switch d-inline-block">
                                         <input class="form-check-input" type="checkbox" 
                                                [(ngModel)]="getFieldConfig(prop.key, activeTab).show"
                                                (ngModelChange)="toggleVisibility(prop.key, activeTab)">
                                       </div>
                                     </td>
                                     <td class="text-center" *ngIf="activeTab === 'request'">
                                       <div class="form-check form-switch d-inline-block">
                                         <input class="form-check-input" type="checkbox" 
                                                [(ngModel)]="getFieldConfig(prop.key, activeTab).editable">
                                       </div>
                                     </td>
                                     <td>
                                       <div class="d-flex gap-1">
                                         <select class="form-select form-select-sm" 
                                                 [(ngModel)]="getFieldConfig(prop.key, activeTab).refService">
                                           <option [value]="null">Sin referencia</option>
                                           <option *ngFor="let s of allServices" [value]="s.id">{{ s.id }}</option>
                                         </select>
                                         <select *ngIf="getFieldConfig(prop.key, activeTab).refService" 
                                                 class="form-select form-select-sm" 
                                                 style="width: 100px"
                                                 [(ngModel)]="getFieldConfig(prop.key, activeTab).refDisplay">
                                           <option value="id">Mostrar ID</option>
                                           <option value="desc">Mostrar Descr.</option>
                                         </select>
                                       </div>
                                     </td>
                                   </tr>
                                 </tbody>
                               </table>
                             </div>
                             
                             <!-- Vista Código (Opcional/Colapsable) -->
                             <div class="mt-3">
                               <button class="btn btn-sm btn-link p-0 text-decoration-none x-small" (click)="showCode = !showCode">
                                 {{ showCode ? 'Ocultar' : 'Ver' }} definición de interface
                               </button>
                               <div *ngIf="showCode" class="bg-dark p-3 rounded mt-2 font-monospace x-small text-white shadow-inner overflow-auto" style="max-height: 200px">
                                 <span class="text-warning">interface</span> <span class="text-info">{{ dto.name }}</span> &#123;<br>
                                 <div *ngFor="let prop of dto.properties | keyvalue" class="ms-3">
                                   {{ prop.key }}: <span [ngClass]="getPropColor(prop.value)">{{ getSimplePropType(prop.value) }}</span>;
                                 </div>
                                 &#125;
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
    </div>
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
  allServices: any[] = [];
  loading = true;
  error: string | null = null;

  // UI State
  activeTab: 'params' | 'request' | 'response' | 'preview' = 'params';
  actionName: string = '';
  actionDescription: string = '';
  detectedDtos: any[] = [];
  activeDtoId: string = '';
  availableActions = { create: false, edit: false, delete: false };
  showCode = false;

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
    this.loadAllServices();
  }

  loadAllServices() {
    this.middlewareService.getBackendServices().subscribe(data => {
      this.allServices = data.filter(s => s.id !== this.serviceId); // No referenciarse a sí mismo
    });
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
          
          // Asegurar que exista la configuración de campos
          if (!found.configuracion_ui) found.configuracion_ui = {};
          if (!found.configuracion_ui.fields_config) {
            found.configuracion_ui.fields_config = {
              params: {},
              request: {},
              response: {}
            };
          }

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

  getPropertyConfig(propKey: string, type: 'params' | 'request' | 'response' | string): any {
    const config = this.endpoint?.configuracion_ui?.fields_config;
    if (!config) return { show: true, editable: true, order: 0 };
    
    const category = type === 'params' ? 'params' : (type === 'request' ? 'request' : 'response');
    
    if (!config[category]) {
      config[category] = {};
    }

    if (!config[category][propKey]) {
      // Al inicializar un campo por primera vez, si no tiene orden, 
      // le asignamos el siguiente número disponible para que sea >= 1
      const existingFields = Object.values(config[category]) as any[];
      const maxOrder = existingFields.reduce((max, f) => Math.max(max, f.order || 0), 0);
      
      config[category][propKey] = {
        show: true,
        editable: category !== 'response',
        order: maxOrder + 1,
        refService: null,
        refDisplay: 'id'
      };
    }

    return config[category][propKey];
  }

  getFieldConfig(propKey: any, type: string): any {
    return this.getPropertyConfig(String(propKey), type);
  }

  toggleVisibility(propKey: any, type: string) {
    const key = String(propKey);
    const category = type === 'params' ? 'params' : (type === 'request' ? 'request' : 'response');
    const fieldsConfig = this.endpoint?.configuracion_ui?.fields_config?.[category];
    if (!fieldsConfig) return;

    const currentField = fieldsConfig[key];
    if (!currentField) return;

    if (currentField.show) {
      // Si se activa, asignar el siguiente número correlativo al final
      const activeFields = Object.values(fieldsConfig).filter((f: any) => f.show && f !== currentField);
      const maxOrder = activeFields.reduce((max: number, f: any) => Math.max(max, f.order || 0), 0);
      currentField.order = maxOrder + 1;
    } else {
      // Si se desactiva, poner en 0 y reordenar todos los demás activos para que sean correlativos
      currentField.order = 0;
      
      const activeFields = (Object.entries(fieldsConfig) as [string, any][])
        .filter(([k, config]) => config.show)
        .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
      
      activeFields.forEach(([k, config], index) => {
        config.order = index + 1;
      });
    }
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
    const ep = this.endpoint;
    if (!ep) return;

    const mapping = {
      backend_service_id: this.serviceId,
      endpoint_path: this.path,
      metodo: this.method,
      frontend_service_id: 'default',
      configuracion_ui: {
        ...ep.configuracion_ui,
        label: this.actionName,
        description: this.actionDescription,
        parameters: ep.parameters,
        request_dto: ep.request_dto,
        response_dto: ep.response_dto
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
    const config = this.endpoint?.configuracion_ui?.fields_config?.response || {};
    
    let columns: string[] = [];
    if (responseDto && responseDto.properties) {
      // Si es un listado (tipo RORO), buscamos las propiedades del item del array
      const listProp: any = Object.values(responseDto.properties).find((p: any) => p.type === 'array');
      if (listProp && listProp.items && listProp.items.properties) {
        columns = Object.keys(listProp.items.properties);
      } else {
        // Si no es un array, devolvemos las propiedades del objeto directamente
        columns = Object.keys(responseDto.properties);
      }
    } else {
      columns = ['id', 'descripcion', 'estado'];
    }

    // Filtrar según configuración de visibilidad y ordenar
    return columns
      .filter(col => config[col]?.show !== false)
      .sort((a, b) => (config[a]?.order || 0) - (config[b]?.order || 0))
      .slice(0, 5);
  }

  getFormFields(): { key: string, type: string, editable: boolean }[] {
    const ep = this.endpoint;
    if (!ep) return [];

    const dto = (this.method === 'POST' || this.method === 'PUT' || this.method === 'PATCH') 
                ? ep.request_dto : ep.response_dto;
    const config = ep.configuracion_ui?.fields_config?.request || {};
    
    if (dto && dto.properties) {
      return Object.entries(dto.properties)
        .map(([k, v]: [string, any]) => ({
          key: k,
          type: v.type || 'string',
          editable: config[k]?.editable !== false,
          order: config[k]?.order || 0
        }))
        .filter(f => !['fecha_alta_creacion', 'fecha_alta_modificacion'].includes(f.key)) // Auditoría siempre fuera
        .filter(f => config[f.key]?.show !== false) // Filtrar por visibilidad
        .sort((a, b) => a.order - b.order); // Ordenar por propiedad order
    }
    return [
      { key: 'id', type: 'string', editable: true }, 
      { key: 'descripcion', type: 'string', editable: true }
    ];
  }
}

