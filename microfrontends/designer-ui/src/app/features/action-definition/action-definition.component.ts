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
                            <tr *ngFor="let param of getSortedParams()">
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
                                  (click)="selectDto(dto)"
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
                                    <tr *ngFor="let prop of getSortedProps(dto); let i = index; trackBy: trackByProp"
                                        draggable="true" 
                                        (dragstart)="onDragStart($event, prop.key, dto)" 
                                        (dragover)="onDragOver($event)" 
                                        (drop)="onDrop($event, prop.key, dto)"
                                        class="drag-row">
                                      <td class="ps-3" style="min-width: 250px; background-color: #ffffff;">
                                        <div class="d-flex align-items-center mb-1">
                                          <i class="bi bi-grip-vertical me-2 text-muted cursor-move"></i>
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
                                     <td class="text-center">
                                       <!-- Botón Contextual para Referencia -->
                                       <button (click)="openReferenceModal(prop.key, activeTab)" 
                                               class="btn btn-sm w-100 d-flex align-items-center justify-content-between px-2"
                                               [class.btn-outline-primary]="!getFieldConfig(prop.key, activeTab).refService"
                                               [class.btn-primary]="getFieldConfig(prop.key, activeTab).refService"
                                               [class.shadow-sm]="getFieldConfig(prop.key, activeTab).refService">
                                         
                                         <div class="d-flex align-items-center text-truncate">
                                           <i class="bi" [ngClass]="getFieldConfig(prop.key, activeTab).refService ? 'bi-link-45deg' : 'bi-plus-circle'"></i>
                                           <span class="ms-2 x-small fw-bold text-truncate">
                                             {{ getFieldConfig(prop.key, activeTab).refService || 'CONFIGURAR' }}
                                           </span>
                                         </div>
                                         
                                         <i class="bi bi-chevron-right opacity-50 ms-1"></i>
                                       </button>

                                       <!-- Resumen compacto -->
                                       <div *ngIf="getFieldConfig(prop.key, activeTab).refService" class="mt-1 text-truncate" style="max-width: 200px;">
                                          <span class="badge bg-info-subtle text-dark border x-small py-0 px-1 fw-normal">
                                            {{ getFieldConfig(prop.key, activeTab).dependency?.field || '...' }}
                                          </span>
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

      <!-- MODAL CONTEXTUAL: CONFIGURACIÓN DE REFERENCIA -->
      <div *ngIf="isModalOpen" class="custom-modal-backdrop animate-in">
        <div class="custom-modal shadow-lg border-0 rounded-4 overflow-hidden">
          <div class="modal-header bg-primary text-white p-3 d-flex justify-content-between align-items-center">
            <h6 class="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
              <i class="bi bi-link-45deg me-2"></i>
              Configurar Referencia: {{ editingPropKey }}
            </h6>
            <div class="d-flex align-items-center gap-3">
              <button (click)="showHelpModal = true" class="btn btn-link text-white p-0 text-decoration-none d-flex align-items-center fw-bold small" title="Guía de configuración">
                <i class="bi bi-question-circle me-1 fs-5"></i> AYUDA
              </button>
              <button (click)="closeModal()" class="btn-close btn-close-white shadow-none"></button>
            </div>
          </div>
          
          <div class="modal-body p-4 bg-white">
            <div class="dependency-container">

              <!-- 1. SELECCIÓN DE SERVICIO Y ENDPOINT (ORIGEN) -->
              <div class="dep-row mb-3">
                <div class="dep-block">
                  <span class="label-title">1. SERVICIO (ORIGEN EXTERNO)</span>
                  <select class="form-select form-select-sm custom-select" 
                          [(ngModel)]="getFieldConfig(editingPropKey, editingTab).refService"
                          (ngModelChange)="onDependencyTypeChange(editingPropKey, editingTab)">
                    <option [value]="null">Sin referencia (Valor manual)</option>
                    <option *ngFor="let s of allServices" [value]="s.id">{{ s.id }}</option>
                  </select>
                </div>

                <div class="dep-block animate-in" *ngIf="getFieldConfig(editingPropKey, editingTab).refService">
                  <span class="label-title">2. ENDPOINT (ACCESO A DATOS)</span>
                  <select class="form-select form-select-sm custom-select" 
                          [(ngModel)]="getFieldConfig(editingPropKey, editingTab).dependency.target"
                          (ngModelChange)="onDependencyTargetChange(editingPropKey, editingTab)">
                    <option [value]="null">Seleccione un endpoint GET...</option>
                    <option *ngFor="let ep of targetEndpoints[editingTab + '_' + editingPropKey]" [value]="ep.path">
                      {{ ep.method }} {{ ep.path }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- CHECK: BÚSQUEDA DE VALORES RELACIONADOS -->
              <div class="border-top pt-3 mb-3 animate-in" *ngIf="getFieldConfig(editingPropKey, editingTab).dependency?.target">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="checkRelacionados"
                         [(ngModel)]="getFieldConfig(editingPropKey, editingTab).hasSecondaryLookup"
                         (ngModelChange)="onSecondaryLookupToggle(editingPropKey, editingTab)">
                  <label class="form-check-label fw-bold text-primary small" for="checkRelacionados">
                    Búsqueda de valores relacionados (Cascada o Catálogo Secundario)
                  </label>
                </div>
              </div>

              <!-- MODO A: CHECK DESACTIVADO (ATRIBUTO DE REFERENCIA DIRECTO) -->
              <div class="dep-row animate-in" *ngIf="getFieldConfig(editingPropKey, editingTab).dependency?.target && !getFieldConfig(editingPropKey, editingTab).hasSecondaryLookup">
                <div class="dep-block bg-light">
                  <span class="label-title">3. ATRIBUTO DE REFERENCIA (VALOR DIRECTO)</span>
                  <select class="form-select form-select-sm custom-select" 
                          [(ngModel)]="getFieldConfig(editingPropKey, editingTab).dependency.field">
                    <option [value]="null">Seleccione atributo del DTO...</option>
                    <option *ngFor="let f of targetFields[editingTab + '_' + editingPropKey]" [value]="f">
                      {{ f }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- MODO B: CHECK ACTIVADO (FLUJO CON SERVICIO RELACIONADO) -->
              <div class="animate-in" *ngIf="getFieldConfig(editingPropKey, editingTab).hasSecondaryLookup">
                
                <!-- PASO INTERMEDIO: ATRIBUTO QUE ACTÚA COMO LLAVE (PUENTE) -->
                <div class="dep-row mb-3">
                  <div class="dep-block border-info">
                    <span class="label-title text-info">ATRIBUTO LLAVE (PROVIENE DE SERVICIO ORIGEN)</span>
                    <select class="form-select form-select-sm custom-select" 
                            [(ngModel)]="getFieldConfig(editingPropKey, editingTab).dependency.field">
                      <option [value]="null">Seleccione atributo llave...</option>
                      <option *ngFor="let f of targetFields[editingTab + '_' + editingPropKey]" [value]="f">
                        {{ f }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- SELECCIÓN DE SERVICIO Y ENDPOINT RELACIONADO -->
                <div class="dep-row mb-3" *ngIf="getFieldConfig(editingPropKey, editingTab).dependency?.field">
                  <div class="dep-block">
                    <span class="label-title">SERVICIO RELACIONADO</span>
                    <select class="form-select form-select-sm custom-select" 
                            [(ngModel)]="getFieldConfig(editingPropKey, editingTab).secondaryDependency.type"
                            (ngModelChange)="onSecondaryDependencyTypeChange(editingPropKey, editingTab)">
                      <option [value]="null">Seleccione servicio...</option>
                      <option *ngFor="let s of allServices" [value]="s.id">{{ s.id }}</option>
                    </select>
                  </div>

                  <div class="dep-block animate-in" *ngIf="getFieldConfig(editingPropKey, editingTab).secondaryDependency?.type">
                    <span class="label-title">ENDPOINT RELACIONADO (RECIBE LLAVE)</span>
                    <select class="form-select form-select-sm custom-select" 
                            [(ngModel)]="getFieldConfig(editingPropKey, editingTab).secondaryDependency.target"
                            (ngModelChange)="onSecondaryDependencyTargetChange(editingPropKey, editingTab)">
                      <option [value]="null">Seleccione endpoint...</option>
                      <option *ngFor="let ep of secondaryTargetEndpoints[editingTab + '_' + editingPropKey]" [value]="ep.path">
                        {{ ep.method }} {{ ep.path }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- SELECCIÓN DE ATRIBUTO A MOSTRAR (LABEL) -->
                <div class="dep-row animate-in" *ngIf="getFieldConfig(editingPropKey, editingTab).secondaryDependency?.target">
                  <div class="dep-block bg-success bg-opacity-10 border-success border-opacity-25">
                    <span class="label-title text-success">ATRIBUTO A MOSTRAR (LABEL EN UI)</span>
                    <select class="form-select form-select-sm custom-select" 
                            [(ngModel)]="getFieldConfig(editingPropKey, editingTab).secondaryDependency.field">
                      <option [value]="null">Seleccione el campo descriptivo...</option>
                      <option *ngFor="let f of secondaryTargetFields[editingTab + '_' + editingPropKey]" [value]="f">
                        {{ f }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- OPCIONES DE VISTA (BAJO DE TODO) -->
              <div class="border-top mt-4 pt-3 animate-in" *ngIf="getFieldConfig(editingPropKey, editingTab).refService">
                <div class="d-flex align-items-center">
                  <span class="label-title me-3 mb-0" style="font-size: 0.75rem">OPCIONES DE VISTA:</span>
                  <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox" id="showIdCheckBottom"
                           [(ngModel)]="getFieldConfig(editingPropKey, editingTab).showIdWithDescription">
                    <label class="form-check-label small fw-bold text-dark" for="showIdCheckBottom">
                      Mostrar ID junto a la descripción
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <div class="modal-footer bg-light p-3 border-top">
            <button (click)="closeModal()" class="btn btn-primary fw-bold px-4 shadow-sm">GUARDAR CONFIGURACIÓN</button>
          </div>
        </div>
      </div>

      <!-- ASISTENTE TÉCNICO REDISEÑADO E INTEGRADO -->
      <div *ngIf="showHelpModal" class="full-screen-help-container animate-in">
        
        <!-- Header Integrado con Sistema -->
        <div class="help-header d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary text-white p-2 rounded-3 shadow-sm">
              <i class="bi bi-shield-lock-fill fs-4"></i>
            </div>
            <div>
              <h5 class="mb-0 fw-bold text-primary">Estudio de Referencias <span class="text-muted fw-normal">/ {{ editingPropKey }}</span></h5>
              <div class="x-small text-muted fw-medium text-uppercase ls-1">Centro de Integridad y Diagnóstico AI</div>
            </div>
          </div>
          <button class="btn btn-outline-danger btn-sm px-4 fw-bold rounded-pill" (click)="showHelpModal = false">
            <i class="bi bi-x-circle me-2"></i>CERRAR ESTUDIO
          </button>
        </div>

        <div class="help-content-grid">
          <!-- ÁREA PRINCIPAL: DIAGNÓSTICO -->
          <div class="main-diagnostic-area">
            <div class="container-fluid" style="max-width: 1000px;">
              
              <!-- Card Central: Acción Prominente -->
              <div class="card border-0 rounded-4 p-5 text-center mb-5 shadow-sm bg-white overflow-hidden position-relative">
                <div class="position-absolute top-0 start-0 w-100 h-100 bg-primary opacity-5"></div>
                <div class="position-relative">
                  <div class="icon-circle bg-primary text-white mx-auto mb-4 shadow" style="width: 70px; height: 70px; font-size: 2rem;">
                    <i class="bi bi-search"></i>
                  </div>
                  <h2 class="fw-bold text-dark mb-3">Auditoría Técnica de Campo</h2>
                  <p class="text-secondary mb-4 mx-auto lead" style="max-width: 600px;">
                    Analizaremos la conexión entre <strong>{{ editingPropKey }}</strong> y los microservicios externos para detectar fallas de contrato.
                  </p>
                  <button (click)="analyzeWithAI()" [disabled]="aiLoading" 
                          class="studio-button-main d-inline-flex align-items-center gap-3">
                    <i class="bi" [ngClass]="aiLoading ? 'bi-arrow-repeat spin' : 'bi-lightning-charge-fill'"></i>
                    {{ aiLoading ? 'PROCESANDO CONTEXTO...' : 'EJECUTAR ANÁLISIS DE INTEGRIDAD' }}
                  </button>
                </div>
              </div>

              <!-- Listado de Resultados (Sistema de Cards Integradas) -->
              <div *ngIf="aiSuggestions" class="animate-in">
                <div class="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
                  <h6 class="text-primary fw-bold mb-0 text-uppercase ls-1">
                    <i class="bi bi-clipboard-data me-2"></i>Informe de Resultados
                  </h6>
                  <span class="badge bg-light text-primary border px-3 py-2 fw-bold">
                    {{ aiSuggestions.length }} Hallazgo(s)
                  </span>
                </div>
                
                <div *ngFor="let sug of aiSuggestions" class="diagnostic-card p-4 mb-4 shadow-sm border-start border-5" 
                     [ngClass]="'border-' + (sug.type === 'danger' ? 'danger' : 'info')">
                  <div class="d-flex justify-content-between align-items-start mb-4">
                    <div class="d-flex gap-3">
                      <div [ngClass]="'bg-' + (sug.type === 'danger' ? 'danger' : 'info') + ' text-white rounded-3 p-2 shadow-sm'" style="height: fit-content;">
                        <i class="bi fs-4" [ngClass]="sug.icon"></i>
                      </div>
                      <div>
                        <h5 class="mb-1 fw-bold text-dark">{{ sug.title }}</h5>
                        <p class="text-secondary small mb-0">{{ sug.message }}</p>
                      </div>
                    </div>
                    <span class="badge" [ngClass]="'bg-' + (sug.type === 'danger' ? 'danger' : 'info') + '-subtle text-' + (sug.type === 'danger' ? 'danger' : 'info')">
                      Prioridad: {{ sug.type === 'danger' ? 'ALTA' : 'MEDIA' }}
                    </span>
                  </div>

                  <!-- Comparativa Estilo DIFF Moderno -->
                  <div *ngIf="sug.visualBefore" class="diff-container mb-4 shadow-inner">
                    <div class="diff-box diff-old shadow-sm">
                      <div class="x-small fw-bold text-uppercase opacity-75 mb-2 d-flex align-items-center">
                        <i class="bi bi-x-circle-fill me-2"></i>Estado Actual
                      </div>
                      <div class="fw-bold">{{ sug.visualBefore }}</div>
                    </div>
                    <div class="diff-box diff-new shadow-sm">
                      <div class="x-small fw-bold text-uppercase opacity-75 mb-2 d-flex align-items-center">
                        <i class="bi bi-check-circle-fill me-2"></i>Recomendado
                      </div>
                      <div class="fw-bold">{{ sug.visualAfter }}</div>
                    </div>
                  </div>

                  <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center border">
                    <div class="text-dark small fw-bold">
                      <i class="bi bi-lightbulb-fill me-2 text-warning"></i>{{ sug.action }}
                    </div>
                    <button class="btn btn-sm btn-primary px-4 fw-bold rounded-pill shadow-sm" (click)="applyAISuggestion(sug)">
                      APLICAR CAMBIO
                    </button>
                  </div>
                </div>
              </div>

              <!-- Guías Iniciales (Integradas) -->
              <div *ngIf="!aiSuggestions && !aiLoading" class="row g-4 animate-in">
                <div class="col-md-6">
                  <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                    <div class="d-flex align-items-center mb-3">
                      <i class="bi bi-info-circle-fill text-info fs-4 me-3"></i>
                      <h6 class="text-dark fw-bold mb-0">Arquitectura de Referencia</h6>
                    </div>
                    <p class="small text-secondary mb-0">El sistema permite automatizar la carga de datos maestros vinculando contratos OpenAPI entre diferentes servicios.</p>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                    <div class="d-flex align-items-center mb-3">
                      <i class="bi bi-diagram-3-fill text-success fs-4 me-3"></i>
                      <h6 class="text-dark fw-bold mb-0">Control de Jerarquía</h6>
                    </div>
                    <p class="small text-secondary mb-0">Configure filtros en cascada para que la interfaz sea dinámica y solo muestre opciones contextuales.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- PANEL LATERAL: COPILOT INTEGRADO -->
          <div class="side-chat-panel animate-in">
            <div class="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
              <h6 class="text-dark fw-bold mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-robot text-primary fs-5"></i> Copilot Técnico
              </h6>
              <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">Online</span>
            </div>
            
            <!-- Historial de Conversación -->
            <div class="flex-grow-1 overflow-auto mb-4 custom-scrollbar d-flex flex-column pe-2">
              <div *ngFor="let msg of chatHistory" [ngClass]="msg.role === 'ai' ? 'ai-bubble-v2 shadow-sm' : 'user-bubble shadow-sm animate-in'">
                <div class="d-flex align-items-center gap-2 mb-2" *ngIf="msg.role === 'ai'">
                  <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 24px; height: 24px; font-size: 0.7rem;">
                    <i class="bi bi-cpu"></i>
                  </div>
                  <span class="x-small fw-bold text-primary text-uppercase">Analizador IA</span>
                </div>
                <div [ngClass]="msg.role === 'ai' ? 'text-dark small ai-content' : 'text-primary fw-medium'" 
                     style="line-height: 1.5;"
                     [innerHTML]="formatAIResponse(msg.content)"></div>
              </div>
              
              <div class="text-center py-5 opacity-50" *ngIf="chatHistory.length === 0 && !isAskingAI">
                <i class="bi bi-chat-quote fs-1 text-muted"></i>
                <p class="x-small text-muted mt-3 px-4">Consulte sobre llaves, endpoints o cómo mejorar la UX de este campo.</p>
              </div>

              <div *ngIf="isAskingAI" class="text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                <div class="x-small text-muted mt-2 fw-medium">IA razonando respuesta...</div>
              </div>
            </div>

            <!-- Input de Chat Integrado -->
            <div class="mt-auto">
              <div class="input-group shadow-sm border rounded-pill overflow-hidden bg-light p-1">
                <input type="text" class="form-control border-0 bg-transparent small px-3 shadow-none" 
                       placeholder="Escriba su duda técnica..."
                       [(ngModel)]="userQuestion"
                       (keyup.enter)="askAIQuestion()">
                <button class="btn btn-primary rounded-pill px-3 shadow-sm" (click)="askAIQuestion()" [disabled]="isAskingAI || !userQuestion.trim()">
                  <i class="bi" [ngClass]="isAskingAI ? 'bi-arrow-repeat spin' : 'bi-send-fill'"></i>
                </button>
              </div>
              <div class="x-small text-muted mt-2 text-center">IA basada en el contexto del campo <strong>{{ editingPropKey }}</strong></div>
            </div>
          </div>
        </div>
      </div>

    <style>
      .cursor-move { cursor: move; }
      .drag-row { transition: all 0.2s ease; cursor: default; }
      .drag-row:hover { background-color: rgba(var(--bs-primary-rgb), 0.05) !important; }
      .drag-row:active { opacity: 0.7; border: 2px dashed #0d6efd; }
      .drag-row td { vertical-align: middle; }

      /* Arquitectura de Bloques UX Estandarizada */
      .dependency-container { width: 100%; min-width: 320px; background: transparent; }
      .dep-row { display: flex; gap: 4px; width: 100%; background: transparent; }
      .dep-block { 
        flex: 1; 
        min-height: 38px; 
        border-radius: 4px; 
        overflow: hidden; 
        padding: 2px 4px; 
        display: flex; 
        flex-direction: column; 
        background-color: transparent !important;
        border: 1px solid #dee2e6;
      }
      
      .label-title { 
        font-size: 0.55rem; 
        font-weight: 800; 
        text-transform: uppercase; 
        line-height: 1;
        margin-bottom: 1px;
        color: #0d6efd !important; /* Azul estándar */
      }

      .custom-select {
        background-color: transparent !important;
        border: none !important;
        color: #000 !important; /* Texto negro */
        font-weight: 600;
        font-size: 0.75rem;
        padding: 0 !important;
        height: auto !important;
      }
      .custom-select option { color: #000; background-color: #fff; }

      .x-small { font-size: 0.7rem; }

      /* Estilos del Modal Contextual */
      .custom-modal-backdrop {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
        z-index: 1050; display: flex; align-items: center; justify-content: center;
      }

      /* Pantalla Completa para Ayuda Inteligente - REDISEÑO INTEGRADO */
      .full-screen-help-container {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #f8f9fa; /* Fondo gris muy claro, integrado con el sistema */
        z-index: 1500;
        display: flex;
        flex-direction: column;
        color: #212529;
        font-family: inherit;
      }

      .help-header {
        background: #ffffff;
        border-bottom: 1px solid #dee2e6;
        padding: 0.75rem 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }

      .help-content-grid {
        display: flex;
        flex-direction: row;
        height: calc(100vh - 62px);
        overflow: hidden;
      }

      @media (max-width: 1200px) {
        .help-content-grid { flex-direction: column; }
        .side-chat-panel { width: 100% !important; border-left: none !important; border-top: 1px solid #dee2e6; height: 400px; }
      }

      .main-diagnostic-area {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
        background: #f8f9fa;
      }

      .side-chat-panel {
        width: 400px;
        background: #ffffff;
        border-left: 1px solid #dee2e6;
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
        box-shadow: -4px 0 15px rgba(0,0,0,0.03);
      }

      .diagnostic-card {
        background: #ffffff;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        transition: all 0.2s;
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
      }
      .diagnostic-card:hover { border-color: #0d6efd; box-shadow: 0 8px 15px rgba(0,0,0,0.05); }

      .diff-container {
        display: flex;
        gap: 1rem;
        background: #f1f3f5;
        padding: 1.25rem;
        border-radius: 10px;
        font-family: 'SFMono-Regular', Consolas, monospace;
      }

      .diff-box {
        flex: 1;
        padding: 0.75rem;
        border-radius: 6px;
        font-size: 0.85rem;
      }
      .diff-old { background: #fff5f5; border: 1px solid #ffa8a8; color: #c92a2a; }
      .diff-new { background: #ebfbee; border: 1px solid #8ce99a; color: #2b8a3e; }

      .ai-bubble-v2 {
        background: #f1f3f5;
        border-radius: 15px;
        padding: 1rem;
        border-bottom-left-radius: 2px;
        margin-bottom: 1.5rem;
        border: 1px solid #e9ecef;
      }

      .user-bubble {
        background: #e7f5ff;
        border: 1px solid #a5d8ff;
        border-radius: 15px;
        padding: 0.8rem 1.2rem;
        border-bottom-right-radius: 2px;
        margin-bottom: 1.5rem;
        align-self: flex-end;
        color: #1971c2;
        font-size: 0.85rem;
        max-width: 85%;
      }

      .studio-button-main {
        background: #0d6efd;
        color: white;
        border: none;
        padding: 1rem 3rem;
        border-radius: 50px;
        font-weight: 700;
        letter-spacing: 0.5px;
        transition: all 0.3s;
        box-shadow: 0 10px 20px rgba(13, 110, 253, 0.2);
      }
      .studio-button-main:hover {
        transform: translateY(-2px);
        box-shadow: 0 15px 25px rgba(13, 110, 253, 0.3);
        background: #0b5ed7;
      }

      .custom-modal {
        width: 90%; max-width: 600px;
        background: white; border-radius: 1rem;
        animation: slideUp 0.3s ease-out;
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .ls-1 { letter-spacing: 1px; }
      .spin { animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      
      .animate-in { animation: fadeIn 0.3s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

      /* Estilos para el contenido de la IA (Markdown-like) */
      .ai-content strong { color: #0dcaf0; }
      .ai-content .bi-dot { font-size: 1.2rem; line-height: 1; }
      
      .ai-bubble {
        transition: all 0.3s ease;
        max-width: 100%;
        word-wrap: break-word;
      }
      
      .chat-input-container .input-group {
        border-radius: 20px;
        overflow: hidden;
      }
      
      .chat-input-container input:focus {
        box-shadow: none;
        background-color: rgba(255, 255, 255, 0.15) !important;
        border-color: #0dcaf0 !important;
      }
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

  // Cache para dependencias externas
  targetEndpoints: { [key: string]: Endpoint[] } = {};
  targetFields: { [key: string]: string[] } = {};
  secondaryTargetEndpoints: { [key: string]: Endpoint[] } = {};
  secondaryTargetFields: { [key: string]: string[] } = {};
  private serviceEndpointsCache: { [serviceId: string]: Endpoint[] } = {};

  // Drag and Drop State
  draggedKey: string | null = null;
  dragSnapshotKeys: string[] = [];

  // Modal State
  isModalOpen = false;
  editingPropKey: string = '';
  editingTab: string = '';
  showHelpModal = false;
  
  // AI Analysis State
  aiLoading = false;
  aiSuggestions: any[] | null = null;
  
  // AI Chat State
  userQuestion = '';
  chatHistory: { role: 'user' | 'ai', content: string }[] = [];
  isAskingAI = false;

  get helpContext() {
    const config = this.getFieldConfig(this.editingPropKey, this.editingTab);
    if (!config.refService) return 'base';
    if (config.hasSecondaryLookup) return 'secondary';
    return 'direct';
  }

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
          this.preloadAllDependencies();
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
        refDescriptionService: null,
        dependsOn: null,
        dependency: null,
        hasSecondaryLookup: false,
        secondaryDependency: null,
        showIdWithDescription: false
      };
    }

    // Normalización: Asegurar que si no hay referencia, dependency sea null
    const field = config[category][propKey];
    if (!field.refService || field.refService === 'Sin referencia' || field.refService === 'null') {
      field.refService = null;
      field.dependency = null;
      field.hasSecondaryLookup = false;
      field.secondaryDependency = null;
    }

    // Asegurar objeto dependency si existe refService
    if (field.refService && !field.dependency) {
      field.dependency = {
        type: field.refService,
        target: null,
        field: null
      };
    }

    // Inicialización de secondaryDependency si el flag está activo
    if (field.hasSecondaryLookup && !field.secondaryDependency) {
      field.secondaryDependency = {
        type: null,
        target: null,
        field: null
      };
    }

    // Asegurar que siempre tenga un visualName para evitar campos vacíos
    if (!config[category][propKey].visualName) {
      config[category][propKey].visualName = propKey;
    }

    return config[category][propKey];
  }

  preloadAllDependencies() {
    if (!this.endpoint?.configuracion_ui?.fields_config) return;
    const fc = this.endpoint.configuracion_ui.fields_config;
    
    // Iterar sobre todas las categorías para precargar endpoints de servicios referenciados
    ['params', 'request', 'response'].forEach(cat => {
      if (fc[cat]) {
        Object.keys(fc[cat]).forEach(propKey => {
          const config = fc[cat][propKey];
          if (config.refService) {
             this.loadTargetEndpoints(propKey, cat, config.refService);
          }
          if (config.hasSecondaryLookup && config.secondaryDependency?.type) {
             this.loadTargetEndpoints(propKey, cat, config.secondaryDependency.type, true);
          }
        });
      }
    });
  }

  loadTargetEndpoints(propKey: string, type: string, serviceId: string, isSecondary: boolean = false) {
    if (!serviceId || serviceId === 'null' || serviceId === 'Sin referencia') return;
    const cacheKey = `${type}_${propKey}`;
    const targetMap = isSecondary ? this.secondaryTargetEndpoints : this.targetEndpoints;

    // 1. Si ya tenemos los endpoints de este servicio en el caché global, usarlos (filtrando por GET y Activos)
    if (this.serviceEndpointsCache[serviceId]) {
      targetMap[cacheKey] = this.serviceEndpointsCache[serviceId].filter((e: any) => e.method === 'GET' && e.is_enabled);
      this.afterEndpointsLoaded(propKey, type, isSecondary);
      return;
    }

    // 2. Si no, cargarlos de la API
    this.middlewareService.inspectService(serviceId).subscribe({
      next: (data) => {
        const endpoints = data.endpoints || [];
        this.serviceEndpointsCache[serviceId] = endpoints;
        // REGLA: Solo permitir métodos GET que estén ACTIVOS en la definición
        targetMap[cacheKey] = endpoints.filter((e: any) => e.method === 'GET' && e.is_enabled);
        this.afterEndpointsLoaded(propKey, type, isSecondary);
      },
      error: (err) => {
        console.error(`Error al cargar servicio ${serviceId}:`, err);
        targetMap[cacheKey] = [];
      }
    });
  }

  private afterEndpointsLoaded(propKey: string, type: string, isSecondary: boolean = false) {
    const config = this.getFieldConfig(propKey, type);
    const dep = isSecondary ? config.secondaryDependency : config.dependency;
    if (dep?.target) {
      this.loadTargetFields(propKey, type, dep.target, isSecondary);
    }
  }

  loadTargetFields(propKey: string, type: string, path: string, isSecondary: boolean = false) {
    if (!path) return;
    const cacheKey = `${type}_${propKey}`;
    const sourceMap = isSecondary ? this.secondaryTargetEndpoints : this.targetEndpoints;
    const targetMap = isSecondary ? this.secondaryTargetFields : this.targetFields;
    
    const endpoints = sourceMap[cacheKey];
    if (!endpoints || endpoints.length === 0) return;

    // Normalización de path para búsqueda (quitar slashes extras)
    const normalizedPath = path.replace(/\/+$/, '').toLowerCase();
    
    const endpoint = endpoints.find(e => 
      e.path === path || 
      e.path.replace(/\/+$/, '').toLowerCase() === normalizedPath
    );

    if (!endpoint || !endpoint.response_dto) {
      console.warn(`No se encontró DTO de respuesta para el endpoint: ${path}`);
      targetMap[cacheKey] = [];
      return;
    }

    targetMap[cacheKey] = this.extractPropsFromDto(endpoint.response_dto);
  }

  private extractPropsFromDto(dto: any): string[] {
    if (!dto) return [];
    if (dto.properties) {
      const listProp: any = Object.values(dto.properties).find((p: any) => p.type === 'array');
      if (listProp && listProp.items && listProp.items.properties) {
        return Object.keys(listProp.items.properties);
      }
      return Object.keys(dto.properties);
    }
    if (dto.type === 'array' && dto.items && dto.items.properties) {
      return Object.keys(dto.items.properties);
    }
    return [];
  }

  onDependencyTypeChange(propKey: string, type: string) {
    const config = this.getFieldConfig(propKey, type);
    const cacheKey = `${type}_${propKey}`;

    if (!config.refService || config.refService === 'Sin referencia' || config.refService === 'null') {
      config.refService = null;
      config.dependency = null;
      config.editable = true;
      delete this.targetEndpoints[cacheKey];
      delete this.targetFields[cacheKey];
    } else {
      config.dependency = {
        type: config.refService,
        target: null,
        field: null
      };
      config.editable = false;
      this.loadTargetEndpoints(propKey, type, config.refService);
    }
  }

  onDependencyTargetChange(propKey: string, type: string) {
    const config = this.getFieldConfig(propKey, type);
    if (config.dependency?.target) {
      config.dependency.field = null;
      this.loadTargetFields(propKey, type, config.dependency.target);
    }
  }

  onSecondaryLookupToggle(propKey: string, type: string) {
    const config = this.getFieldConfig(propKey, type);
    if (config.hasSecondaryLookup) {
      config.secondaryDependency = {
        type: null,
        target: null,
        field: null
      };
    } else {
      config.secondaryDependency = null;
      const cacheKey = `${type}_${propKey}`;
      delete this.secondaryTargetEndpoints[cacheKey];
      delete this.secondaryTargetFields[cacheKey];
    }
  }

  onSecondaryDependencyTypeChange(propKey: string, type: string) {
    const config = this.getFieldConfig(propKey, type);
    const cacheKey = `${type}_${propKey}`;
    if (config.secondaryDependency) {
      config.secondaryDependency.target = null;
      config.secondaryDependency.field = null;
      delete this.secondaryTargetEndpoints[cacheKey];
      delete this.secondaryTargetFields[cacheKey];
      
      if (config.secondaryDependency.type) {
        this.loadTargetEndpoints(propKey, type, config.secondaryDependency.type, true);
      }
    }
  }

  formatAIResponse(text: string): string {
    if (!text) return '';
    // Conversión básica de pseudo-markdown a HTML para legibilidad
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/• (.*?)\n/g, '<div class="d-flex gap-2 mb-1"><i class="bi bi-dot text-info"></i><span>$1</span></div>')
      .replace(/\n/g, '<br>');
  }

  onSecondaryDependencyTargetChange(propKey: string, type: string) {
    const config = this.getFieldConfig(propKey, type);
    if (config.secondaryDependency?.target) {
      config.secondaryDependency.field = null;
      this.loadTargetFields(propKey, type, config.secondaryDependency.target, true);
    }
  }

  analyzeWithAI() {
    this.aiLoading = true;
    this.aiSuggestions = null;
    
    setTimeout(() => {
      const config = this.getFieldConfig(this.editingPropKey, this.editingTab);
      const suggestions = [];
      const propLower = this.editingPropKey.toLowerCase();

      // 1. Error Crítico: Llave Desconectada (Caso Rol/Aplicación)
      if (propLower.includes('rol') && config.dependency?.field && config.dependency.field.toLowerCase().includes('aplicacion')) {
        suggestions.push({
          id: 'fix_rol_key',
          type: 'danger',
          icon: 'bi-exclamation-octagon-fill',
          title: 'FALLA DE VÍNCULO DETECTADA',
          message: `El campo "${this.editingPropKey}" requiere una llave de tipo ROL para consultar el catálogo de descripciones. Actualmente estás enviando un ID de APLICACIÓN.`,
          improvement: 'Vincular el ID correcto permitirá al Middleware realizar el "Join" y mostrar el nombre del Rol en lugar de un código vacío.',
          visualBefore: '[ ID: 104 ] (Valor actual: Desconectado)',
          visualAfter: '[ ADMINISTRADOR ] (Valor corregido)',
          options: [
            '¿Qué pasaría si dejo id_aplicacion? -> La lista de roles se filtrará por aplicación pero no mostrará nombres.',
            '¿Por qué id_rol es mejor? -> Porque es la clave primaria en el microservicio de roles.'
          ],
          action: 'CAMBIO SUGERIDO: Cambiar "Atributo Llave" a "id_rol".'
        });
      }

      // 2. Mejora de UX: Búsqueda Relacionada
      if (!config.hasSecondaryLookup && (propLower.includes('id_') || propLower.includes('_id') || propLower.includes('rol'))) {
        suggestions.push({
          id: 'enable_secondary',
          type: 'warning',
          icon: 'bi-stars',
          title: 'MEJORA DE LEGIBILIDAD (UX)',
          message: 'Detecto que este campo es un identificador. Actualmente el usuario verá números crudos en la pantalla.',
          improvement: 'Al activar la búsqueda relacionada, el Middleware irá a buscar el nombre legible automáticamente.',
          visualBefore: 'Input: [ 10025 ]',
          visualAfter: 'Select: [ SELECCIONE ROL: ADMINISTRADOR ▼ ]',
          options: [
            '¿Cómo mejora la productividad? -> El usuario no tiene que recordar códigos de memoria.',
            '¿Afecta el rendimiento? -> No, el middleware cachea estas relaciones.'
          ],
          action: 'CAMBIO SUGERIDO: Activar "Búsqueda de valores relacionados".'
        });
      }

      // 3. Mejora de Estética: Mostrar ID
      if (config.refService && !config.showIdWithDescription) {
        suggestions.push({
          id: 'show_id',
          type: 'info',
          icon: 'bi-eye-fill',
          title: 'OPTIMIZACIÓN DE VISTA',
          message: 'Estás mostrando solo la descripción. Para auditoría, suele ser mejor ver el código técnico al lado.',
          improvement: 'Añade el ID entre paréntesis al final de la descripción.',
          visualBefore: 'ADMINISTRADOR',
          visualAfter: 'ADMINISTRADOR (ID: 104)',
          options: [
            '¿Cuándo usarlo? -> En pantallas de gestión técnica o soporte.',
            '¿Cuándo NO usarlo? -> En interfaces finales para clientes externos.'
          ],
          action: 'CAMBIO SUGERIDO: Activar "Mostrar ID junto a la descripción".'
        });
      }

      if (suggestions.length === 0) {
        suggestions.push({
          type: 'success',
          icon: 'bi-check-all',
          title: 'CONFIGURACIÓN ÓPTIMA',
          message: 'Todo parece estar en orden. ¿Te gustaría explorar opciones avanzadas de filtrado?',
          action: 'No se requieren cambios inmediatos.'
        });
      }

      this.aiSuggestions = suggestions;
      this.aiLoading = false;
    }, 1500);
  }

  askAIQuestion() {
    if (!this.userQuestion.trim()) return;
    
    const userMsg = this.userQuestion;
    this.chatHistory.push({ role: 'user', content: userMsg });
    this.userQuestion = '';
    this.isAskingAI = true;
    
    setTimeout(() => {
      const config = this.getFieldConfig(this.editingPropKey, this.editingTab);
      const question = userMsg.toLowerCase();
      const prop = this.editingPropKey;
      
      let detailResponse = '';

      if (question.includes('analiza') || question.includes('funcionar') || question.includes('test')) {
        if (prop.toLowerCase().includes('email')) {
          detailResponse = `Para el campo **Email**, es preferible usar validación de formato (Regex) en lugar de un selector. Una referencia externa suele ser innecesaria aquí.`;
        } else if (prop.toLowerCase().includes('rol') || prop.toLowerCase().includes('perfil')) {
          if (config.dependency?.field?.toLowerCase().includes('aplicacion')) {
            detailResponse = `**¡ALERTA TÉCNICA!** Estás intentando resolver un Rol usando un ID de Aplicación. **Cambio sugerido:** Usa "id_rol" como atributo llave.`;
          } else {
            detailResponse = `La configuración para este Rol parece sólida. Al usar búsqueda relacionada, garantizas que el usuario vea nombres descriptivos.`;
          }
        } else {
          detailResponse = `He verificado el flujo. Asegúrate de que el endpoint devuelva un esquema compatible con los campos elegidos.`;
        }
      } else if (question.includes('llave') || question.includes('id')) {
        detailResponse = `La "Llave" es vital. Si el servicio origen te da un ID numérico, ese mismo ID debe existir en el servicio relacionado.`;
      } else {
        detailResponse = `He analizado tu duda sobre "${userMsg}". Te sugiero revisar si este campo debe ser obligatorio en la pantalla principal.`;
      }

      this.chatHistory.push({ 
        role: 'ai', 
        content: `${detailResponse}\n\n¿Deseas que profundice en algún otro detalle técnico o tienes otra duda?` 
      });
      
      this.isAskingAI = false;
    }, 1200);
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingPropKey = '';
    this.editingTab = '';
  }

  applyAISuggestion(sug: any) {
    const config = this.getFieldConfig(this.editingPropKey, this.editingTab);
    
    switch(sug.id) {
      case 'fix_rol_key':
        if (config.dependency) {
          config.dependency.field = 'id_rol';
          // Recargar campos si hay un endpoint seleccionado
          if (config.dependency.target) {
            this.loadTargetFields(this.editingPropKey, this.editingTab, config.dependency.target);
          }
        }
        break;
      case 'enable_secondary':
        config.hasSecondaryLookup = true;
        this.onSecondaryLookupToggle(this.editingPropKey, this.editingTab);
        // Si hay un servicio relacionado configurado, cargar sus endpoints
        if (config.secondaryDependency?.type) {
          this.loadTargetEndpoints(this.editingPropKey, this.editingTab, config.secondaryDependency.type, true);
        }
        break;
      case 'show_id':
        config.showIdWithDescription = true;
        break;
    }

    // Feedback visual y limpieza
    this.aiSuggestions = this.aiSuggestions?.filter(s => s.id !== sug.id) || null;
    this.chatHistory.push({ 
      role: 'ai', 
      content: `✅ **Cambio aplicado:** ${sug.action}\n\nEl modal de configuración ha sido actualizado. Puedes cerrar este estudio y verificar los cambios en el modal de referencia.` 
    });

    // Cerrar el estudio y volver al modal de referencia para que el usuario vea los cambios
    setTimeout(() => {
      this.showHelpModal = false;
      // Forzar actualización del modal de referencia si está abierto
      if (this.isModalOpen) {
        // Recargar endpoints y campos para reflejar los cambios
        if (config.refService) {
          this.loadTargetEndpoints(this.editingPropKey, this.editingTab, config.refService);
        }
        if (config.hasSecondaryLookup && config.secondaryDependency?.type) {
          this.loadTargetEndpoints(this.editingPropKey, this.editingTab, config.secondaryDependency.type, true);
        }
      }
    }, 1500);
  }

  openReferenceModal(propKey: string, tab: string) {
    this.editingPropKey = propKey;
    this.editingTab = tab;
    this.isModalOpen = true;
    
    // Limpiar chat para el nuevo contexto
    this.chatHistory = [];
    this.aiSuggestions = null;
    this.userQuestion = '';
    const config = this.getFieldConfig(propKey, tab);
    if (config.refService) {
      this.loadTargetEndpoints(propKey, tab, config.refService);
    }
    if (config.hasSecondaryLookup && config.secondaryDependency?.type) {
      this.loadTargetEndpoints(propKey, tab, config.secondaryDependency.type, true);
    }
  }

  onRefServiceChange(propKey: any, type: string) {
    const config = this.getFieldConfig(propKey, type);
    if (!config.refService) {
      config.refDisplay = 'id';
      config.refDescriptionService = null;
      config.dependsOn = null;
      return;
    }

    if (config.refDisplay === 'desc' && !config.refDescriptionService) {
      config.refDescriptionService = config.refService;
    }
  }

  onRefDisplayChange(propKey: any, type: string) {
    const config = this.getFieldConfig(propKey, type);
    if (config.refDisplay !== 'desc') {
      config.refDescriptionService = null;
      return;
    }

    if (!config.refDescriptionService) {
      config.refDescriptionService = config.refService;
    }
  }

  getFieldConfig(propKey: any, type: string): any {
    return this.getPropertyConfig(String(propKey || 'unknown'), type);
  }

  normalizeOrders(category: string, scopeKeys: string[]) {
    if (!this.endpoint || !scopeKeys.length) return;

    const items = scopeKeys.map(k => ({
      key: k,
      config: this.getFieldConfig(k, category)
    }));

    // Separar en dos grupos: visibles y ocultos
    const visibles = items.filter(i => i.config.show).sort((a, b) => (a.config.order || 0) - (b.config.order || 0));
    const ocultos = items.filter(i => !i.config.show).sort((a, b) => (a.config.order || 0) - (b.config.order || 0));

    // Reasignar órdenes correlativos sin saltos
    visibles.forEach((item, index) => {
      item.config.order = index + 1;
    });

    const offset = visibles.length;
    ocultos.forEach((item, index) => {
      item.config.order = offset + index + 1;
    });
  }

  toggleVisibility(propKey: any, type: string) {
    const category = type === 'params' ? 'params' : (type === 'request' ? 'request' : 'response');
    
    let allKeys: string[] = [];
    if (category === 'params') {
      allKeys = this.endpoint?.parameters?.map(p => p.name) || [];
    } else {
      const activeDto = this.detectedDtos.find(d => d.name === this.activeDtoId);
      if (activeDto && activeDto.properties) {
        allKeys = Object.keys(activeDto.properties);
      }
    }

    this.normalizeOrders(category, allKeys);
  }

  getSortedParams(): any[] {
    if (!this.endpoint || !this.endpoint.parameters) return [];
    
    // Antes de devolver, aseguramos que los órdenes estén normalizados
    const allParamKeys = this.endpoint.parameters.map(p => p.name);
    this.normalizeOrders('params', allParamKeys);

    const params = [...this.endpoint.parameters];
    return params.sort((a, b) => {
      const configA = this.getFieldConfig(a.name, 'params');
      const configB = this.getFieldConfig(b.name, 'params');
      
      if (configA.show !== configB.show) {
        return configA.show ? -1 : 1;
      }
      
      return (configA.order || 0) - (configB.order || 0);
    });
  }

  changeMainTab(tab: 'request' | 'response') {
    this.activeTab = tab;
    this.updateDetectedDtos();
  }

  selectDto(dto: any) {
    this.activeDtoId = dto.name;
    if (dto.properties) {
      this.normalizeOrders(this.activeTab, Object.keys(dto.properties));
    }
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
          this.selectDto(withProps[0]);
        } else {
          this.selectDto(this.detectedDtos[0]);
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

  getSortedProps(dto: any): any[] {
    if (!dto || !dto.properties) return [];
    
    // Convertir objeto a array para poder ordenar
    const propsArray = Object.entries(dto.properties).map(([key, value]) => ({
      key,
      value
    }));

    // Ordenar según la configuración actual: primero visibles, luego ocultos
    return propsArray.sort((a, b) => {
      const configA = this.getFieldConfig(a.key, this.activeTab);
      const configB = this.getFieldConfig(b.key, this.activeTab);
      
      // Si la visibilidad es diferente, el visible va primero
      if (configA.show !== configB.show) {
        return configA.show ? -1 : 1;
      }
      
      // Si ambos tienen la misma visibilidad, usar el orden configurado
      return (configA.order || 0) - (configB.order || 0);
    });
  }

  onDragStart(event: DragEvent, propKey: string, dto: any) {
    const sortedProps = this.getSortedProps(dto);
    this.dragSnapshotKeys = sortedProps.map(prop => prop.key);
    this.draggedKey = propKey;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetKey: string, dto: any) {
    event.preventDefault();
    if (!this.draggedKey || !this.dragSnapshotKeys.length) return;

    const draggedIndex = this.dragSnapshotKeys.indexOf(this.draggedKey);
    const targetIndex = this.dragSnapshotKeys.indexOf(targetKey);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const reorderedKeys = [...this.dragSnapshotKeys];
    const [moved] = reorderedKeys.splice(draggedIndex, 1);
    reorderedKeys.splice(targetIndex, 0, moved);

    // Actualizar el atributo 'order' de cada campo basándose en su nueva posición
    reorderedKeys.forEach((propKey, index) => {
      const config = this.getFieldConfig(propKey, this.activeTab);
      config.order = index + 1; // Orden de 1 a N
    });

    this.draggedKey = null;
    this.dragSnapshotKeys = [];
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
