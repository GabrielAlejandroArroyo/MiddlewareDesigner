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

      <div *ngIf="endpoint && !loading">
        <!-- Propiedades de la Acción (Colapsable y arriba) -->
        <div class="card shadow-sm border-0 mb-4 overflow-hidden">
          <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center cursor-pointer" 
               (click)="propertiesCollapsed = !propertiesCollapsed">
            <h5 class="mb-0 fw-bold">
              <i class="bi" [ngClass]="propertiesCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'"></i>
              Propiedades de la Acción
            </h5>
            <div *ngIf="propertiesCollapsed" class="text-muted small">
              {{ actionName || 'Sin nombre' }} - {{ actionDescription | slice:0:50 }}{{ actionDescription.length > 50 ? '...' : '' }}
            </div>
            <button *ngIf="hasChanges()" (click)="$event.stopPropagation(); saveDefinition()" 
                    class="btn btn-primary btn-sm shadow-sm fw-bold">
              Guardar Cambios
            </button>
          </div>
          <div class="card-body border-top" [hidden]="propertiesCollapsed">
            <div class="row">
              <div class="col-md-5">
                <label class="form-label small fw-bold text-uppercase text-muted">Nombre de la Acción / Pantalla</label>
                <input type="text" class="form-control" [(ngModel)]="actionName" 
                       placeholder="Ej: Alta de Nuevo País">
                <div class="form-text">Este nombre se usará como título en la interfaz generada.</div>
              </div>
              <div class="col-md-7">
                <label class="form-label small fw-bold text-uppercase text-muted">Descripción del Proceso</label>
                <textarea class="form-control" rows="2" [(ngModel)]="actionDescription"
                          placeholder="Describe brevemente qué hace esta acción..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Contenedor Principal: DTOs y Preview -->
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white p-0 overflow-hidden">
            <div class="px-4 pt-3 pb-2 border-bottom bg-light bg-opacity-50">
              <h6 class="mb-0 fw-bold text-secondary text-uppercase small">
                <i class="bi bi-sliders2-vertical me-2 text-primary"></i>
                Customización de Acción: Parámetros, Request y Response
              </h6>
              <button class="btn btn-xs btn-outline-warning fw-bold ms-auto py-0 px-2" 
                      (click)="refreshSwagger()" 
                      [disabled]="loading || refreshingSwagger"
                      title="Limpia caché y relee el contrato OpenAPI">
                <i class="bi" [ngClass]="refreshingSwagger ? 'bi-arrow-repeat spin' : 'bi-trash-fill'"></i>
                {{ refreshingSwagger ? 'REFRESCANDO...' : 'LIMPIAR CACHÉ SWAGGER' }}
              </button>
            </div>
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
              <li class="nav-item ms-auto me-2 d-flex align-items-center gap-2">
                <button *ngIf="hasChanges()" (click)="saveDefinition()" class="btn btn-sm btn-primary fw-bold shadow-sm px-3">
                  <i class="bi bi-save me-1"></i> GUARDAR DEFINICIÓN
                </button>
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
                       <div *ngIf="hasGridData()">
                         <div class="card border shadow-none bg-light mb-3">
                           <div class="card-body py-2 d-flex justify-content-between align-items-center">
                             <div class="d-flex gap-2">
                               <input type="text" class="form-control form-control-sm" style="width: 200px" placeholder="Buscar...">
                               <button class="btn btn-sm btn-primary">Filtrar</button>
                             </div>
                             <button *ngIf="endpoint?.configuracion_ui?.linked_actions?.create" class="btn btn-sm btn-success shadow-sm fw-bold">
                               <i class="bi bi-plus-lg me-1"></i> Crear Nuevo Registro
                             </button>
                           </div>
                         </div>
                         <div class="table-responsive rounded-3 border">
                           <table class="table table-sm table-hover mb-0">
                             <thead class="table-light">
                               <tr>
                                 <th *ngFor="let prop of getPreviewTableColumns()" class="small text-uppercase ps-3">{{ prop.label }}</th>
                                 <th *ngIf="endpoint?.configuracion_ui?.linked_actions?.edit || endpoint?.configuracion_ui?.linked_actions?.delete || endpoint?.configuracion_ui?.linked_actions?.view" class="text-end pe-3 small text-uppercase">Acciones</th>
                               </tr>
                             </thead>
                             <tbody>
                               <tr *ngFor="let row of [1,2,3]">
                                 <td *ngFor="let prop of getPreviewTableColumns()" class="ps-3 py-2 small text-muted">
                                   <div *ngIf="getFieldConfig(prop.key, 'response').refService">
                                      <span class="fw-bold ref-underline cursor-help" 
                                            [title]="'Referencia a servicio: ' + getFieldConfig(prop.key, 'response').refService">
                                        {{ getFieldConfig(prop.key, 'response').refDisplay === 'id' ? 'ID_REF' : 'DESCR_REF' }}_{{ row }}
                                      </span>
                                   </div>
                                   <div *ngIf="!getFieldConfig(prop.key, 'response').refService">
                                      <span *ngIf="prop.key === 'id'">{{ serviceId.split('-')[0] | uppercase }}_{{ row }}0{{ row }}</span>
                                      <span *ngIf="prop.key !== 'id'">Dato de ejemplo {{ row }}</span>
                                   </div>
                                 </td>
                                 <td *ngIf="endpoint?.configuracion_ui?.linked_actions?.edit || endpoint?.configuracion_ui?.linked_actions?.delete || endpoint?.configuracion_ui?.linked_actions?.view" class="text-end pe-3 py-2">
                                   <div class="btn-group shadow-sm">
                                     <button *ngIf="endpoint?.configuracion_ui?.linked_actions?.view" class="btn btn-xs btn-outline-info py-0 px-2" title="Visualizar (Solo Lectura)">
                                       <i class="bi bi-eye"></i>
                                     </button>
                                     <button *ngIf="endpoint?.configuracion_ui?.linked_actions?.edit" class="btn btn-xs btn-outline-primary py-0 px-2" title="Editar / Actualizar">
                                       <i class="bi bi-pencil"></i>
                                     </button>
                                     <button *ngIf="endpoint?.configuracion_ui?.linked_actions?.delete" class="btn btn-xs btn-outline-danger py-0 px-2" title="Eliminar Registro">
                                       <i class="bi bi-trash"></i>
                                     </button>
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

                       <!-- Caso POST/PUT/PATCH/GET(Individual): Formulario Dinámico -->
                       <div *ngIf="method !== 'GET' || (method === 'GET' && !hasGridData())">
                         <div class="card border-0 bg-white shadow-sm rounded-4 p-4">
                           <h5 class="fw-bold mb-4">
                             {{ method === 'POST' ? 'Crear' : (method === 'GET' ? 'Consultar' : 'Editar') }} {{ actionName || 'Entidad' }}
                           </h5>
                           <div class="row g-3">
                             <div *ngFor="let prop of getFormFields()" class="col-md-6">
                               <label class="form-label small fw-bold text-muted">
                                 {{ prop.label }}
                                 <span *ngIf="getFieldConfig(prop.key, 'request').required" class="text-danger">*</span>
                               </label>
                               
                               <!-- Campo con Referencia: Se muestra como SELECT -->
                               <div *ngIf="getFieldConfig(prop.key, 'request').refService" class="input-group input-group-sm">
                                 <span class="input-group-text bg-info-subtle text-info border-info border-opacity-25 x-small">
                                   <i class="bi bi-link-45deg"></i>
                                 </span>
                                 <select class="form-select" [disabled]="!prop.editable" [title]="'Atributo técnico: ' + prop.key">
                                   <option value="">Seleccione {{ getFieldConfig(prop.key, 'request').refService }}...</option>
                                   <option value="1">Ejemplo Relacionado 1</option>
                                   <option value="2">Ejemplo Relacionado 2</option>
                                 </select>
                               </div>
                               <div *ngIf="getFieldConfig(prop.key, 'request').dependsOn" class="x-small text-info mt-1 animate-in">
                                 <i class="bi bi-funnel-fill"></i> Filtra según selección de <strong>{{ getFieldConfig(prop.key, 'request').dependsOn }}</strong>
                               </div>

                               <!-- Campo Estándar -->
                               <ng-container *ngIf="!getFieldConfig(prop.key, 'request').refService">
                                 <input *ngIf="prop.type !== 'boolean'" [type]="prop.type === 'integer' ? 'number' : 'text'" 
                                        class="form-control" [placeholder]="'Ingrese ' + prop.label"
                                        [disabled]="!prop.editable"
                                        [class.bg-light]="!prop.editable"
                                        [title]="'Atributo técnico: ' + prop.key">
                                 <div *ngIf="prop.type === 'boolean'" class="form-check form-switch mt-2">
                                   <input class="form-check-input" type="checkbox" [disabled]="!prop.editable" [title]="'Atributo técnico: ' + prop.key">
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
                       <!-- ... existing content ... -->
                     </div>


                     <!-- Contenido Pestaña: Parámetros (Path/Query) -->
                     <div *ngIf="activeTab === 'params'" class="animate-in">
                       <div *ngIf="endpoint?.parameters?.length === 0" class="text-center py-5 text-muted bg-light rounded-3">
                         <i class="bi bi-info-circle fs-2 d-block mb-3 opacity-50"></i>
                         <p class="mb-0">Este endpoint no requiere parámetros adicionales en la URL.</p>
                       </div>
                       
                       <div *ngIf="endpoint?.parameters?.length! > 0" class="table-responsive border rounded-3 overflow-hidden">
                         <table class="table table-hover align-middle mb-0">
                           <thead class="table-dark small">
                             <tr>
                               <th class="ps-3">NOMBRE</th>
                               <th>UBICACIÓN</th>
                               <th>TIPO</th>
                               <th>REQUERIDO</th>
                               <th class="text-center">ORDEN</th>
                               <th class="text-center">MOSTRAR</th>
                             </tr>
                           </thead>
                           <tbody class="small">
                             <tr *ngFor="let param of endpoint?.parameters">
                               <td class="ps-3">
                                 <span class="fw-bold">{{ param.name }}</span>
                                 <div class="x-small text-muted">{{ param.description }}</div>
                               </td>
                               <td><span class="badge bg-secondary-subtle text-secondary border uppercase">{{ param.in }}</span></td>
                               <td><span class="text-primary">{{ param.schema?.type || 'string' }}</span></td>
                               <td>
                                 <span *ngIf="param.required" class="badge bg-danger-subtle text-danger border">SÍ</span>
                                 <span *ngIf="!param.required" class="badge bg-light text-muted border">NO</span>
                               </td>
                               <td class="text-center">
                                 <input type="number" class="form-control form-control-sm text-center mx-auto" 
                                        style="width: 60px"
                                        [(ngModel)]="getFieldConfig(param.name, 'params').order">
                               </td>
                               <td class="text-center">
                                 <div class="form-check form-switch d-inline-block">
                                   <input class="form-check-input" type="checkbox" 
                                          [(ngModel)]="getFieldConfig(param.name, 'params').show"
                                          (ngModelChange)="toggleVisibility(param.name, 'params')">
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
                                      <th class="ps-3">ATRIBUTO TÉCNICO</th>
                                      <th>ATRIBUTO VISUALIZABLE</th>
                                      <th>TIPO</th>
                                      <th class="text-center" style="width: 80px">ORDEN</th>
                                     <th class="text-center" style="width: 80px">VISUALIZAR</th>
                                     <th class="text-center" style="width: 80px" *ngIf="activeTab === 'request'">EDITABLE</th>
                                     <th class="text-center" style="width: 80px" *ngIf="activeTab === 'request'">OBLIG.</th>
                                     <th class="text-center" style="width: 80px" *ngIf="activeTab === 'request'">ÚNICO</th>
                                     <th style="width: 250px">REFERENCIA EXTERNA (DEPENDE DE)</th>
                                   </tr>
                                 </thead>
                                 <tbody class="small">
                                    <tr *ngFor="let prop of (dto.properties | keyvalue); trackBy: trackByProp">
                                      <td class="ps-3" style="min-width: 250px; background-color: #ffffff;">
                                        <div class="d-flex align-items-center mb-1">
                                          <i class="bi bi-tag-fill me-2 text-primary opacity-75"></i>
                                          <span class="fw-bold text-dark">{{ prop.key }}</span>
                                        </div>
                                        <div class="x-small text-muted italic ps-4" *ngIf="asAny(prop.value).description">
                                          {{ asAny(prop.value).description }}
                                        </div>
                                      </td>
                                      <td style="background-color: #ffffff;">
                                        <input type="text" class="form-control form-control-sm border-info border-opacity-25" 
                                               [ngModel]="getFieldConfig(prop.key, activeTab).visualName"
                                               (ngModelChange)="getFieldConfig(prop.key, activeTab).visualName = $event"
                                               [placeholder]="prop.key">
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
                                     <td class="text-center" *ngIf="activeTab === 'request'">
                                       <div class="form-check form-switch d-inline-block">
                                         <input class="form-check-input" type="checkbox" 
                                                [(ngModel)]="getFieldConfig(prop.key, activeTab).required">
                                       </div>
                                     </td>
                                     <td class="text-center" *ngIf="activeTab === 'request'">
                                       <div class="form-check form-switch d-inline-block">
                                         <input class="form-check-input" type="checkbox" 
                                                [(ngModel)]="getFieldConfig(prop.key, activeTab).unique">
                                       </div>
                                     </td>
                                     <td>
                                       <div class="d-flex flex-column gap-1">
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
                                         <!-- Dependencia: Solo si tiene referencia y hay otros campos que podrían ser padres -->
                                         <div *ngIf="getFieldConfig(prop.key, activeTab).refService" class="animate-in">
                                           <select class="form-select form-select-sm x-small bg-light" 
                                                   [(ngModel)]="getFieldConfig(prop.key, activeTab).dependsOn">
                                             <option [value]="null">Sin dependencia</option>
                                             <ng-container *ngFor="let otherProp of dto.properties | keyvalue">
                                                <option *ngIf="otherProp.key !== prop.key" [value]="otherProp.key">
                                                  Filtrar por: {{ otherProp.key }}
                                                </option>
                                             </ng-container>
                                           </select>
                                         </div>
                                       </div>
                                     </td>
                                   </tr>
                                 </tbody>
                               </table>
                             </div>
                             
                             <!-- SECCIÓN VINCULAR ACCIONES (Solo en Response DTO y para Grillas/Objetos) -->
                             <div *ngIf="activeTab === 'response' && activeDtoId === dto.name" class="card border-0 bg-light shadow-sm rounded-4 mt-5 p-4">
                               <div class="d-flex align-items-center mb-4 border-bottom pb-3">
                                 <div class="icon-circle bg-primary text-white me-3 shadow-sm" style="width: 45px; height: 45px; font-size: 1.2rem">
                                   <i class="bi bi-link-45deg"></i>
                                 </div>
                                 <div>
                                   <h5 class="fw-bold mb-0">Vinculación de Acciones sobre {{ dto.name }}</h5>
                                   <p class="text-muted small mb-0">Configura acciones que operan sobre los datos visualizados en la grilla o detalle.</p>
                                 </div>
                               </div>

                               <!-- Configuración de Campo ID (Crucial para acciones vinculadas) -->
                               <div class="row align-items-center mb-4 px-2 bg-white rounded-3 border p-3">
                                 <div class="col-md-7">
                                   <h6 class="fw-bold mb-1"><i class="bi bi-key-fill me-2 text-warning"></i>Identificador Principal (Primary Key)</h6>
                                   <p class="text-muted x-small mb-0">Selecciona el atributo técnico que identifica unívocamente al registro para poder Editar, Eliminar o Ver Detalle.</p>
                                 </div>
                                 <div class="col-md-5">
                                   <select class="form-select fw-bold border-warning shadow-sm" [(ngModel)]="endpoint!.configuracion_ui.linked_actions.id_field">
                                     <option *ngFor="let prop of (dto.properties | keyvalue)" [value]="prop.key">
                                       {{ prop.key }} ({{ getSimplePropType(prop.value) }})
                                     </option>
                                   </select>
                                   <div *ngIf="!endpoint!.configuracion_ui.linked_actions.id_field" class="text-danger x-small mt-1 fw-bold animate-in">
                                     <i class="bi bi-exclamation-triangle me-1"></i> Se requiere un ID para habilitar acciones.
                                   </div>
                                 </div>
                               </div>

                               <div class="row g-4">
                                 <div class="col-md-3">
                                   <label class="form-label x-small text-muted fw-bold mb-1 text-uppercase">Crear (POST)</label>
                                   <select class="form-select form-select-sm" [(ngModel)]="endpoint!.configuracion_ui.linked_actions.create">
                                     <option [value]="null">Deshabilitado</option>
                                     <option *ngFor="let ep of getEndpointsByMethod('POST')" [value]="ep.path">{{ ep.path }}</option>
                                   </select>
                                 </div>
                                 <div class="col-md-3">
                                   <label class="form-label x-small text-muted fw-bold mb-1 text-uppercase">Editar (PUT/PATCH)</label>
                                   <select class="form-select form-select-sm" [(ngModel)]="endpoint!.configuracion_ui.linked_actions.edit">
                                     <option [value]="null">Deshabilitado</option>
                                     <option *ngFor="let ep of getEndpointsByMethod(['PUT', 'PATCH'])" [value]="ep.path">{{ ep.path }}</option>
                                   </select>
                                 </div>
                                 <div class="col-md-3">
                                   <label class="form-label x-small text-muted fw-bold mb-1 text-uppercase">Eliminar (DELETE)</label>
                                   <select class="form-select form-select-sm" [(ngModel)]="endpoint!.configuracion_ui.linked_actions.delete">
                                     <option [value]="null">Deshabilitado</option>
                                     <option *ngFor="let ep of getEndpointsByMethod('DELETE')" [value]="ep.path">{{ ep.path }}</option>
                                   </select>
                                 </div>
                                 <div class="col-md-3">
                                   <label class="form-label x-small text-muted fw-bold mb-1 text-uppercase">Ver (GET BY ID)</label>
                                   <select class="form-select form-select-sm" [(ngModel)]="endpoint!.configuracion_ui.linked_actions.view">
                                     <option [value]="null">Deshabilitado</option>
                                     <option *ngFor="let ep of getEndpointsByMethod('GET', true)" [value]="ep.path">{{ ep.path }}</option>
                                   </select>
                                 </div>
                               </div>
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
  serviceEndpoints: Endpoint[] = []; // Todos los endpoints del servicio para vinculación
  allServices: any[] = [];
  loading = true;
  refreshingSwagger = false;
  error: string | null = null;

  // UI State
  activeTab: 'params' | 'request' | 'response' | 'preview' = 'params';
  actionName: string = '';
  actionDescription: string = '';
  detectedDtos: any[] = [];
  activeDtoId: string = '';
  availableActions = { create: false, edit: false, delete: false };
  showCode = false;
  propertiesCollapsed = true;

  // Change Detection
  initialState: string = '';

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

  refreshSwagger() {
    if (!this.serviceId || this.refreshingSwagger) return;
    
    this.refreshingSwagger = true;
    this.middlewareService.refreshSwagger(this.serviceId, true).subscribe({
      next: () => {
        // Después de refrescar en el middleware, recargamos los detalles aquí
        this.loadEndpointDetails();
        this.refreshingSwagger = false;
        // Opcional: mostrar notificación pequeña
      },
      error: (err) => {
        alert('Error al refrescar caché: ' + (err.error?.detail || err.message));
        this.refreshingSwagger = false;
      }
    });
  }

  loadEndpointDetails() {
    this.loading = true;
    this.middlewareService.inspectService(this.serviceId).subscribe({
      next: (data) => {
        this.serviceEndpoints = data.endpoints || [];
        const found = data.endpoints.find((e: Endpoint) => e.path === this.path && e.method === this.method);
        if (found) {
          this.endpoint = found;
          this.serviceEndpoints = data.endpoints; // Guardar todos los endpoints
          this.actionName = found.configuracion_ui?.label || found.summary || '';
          this.actionDescription = found.configuracion_ui?.description || '';
          
          // Asegurar que exista la configuración de campos y acciones vinculadas
          if (!found.configuracion_ui) found.configuracion_ui = {};
          if (!found.configuracion_ui.fields_config) {
            found.configuracion_ui.fields_config = {
              params: {},
              request: {},
              response: {}
            };
          }

          if (!found.configuracion_ui.linked_actions) {
            found.configuracion_ui.linked_actions = {
              create: null,
              edit: null,
              delete: null,
              view: null,
              id_field: 'id'
            };

            // Intentar encontrar un ID mejor si 'id' no existe en las propiedades de la respuesta
            const itemProps = this.getItemProperties();
            if (itemProps && !itemProps['id']) {
              const idLike = Object.keys(itemProps).find(k => k.toLowerCase().includes('id'));
              if (idLike) found.configuracion_ui.linked_actions.id_field = idLike;
            }
          }

          // Detectar otras acciones activas en el mismo microservicio
          this.availableActions.create = data.endpoints.some((e: any) => e.is_enabled && e.method === 'POST');
          this.availableActions.edit = data.endpoints.some((e: any) => e.is_enabled && (e.method === 'PUT' || e.method === 'PATCH'));
          this.availableActions.delete = data.endpoints.some((e: any) => e.is_enabled && e.method === 'DELETE');

          this.captureInitialState();
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

  captureInitialState() {
    this.initialState = JSON.stringify({
      name: this.actionName,
      desc: this.actionDescription,
      config: this.endpoint?.configuracion_ui?.fields_config,
      linked: this.endpoint?.configuracion_ui?.linked_actions
    });
  }

  hasChanges(): boolean {
    const currentState = JSON.stringify({
      name: this.actionName,
      desc: this.actionDescription,
      config: this.endpoint?.configuracion_ui?.fields_config,
      linked: this.endpoint?.configuracion_ui?.linked_actions
    });
    return this.initialState !== currentState;
  }

  getPropertyConfig(propKey: string, type: string): any {
    if (!this.endpoint) return { show: true, editable: true, order: 0, visualName: propKey };
    
    // Asegurar estructura básica de configuracion_ui
    if (!this.endpoint.configuracion_ui) this.endpoint.configuracion_ui = {};
    if (!this.endpoint.configuracion_ui.fields_config) {
      this.endpoint.configuracion_ui.fields_config = { params: {}, request: {}, response: {} };
    }

    const config = this.endpoint.configuracion_ui.fields_config;
    const category = type === 'params' ? 'params' : (type === 'request' ? 'request' : 'response');
    
    if (!config[category]) config[category] = {};

    // Si el campo no existe en la configuración, lo inicializamos con valores seguros
    if (!config[category][propKey]) {
      config[category][propKey] = {
        show: true,
        editable: true,
        required: false,
        unique: false,
        order: 99,
        visualName: propKey,
        refService: null,
        refDisplay: 'id',
        dependsOn: null
      };
    }

    // Asegurar que siempre tenga un visualName para evitar campos vacíos
    if (!config[category][propKey].visualName) {
      config[category][propKey].visualName = propKey;
    }

    return config[category][propKey];
  }

  getFieldConfig(propKey: any, type: string): any {
    return this.getPropertyConfig(String(propKey || 'unknown'), type);
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
    if (!this.endpoint) return;
    
    const rootDto = this.activeTab === 'request' ? this.endpoint.request_dto : this.endpoint.response_dto;
    this.detectedDtos = [];
    
    if (rootDto) {
      console.log('Procesando DTO Raíz:', rootDto);
      this.extractAllDtos(rootDto, rootDto.name || 'DTO');
      
      if (this.detectedDtos.length > 0) {
        // Seleccionamos el DTO que tenga propiedades
        const withProps = this.detectedDtos.filter(d => d.properties && Object.keys(d.properties).length > 0);
        if (withProps.length > 0) {
          this.activeDtoId = withProps[0].name;
        } else {
          this.activeDtoId = this.detectedDtos[0].name;
        }
      }
    }
  }

  extractAllDtos(dto: any, name: string) {
    if (!dto || typeof dto !== 'object') return;
    
    const dtoName = dto.name || name;
    if (this.detectedDtos.find(d => d.name === dtoName)) return;

    // Caso de Objeto con Propiedades
    if (dto.properties) {
      const cleanProps: any = {};
      Object.entries(dto.properties).forEach(([key, value]) => {
        if (key && key !== 'null' && key !== 'undefined') {
          cleanProps[key] = value;
        }
      });

      if (Object.keys(cleanProps).length > 0) {
        this.detectedDtos.push({
          name: dtoName,
          type: 'object',
          properties: cleanProps
        });

        // Recursión sobre las propiedades
        Object.entries(cleanProps).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            if (value.properties) {
              this.extractAllDtos(value, key);
            } else if (value.type === 'array' && value.items) {
              this.extractAllDtos(value.items, key);
            }
          }
        });
      }
    } 
    // Caso de Array (saltar al contenido)
    else if (dto.type === 'array' && dto.items) {
      this.extractAllDtos(dto.items, dtoName.replace('[]', ''));
    }
  }

  // Helpers para DTOs
  hasGridData(): boolean {
    if (this.method !== 'GET') return false;
    const responseDto = this.endpoint?.response_dto;
    if (!responseDto || !responseDto.properties) return false;
    // Buscar si alguna propiedad es un array (patrón de lista de entidades)
    return Object.values(responseDto.properties).some((p: any) => p.type === 'array');
  }

  getItemProperties(): any {
    const responseDto = this.endpoint?.response_dto;
    if (!responseDto || !responseDto.properties) return {};

    // Si es una grilla (lista), buscar la propiedad que es un array
    const listProp: any = Object.values(responseDto.properties).find((p: any) => p.type === 'array');
    
    if (listProp && listProp.items && listProp.items.properties) {
      return listProp.items.properties;
    }
    
    return responseDto.properties;
  }

  getSimplePropType(prop: any): string {
    if (!prop) return 'unknown';
    if (prop.type === 'array') {
      const itemName = prop.items?.name || prop.items?.type || 'any';
      return `${itemName}[]`;
    }
    if (prop.properties || prop.type === 'object') {
      return prop.name || 'Object';
    }
    const type = prop.type || 'string';
    const format = prop.format ? `(${prop.format})` : '';
    return `${type}${format}`;
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
        // Actualizar el estado inicial después de guardar
        this.captureInitialState();
        this.router.navigate(['/inspect', this.serviceId]);
      },
      error: (err) => alert('Error al guardar: ' + err.message)
    });
  }

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }

  trackByProp(index: number, item: any): string {
    return item.key;
  }

  asAny(val: any): any {
    return val;
  }

  // Helper para filtrar endpoints por método
  getEndpointsByMethod(methods: string | string[], mustHavePathParams: boolean = false): Endpoint[] {
    const methodList = Array.isArray(methods) ? methods : [methods];
    return this.serviceEndpoints.filter(ep => {
      const matchMethod = methodList.includes(ep.method);
      if (!matchMethod) return false;
      
      if (mustHavePathParams) {
        return ep.path.includes('{');
      }
      return true;
    });
  }

  // Lógica para Vista Previa UI
  getComponentType(): string {
    if (this.method === 'GET') return 'GRILLA / LISTADO';
    if (this.method === 'POST') return 'FORMULARIO ALTA';
    if (this.method === 'PUT' || this.method === 'PATCH') return 'FORMULARIO EDICIÓN';
    if (this.method === 'DELETE') return 'BORRADO';
    return 'GENÉRICO';
  }

  getPreviewTableColumns(): { key: string, label: string }[] {
    const responseDto = this.endpoint?.response_dto;
    const config = this.endpoint?.configuracion_ui?.fields_config?.response || {};
    
    let columns: string[] = [];
    if (responseDto && responseDto.properties) {
      // Buscar el primer array que no sea total
      const listProp: any = Object.entries(responseDto.properties).find(([k, p]: [string, any]) => p.type === 'array' && k !== 'total')?.[1];
      
      if (listProp && listProp.items && listProp.items.properties) {
        columns = Object.keys(listProp.items.properties);
      } else {
        // Si no es un array, devolvemos las propiedades del objeto directamente
        columns = Object.keys(responseDto.properties);
      }
    } else {
      columns = ['id', 'descripcion', 'estado'];
    }
    
    // Si no hay columnas detectadas, fallback
    if (columns.length === 0) columns = ['id', 'descripcion'];

    // Filtrar según configuración de visibilidad y ordenar
    return columns
      .filter(col => config[col]?.show !== false)
      .sort((a, b) => (config[a]?.order || 0) - (config[b]?.order || 0))
      .slice(0, 8) // Aumentamos de 5 a 8 para ver más
      .map(col => ({
        key: col,
        label: config[col]?.visualName || col
      }));
  }

  getFormFields(): { key: string, label: string, type: string, editable: boolean, required: boolean, unique: boolean }[] {
    const ep = this.endpoint;
    if (!ep) return [];

    const dto = (this.method === 'POST' || this.method === 'PUT' || this.method === 'PATCH') 
                ? ep.request_dto : ep.response_dto;
    const config = (this.method === 'POST' || this.method === 'PUT' || this.method === 'PATCH') 
                ? (ep.configuracion_ui?.fields_config?.request || {})
                : (ep.configuracion_ui?.fields_config?.response || {});
    
    if (dto && dto.properties) {
      return Object.entries(dto.properties)
        .map(([k, v]: [string, any]) => ({
          key: k,
          label: config[k]?.visualName || k,
          type: v.type || 'string',
          editable: config[k]?.editable !== false,
          required: config[k]?.required === true,
          unique: config[k]?.unique === true,
          order: config[k]?.order || 0
        }))
        .filter(f => !['fecha_alta_creacion', 'fecha_alta_modificacion', 'baja_logica'].includes(f.key)) // Auditoría fuera del formulario
        .filter(f => config[f.key]?.show !== false) // Filtrar por visibilidad
        .sort((a, b) => a.order - b.order); // Ordenar por propiedad order
    }
    return [
      { key: 'id', label: 'ID', type: 'string', editable: true, required: true, unique: true }, 
      { key: 'descripcion', label: 'Descripción', type: 'string', editable: true, required: true, unique: false }
    ];
  }
}
