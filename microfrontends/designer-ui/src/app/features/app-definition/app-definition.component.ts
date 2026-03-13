import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  MiddlewareService, BackendService, Endpoint,
  AppDefinition, AppRoleConfig, AppRoleModule, MenuItem, AppMenuConfig,
  Aplicacion, Rol, AplicacionRole, UsuarioRol, Usuario,
  AppAccessCheckResponse, AppAccessIssue
} from '../../core/services/middleware.service';
import { ModulePreviewPanelComponent } from '../../shared/module-preview-panel/module-preview-panel.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-definition',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModulePreviewPanelComponent],
  template: `
    <div class="container-fluid px-4 py-4">
      <!-- Header -->
      <div class="page-header-sticky">
        <div class="d-flex justify-content-between align-items-center py-3">
          <div>
            <nav aria-label="breadcrumb" class="mb-2">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item">
                  <a routerLink="/" class="text-decoration-none">
                    <i class="bi bi-house-door me-1"></i>Inicio
                  </a>
                </li>
                <li class="breadcrumb-item active" aria-current="page">Gestión de Aplicaciones</li>
              </ol>
            </nav>
            <h2 class="mb-0 fw-bold">Gestión de Aplicaciones</h2>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-primary shadow-sm fw-bold" (click)="openCreateForm()">
              <i class="bi bi-plus-lg me-2"></i> Nueva Aplicación
            </button>
            <button class="btn btn-light border shadow-sm" (click)="loadApps()">
              <i class="bi bi-arrow-repeat me-1"></i> Refrescar
            </button>
          </div>
        </div>
      </div>

      <!-- Sin selección: Lista de apps -->
      <div *ngIf="!selectedApp && !showForm">
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="mt-2 text-muted">Cargando aplicaciones...</p>
        </div>

        <div *ngIf="!loading && apps.length === 0" class="text-center py-5">
          <i class="bi bi-window-stack display-1 text-muted"></i>
          <h4 class="mt-3 text-muted">No hay aplicaciones configuradas</h4>
          <p class="text-muted">Crea tu primera aplicación para comenzar</p>
          <button class="btn btn-primary" (click)="openCreateForm()">
            <i class="bi bi-plus-lg me-2"></i> Crear Aplicación
          </button>
        </div>

        <div class="row g-3" *ngIf="!loading && apps.length > 0">
          <div class="col-md-6 col-lg-4" *ngFor="let app of apps">
            <div class="card shadow-sm border-0 h-100 app-card" [class.opacity-50]="app.baja_logica">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title fw-bold mb-0">{{ app.nombre }}</h5>
                  <span class="badge" [class.bg-success]="app.is_active && !app.baja_logica"
                        [class.bg-danger]="app.baja_logica" [class.bg-warning]="!app.is_active && !app.baja_logica">
                    {{ app.baja_logica ? 'Baja' : app.is_active ? 'Activa' : 'Inactiva' }}
                  </span>
                </div>
                <p class="text-muted small mb-2">{{ app.descripcion || 'Sin descripción' }}</p>
                <div class="mb-2">
                  <span class="badge bg-info bg-opacity-10 text-info me-1">
                    <i class="bi bi-link-45deg me-1"></i>/{{ app.slug }}
                  </span>
                  <span class="badge bg-secondary bg-opacity-10 text-secondary">
                    <i class="bi bi-people me-1"></i>{{ app.roles?.length || 0 }} roles
                  </span>
                </div>
                <div class="small text-muted mb-3" *ngIf="runtimeBaseUrl">
                  <i class="bi bi-globe me-1"></i>
                  <code class="text-primary">{{ runtimeBaseUrl }}/{{ app.slug }}</code>
                </div>
              </div>
              <div class="card-footer bg-transparent border-top-0 d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-grow-1" (click)="selectApp(app)" *ngIf="!app.baja_logica">
                  <i class="bi bi-pencil me-1"></i> Configurar
                </button>
                <button class="btn btn-sm btn-outline-danger" (click)="deleteApp(app)" *ngIf="!app.baja_logica">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario crear/editar -->
      <div *ngIf="showForm && !selectedApp" class="card shadow-sm border-0">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0 fw-bold"><i class="bi bi-plus-circle me-2"></i>Nueva Aplicación</h5>
          <button class="btn btn-sm btn-outline-light" (click)="cancelForm()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="card-body p-4">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label fw-bold">Vincular con Aplicación existente</label>
              <select class="form-select" [(ngModel)]="formData.id_aplicacion" (change)="onAplicacionSelected()">
                <option value="">-- Sin vínculo (aplicación independiente) --</option>
                <option *ngFor="let ap of aplicacionesList" [value]="ap.id">
                  {{ ap.descripcion }} ({{ ap.id }})
                </option>
              </select>
              <div class="form-text">
                Al vincular con una aplicación del servicio, los roles se cargarán automáticamente desde el microservicio de roles.
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Nombre *</label>
              <input type="text" class="form-control" [(ngModel)]="formData.nombre"
                     placeholder="Ej: Panel de Administración" (input)="autoSlug()">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Slug (URL)</label>
              <div class="input-group">
                <span class="input-group-text">/</span>
                <input type="text" class="form-control" [(ngModel)]="formData.slug"
                       placeholder="panel-administracion">
              </div>
            </div>
            <div class="col-12">
              <label class="form-label fw-bold">Descripción</label>
              <textarea class="form-control" rows="2" [(ngModel)]="formData.descripcion"
                        placeholder="Descripción de la aplicación"></textarea>
            </div>
          </div>
          <div class="mt-4 d-flex gap-2">
            <button class="btn btn-primary fw-bold" (click)="saveNewApp()" [disabled]="!formData.nombre">
              <i class="bi bi-check-lg me-2"></i> Crear Aplicación
            </button>
            <button class="btn btn-outline-secondary" (click)="cancelForm()">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Detalle de app seleccionada con tabs -->
      <div *ngIf="selectedApp">
        <div class="d-flex align-items-center mb-4">
          <button class="btn btn-outline-secondary me-3" (click)="backToList()">
            <i class="bi bi-arrow-left me-1"></i> Volver
          </button>
          <div>
            <h4 class="mb-0 fw-bold">{{ selectedApp.nombre }}</h4>
            <span class="text-muted small">Slug: /{{ selectedApp.slug }}</span>
          </div>
        </div>

        <!-- Tabs de configuración -->
        <ul class="nav nav-tabs mb-0">
          <li class="nav-item">
            <button class="nav-link fw-bold" [class.active]="activeTab === 'info'"
                    (click)="activeTab = 'info'">
              <i class="bi bi-info-circle me-1"></i> Información
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link fw-bold" [class.active]="activeTab === 'roles'"
                    (click)="activeTab = 'roles'; loadAvailableRoles()">
              <i class="bi bi-shield-lock me-1"></i> Roles
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link fw-bold" [class.active]="activeTab === 'modules'"
                    (click)="activeTab = 'modules'; loadModulesData()">
              <i class="bi bi-boxes me-1"></i> Módulos por Rol
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link fw-bold" [class.active]="activeTab === 'menu'"
                    (click)="activeTab = 'menu'; loadMenuData()">
              <i class="bi bi-list-nested me-1"></i> Menú
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link fw-bold" [class.active]="activeTab === 'url'"
                    (click)="activeTab = 'url'">
              <i class="bi bi-link-45deg me-1"></i> URL de Acceso
            </button>
          </li>
        </ul>

        <div class="card shadow-sm border-0 border-top-0 rounded-top-0">
          <div class="card-body p-4">

            <!-- TAB: Info -->
            <div *ngIf="activeTab === 'info'">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label fw-bold">Vinculación con Aplicación</label>
                  <select class="form-select" [(ngModel)]="editData.id_aplicacion">
                    <option value="">-- Sin vínculo --</option>
                    <option *ngFor="let ap of aplicacionesList" [value]="ap.id">
                      {{ ap.descripcion }} ({{ ap.id }})
                    </option>
                  </select>
                  <div class="form-text">
                    Vincular permite cargar roles automáticamente del microservicio de roles para esta aplicación.
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Nombre</label>
                  <input type="text" class="form-control" [(ngModel)]="editData.nombre">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Slug (URL)</label>
                  <div class="input-group">
                    <span class="input-group-text">/</span>
                    <input type="text" class="form-control" [(ngModel)]="editData.slug">
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">Descripción</label>
                  <textarea class="form-control" rows="2" [(ngModel)]="editData.descripcion"></textarea>
                </div>
                <div class="col-md-6">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="editData.is_active" id="appActive">
                    <label class="form-check-label fw-bold" for="appActive">Aplicación activa</label>
                  </div>
                </div>
              </div>
              <div class="mt-4">
                <button class="btn btn-primary fw-bold" (click)="updateAppInfo()">
                  <i class="bi bi-check-lg me-2"></i> Guardar Cambios
                </button>
              </div>
            </div>

            <!-- TAB: Roles -->
            <div *ngIf="activeTab === 'roles'">
              <!-- Info de vinculación -->
              <div class="alert mb-4" [class.alert-info]="selectedApp.id_aplicacion" [class.alert-warning]="!selectedApp.id_aplicacion">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi" [class.bi-link-45deg]="selectedApp.id_aplicacion" [class.bi-exclamation-triangle]="!selectedApp.id_aplicacion"></i>
                  <div *ngIf="selectedApp.id_aplicacion">
                    <strong>Vinculada a:</strong> {{ linkedAplicacionNombre || selectedApp.id_aplicacion }}
                    <span class="badge bg-info ms-2">{{ selectedApp.id_aplicacion }}</span>
                    <br><small>Mostrando solo los roles configurados para esta aplicación.</small>
                  </div>
                  <div *ngIf="!selectedApp.id_aplicacion">
                    <strong>Sin vínculo a aplicación del microservicio.</strong>
                    <br><small>Debe vincular esta app a una aplicación existente desde la pestaña <strong>Información</strong> para poder ver y asignar roles.</small>
                  </div>
                </div>
              </div>

              <!-- Sin vinculación: no se muestran roles -->
              <div *ngIf="!selectedApp.id_aplicacion" class="text-center text-muted py-5">
                <i class="bi bi-link-45deg display-3 text-warning"></i>
                <p class="mt-3 fw-bold">Aplicación sin vincular</p>
                <p class="small">Vaya a la pestaña <strong>Información</strong> y seleccione una aplicación del microservicio para cargar los roles disponibles.</p>
              </div>

              <!-- Con vinculación: layout de roles -->
              <div class="row g-4" *ngIf="selectedApp.id_aplicacion">
                <div class="col-md-5">
                  <div class="d-flex align-items-center justify-content-between mb-3">
                    <h6 class="fw-bold mb-0"><i class="bi bi-plus-circle me-2"></i>Roles de {{ linkedAplicacionNombre || selectedApp.id_aplicacion }}</h6>
                    <span class="badge bg-info" *ngIf="rolesDeApp.length > 0">{{ rolesDeApp.length }}</span>
                  </div>
                  <div *ngIf="loadingRoles" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                    <span class="ms-2 small text-muted">Cargando roles...</span>
                  </div>
                  <div *ngIf="!loadingRoles">
                    <div class="list-group" *ngIf="rolesDeApp.length > 0">
                      <button class="list-group-item list-group-item-action p-3"
                              *ngFor="let role of rolesDeApp"
                              (click)="assignRole(role)"
                              [disabled]="isRoleAssigned(role.id)"
                              [class.list-group-item-success]="isRoleAssigned(role.id)">
                        <div class="d-flex justify-content-between align-items-start">
                          <div class="flex-grow-1">
                            <div class="d-flex align-items-center gap-2 mb-1">
                              <i class="bi bi-shield-fill" [class.text-info]="!isRoleAssigned(role.id)" [class.text-success]="isRoleAssigned(role.id)"></i>
                              <span class="fw-bold">{{ role.descripcion }}</span>
                              <span class="badge small" [class.bg-success]="!role.baja_logica" [class.bg-opacity-25]="!role.baja_logica"
                                    [class.text-success]="!role.baja_logica" [class.bg-danger]="role.baja_logica"
                                    [class.text-danger]="role.baja_logica" [class.bg-opacity-10]="role.baja_logica">
                                <i class="bi me-1" [class.bi-check-circle]="!role.baja_logica" [class.bi-x-circle]="role.baja_logica"></i>
                                {{ role.baja_logica ? 'Baja' : 'Activo' }}
                              </span>
                            </div>
                            <div class="d-flex flex-wrap gap-1 mb-1">
                              <span class="badge bg-light text-dark border small">
                                <i class="bi bi-key me-1"></i>{{ role.id }}
                              </span>
                              <span class="badge bg-info bg-opacity-10 text-info border-0 small">
                                <i class="bi bi-app-indicator me-1"></i>{{ getAplicacionDescription(role.id_aplicacion) || role.id_aplicacion }}
                              </span>
                              <span class="badge bg-secondary bg-opacity-10 text-secondary border-0 small" *ngIf="role.fecha_alta_creacion">
                                <i class="bi bi-calendar-event me-1"></i>{{ role.fecha_alta_creacion | date:'dd/MM/yyyy HH:mm' }}
                              </span>
                            </div>
                            <div class="d-flex flex-wrap gap-1">
                              <span class="badge bg-primary bg-opacity-10 text-primary border-0 small"
                                    *ngIf="getUsersForRole(role.id).length > 0">
                                <i class="bi bi-people me-1"></i>{{ getUsersForRole(role.id).length }} usuarios
                              </span>
                              <span class="badge bg-warning bg-opacity-10 text-warning border-0 small"
                                    *ngIf="getUsersForRole(role.id).length === 0">
                                <i class="bi bi-person-x me-1"></i>Sin usuarios
                              </span>
                            </div>
                          </div>
                          <i class="bi fs-5" [class.bi-check-circle-fill]="isRoleAssigned(role.id)"
                             [class.bi-plus-circle]="!isRoleAssigned(role.id)"
                             [class.text-success]="isRoleAssigned(role.id)"
                             [class.text-primary]="!isRoleAssigned(role.id)"></i>
                        </div>
                      </button>
                    </div>
                    <div *ngIf="rolesDeApp.length === 0" class="text-muted small text-center py-4">
                      <i class="bi bi-info-circle display-6 d-block mb-2"></i>
                      No se encontraron roles para <strong>{{ linkedAplicacionNombre || selectedApp.id_aplicacion }}</strong>.
                      <br>Verifica que existan roles creados en el servicio de roles para esta aplicación.
                    </div>
                  </div>
                </div>

                <div class="col-md-7">
                  <div class="d-flex align-items-center justify-content-between mb-3">
                    <h6 class="fw-bold mb-0"><i class="bi bi-shield-lock me-2"></i>Roles Asignados a esta App</h6>
                    <span class="badge bg-primary" *ngIf="selectedApp.roles.length > 0">{{ selectedApp.roles.length }}</span>
                  </div>
                  <div *ngIf="selectedApp.roles.length === 0" class="text-center text-muted py-4">
                    <i class="bi bi-shield display-4"></i>
                    <p class="mt-2">No hay roles asignados aún</p>
                    <p class="small">Selecciona roles de la lista disponible para asignarlos.</p>
                  </div>
                  <div class="list-group">
                    <div class="list-group-item p-3" *ngFor="let role of selectedApp.roles">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <div class="d-flex align-items-center gap-2 mb-1">
                            <i class="bi bi-shield-fill-check text-primary"></i>
                            <span class="fw-bold fs-6">{{ role.role_nombre }}</span>
                            <span class="badge small" [class.bg-success]="!getRolObject(role.id_role)?.baja_logica"
                                  [class.bg-opacity-25]="!getRolObject(role.id_role)?.baja_logica"
                                  [class.text-success]="!getRolObject(role.id_role)?.baja_logica"
                                  [class.bg-danger]="getRolObject(role.id_role)?.baja_logica"
                                  [class.text-danger]="getRolObject(role.id_role)?.baja_logica"
                                  [class.bg-opacity-10]="getRolObject(role.id_role)?.baja_logica">
                              <i class="bi me-1" [class.bi-check-circle]="!getRolObject(role.id_role)?.baja_logica"
                                 [class.bi-x-circle]="getRolObject(role.id_role)?.baja_logica"></i>
                              {{ getRolObject(role.id_role)?.baja_logica ? 'Baja' : 'Activo' }}
                            </span>
                          </div>

                          <div class="d-flex flex-wrap gap-1 mb-2">
                            <span class="badge bg-light text-dark border">
                              <i class="bi bi-key me-1"></i>{{ role.id_role }}
                            </span>
                            <span class="badge bg-info bg-opacity-10 text-info border-0">
                              <i class="bi bi-app-indicator me-1"></i>{{ getAplicacionDescription(selectedApp.id_aplicacion!) || selectedApp.id_aplicacion }}
                            </span>
                            <span class="badge bg-secondary bg-opacity-10 text-secondary border-0"
                                  *ngIf="getRolObject(role.id_role)?.fecha_alta_creacion">
                              <i class="bi bi-calendar-event me-1"></i>Creado: {{ getRolObject(role.id_role)?.fecha_alta_creacion | date:'dd/MM/yyyy HH:mm' }}
                            </span>
                          </div>

                          <div *ngIf="getUsersForRole(role.id_role).length > 0">
                            <div class="small fw-bold text-muted mb-1">
                              <i class="bi bi-people me-1"></i>Usuarios con este rol ({{ getUsersForRole(role.id_role).length }}):
                            </div>
                            <div class="d-flex flex-wrap gap-1">
                              <span class="badge bg-primary bg-opacity-10 text-primary border-0 d-flex align-items-center gap-1"
                                    *ngFor="let usr of getUsersForRole(role.id_role)">
                                <i class="bi bi-person-fill"></i>
                                {{ usr.nombre }} {{ usr.apellido }}
                                <small class="opacity-75">({{ usr.nombre_usuario || usr.id }})</small>
                              </span>
                            </div>
                          </div>
                          <div *ngIf="getUsersForRole(role.id_role).length === 0" class="small text-muted">
                            <i class="bi bi-person-x me-1"></i>Sin usuarios vinculados a este rol
                          </div>
                        </div>
                        <button class="btn btn-sm btn-outline-danger ms-2 flex-shrink-0" (click)="unassignRole(role)"
                                title="Remover rol de esta aplicación">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Módulos por Rol -->
            <div *ngIf="activeTab === 'modules'">
              <div *ngIf="selectedApp.roles.length === 0" class="text-center text-muted py-5">
                <i class="bi bi-exclamation-triangle display-3 text-warning"></i>
                <p class="mt-3 fw-bold">Primero debes asignar roles a la aplicación</p>
                <p class="small">Ve a la pestaña <strong>Roles</strong> y asigna al menos un rol para configurar módulos.</p>
              </div>

              <div *ngIf="selectedApp.roles.length > 0">
                <!-- Resumen de asignaciones existentes -->
                <h6 class="fw-bold mb-3"><i class="bi bi-diagram-3 me-2"></i>Resumen de Asignaciones por Rol</h6>
                <div *ngIf="loadingModuleSummary" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm text-primary"></div>
                  <span class="ms-2 small text-muted">Cargando resumen...</span>
                </div>
                <div class="row g-3 mb-4" *ngIf="!loadingModuleSummary">
                  <div class="col-md-4 col-sm-6" *ngFor="let summary of roleModuleSummary">
                    <div class="card h-100 border" [class.border-primary]="selectedRoleId === '' + summary.roleConfigId"
                         style="cursor: pointer" (click)="selectedRoleId = '' + summary.roleConfigId; onRoleSelected()">
                      <div class="card-body p-3">
                        <div class="d-flex align-items-center gap-2 mb-2">
                          <i class="bi bi-shield-fill text-primary"></i>
                          <span class="fw-bold">{{ summary.roleName }}</span>
                        </div>
                        <div class="d-flex flex-wrap gap-1 mb-2">
                          <span class="badge bg-light text-dark border small">
                            <i class="bi bi-key me-1"></i>{{ summary.idRole }}
                          </span>
                          <span class="badge small" [class.bg-success]="summary.moduleCount > 0" [class.bg-opacity-25]="summary.moduleCount > 0"
                                [class.text-success]="summary.moduleCount > 0" [class.bg-secondary]="summary.moduleCount === 0"
                                [class.bg-opacity-10]="summary.moduleCount === 0" [class.text-secondary]="summary.moduleCount === 0">
                            <i class="bi me-1" [class.bi-check-circle]="summary.moduleCount > 0" [class.bi-dash-circle]="summary.moduleCount === 0"></i>
                            {{ summary.moduleCount }} módulos
                          </span>
                        </div>
                        <div *ngIf="summary.modules.length > 0">
                          <div class="small text-muted" *ngFor="let m of summary.modules.slice(0, 4)">
                            <span class="badge rounded-pill me-1" [class]="getMethodBadgeClass(m.method)" style="font-size: .65rem">{{ m.method }}</span>
                            <span class="text-truncate">{{ m.service }} {{ m.endpoint }}</span>
                          </div>
                          <div class="small text-muted fst-italic" *ngIf="summary.modules.length > 4">
                            ... y {{ summary.modules.length - 4 }} más
                          </div>
                        </div>
                        <div *ngIf="summary.modules.length === 0" class="small text-muted fst-italic">
                          <i class="bi bi-info-circle me-1"></i>Sin módulos configurados
                        </div>
                      </div>
                      <div class="card-footer bg-transparent border-top p-2 text-center">
                        <small class="text-primary fw-bold"><i class="bi bi-pencil-square me-1"></i>Configurar</small>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="roleModuleSummary.length === 0 && !loadingModuleSummary" class="col-12 text-muted small text-center py-3">
                    No hay roles con módulos configurados aún.
                  </div>
                </div>

                <hr class="my-4">

                <!-- Configuración detallada -->
                <div class="d-flex align-items-center justify-content-between mb-3">
                  <h6 class="fw-bold mb-0"><i class="bi bi-sliders me-2"></i>Configurar Módulos</h6>
                </div>
                <div class="mb-4">
                  <label class="form-label fw-bold">Seleccionar Rol</label>
                  <select class="form-select" [(ngModel)]="selectedRoleId" (change)="onRoleSelected()">
                    <option value="">-- Seleccionar rol --</option>
                    <option *ngFor="let role of selectedApp.roles" [value]="role.id">
                      {{ role.role_nombre }} ({{ role.id_role }})
                    </option>
                  </select>
                </div>

                <div *ngIf="selectedRoleId">
                  <div *ngIf="loadingModules" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                    <span class="ms-2">Cargando módulos...</span>
                  </div>

                  <div *ngIf="!loadingModules">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="fw-bold mb-0">Módulos y Endpoints disponibles</h6>
                      <button class="btn btn-sm btn-primary" (click)="saveRoleModules()">
                        <i class="bi bi-check-lg me-1"></i> Guardar Configuración
                      </button>
                    </div>

                    <div *ngIf="availableServices.length === 0" class="text-muted text-center py-3">
                      No hay servicios habilitados. Habilita endpoints en la sección de Previsualización primero.
                    </div>

                    <div class="accordion" *ngIf="availableServices.length > 0">
                      <div class="accordion-item" *ngFor="let svc of availableServices; let i = index">
                        <h2 class="accordion-header">
                          <button class="accordion-button" [class.collapsed]="i > 0" type="button"
                                  (click)="svc._expanded = !svc._expanded">
                            <div class="d-flex align-items-center gap-2 w-100">
                              <div class="form-check" (click)="$event.stopPropagation()">
                                <input class="form-check-input" type="checkbox"
                                       [checked]="isServiceFullySelected(svc)"
                                       (change)="toggleService(svc, $event)">
                              </div>
                              <i class="bi bi-box text-primary"></i>
                              <span class="fw-bold">{{ svc.nombre }}</span>
                              <span class="badge bg-secondary ms-auto me-3">{{ svc.endpoints?.length || 0 }} endpoints</span>
                            </div>
                          </button>
                        </h2>
                        <div class="accordion-collapse" [class.show]="svc._expanded || i === 0">
                          <div class="accordion-body p-0">
                            <div class="list-group list-group-flush">
                              <label class="list-group-item d-flex align-items-center gap-3 py-3"
                                     *ngFor="let ep of svc.endpoints">
                                <input type="checkbox" class="form-check-input m-0"
                                       [(ngModel)]="ep._selected">
                                <span class="badge rounded-pill" [class]="getMethodBadgeClass(ep.method)">
                                  {{ ep.method | uppercase }}
                                </span>
                                <span class="small flex-grow-1">{{ ep.path }}</span>
                                <span class="small text-muted">{{ ep.configuracion_ui?.label || ep.summary || '' }}</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB: Menú -->
            <div *ngIf="activeTab === 'menu'">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h6 class="fw-bold mb-0">Estructura del Menú</h6>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-primary" (click)="autoGenerateMenu()">
                    <i class="bi bi-magic me-1"></i> Auto-generar
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" (click)="addMenuItem()">
                    <i class="bi bi-plus-lg me-1"></i> Agregar Item
                  </button>
                  <button class="btn btn-sm btn-primary" (click)="saveMenu()">
                    <i class="bi bi-check-lg me-1"></i> Guardar Menú
                  </button>
                </div>
              </div>

              <div class="row g-4">
                <!-- Editor de menú -->
                <div class="col-md-7">
                  <div *ngIf="menuItems.length === 0" class="text-center text-muted py-5">
                    <i class="bi bi-list-nested display-4"></i>
                    <p class="mt-2">El menú está vacío. Usa "Auto-generar" o agrega items manualmente.</p>
                  </div>

                  <div class="menu-editor" *ngIf="menuItems.length > 0">
                    <ng-container *ngFor="let item of menuItems; let idx = index">
                      <div class="card mb-2 menu-item-card" [class.border-primary]="selectedMenuItem?.id === item.id">
                        <div class="card-body p-3 d-flex align-items-center gap-2">
                          <i class="bi bi-grip-vertical text-muted cursor-move"></i>
                          <i [class]="'bi ' + item.icon + ' text-primary'"></i>
                          <input type="text" class="form-control form-control-sm flex-grow-1"
                                 [(ngModel)]="item.label" placeholder="Etiqueta">
                          <button class="btn btn-sm btn-outline-secondary" (click)="selectMenuItem(item)"
                                  title="Editar detalles">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-info" (click)="addChildItem(item)"
                                  title="Agregar sub-item">
                            <i class="bi bi-diagram-3"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-secondary" (click)="moveItem(idx, -1)"
                                  [disabled]="idx === 0" title="Subir">
                            <i class="bi bi-arrow-up"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-secondary" (click)="moveItem(idx, 1)"
                                  [disabled]="idx === menuItems.length - 1" title="Bajar">
                            <i class="bi bi-arrow-down"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-danger" (click)="removeMenuItem(idx)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                        <!-- Children -->
                        <div *ngIf="item.children && item.children.length > 0" class="ps-4 pb-2">
                          <div class="card mb-1 border-start border-primary border-2" *ngFor="let child of item.children; let ci = index">
                            <div class="card-body p-2 d-flex align-items-center gap-2">
                              <i class="bi bi-grip-vertical text-muted"></i>
                              <i [class]="'bi ' + child.icon + ' text-info'"></i>
                              <input type="text" class="form-control form-control-sm flex-grow-1"
                                     [(ngModel)]="child.label" placeholder="Sub-etiqueta">
                              <button class="btn btn-sm btn-outline-secondary" (click)="selectMenuItem(child)">
                                <i class="bi bi-pencil"></i>
                              </button>
                              <button class="btn btn-sm btn-outline-danger" (click)="removeChildItem(item, ci)">
                                <i class="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ng-container>
                  </div>

                  <!-- Editor de item seleccionado -->
                  <div *ngIf="selectedMenuItem" class="card mt-3 border-primary">
                    <div class="card-header bg-primary bg-opacity-10 d-flex justify-content-between">
                      <span class="fw-bold">Editar: {{ selectedMenuItem.label }}</span>
                      <button class="btn btn-sm btn-outline-secondary" (click)="selectedMenuItem = null">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div class="card-body">
                      <div class="row g-3">
                        <div class="col-md-6">
                          <label class="form-label small fw-bold">Etiqueta</label>
                          <input type="text" class="form-control form-control-sm" [(ngModel)]="selectedMenuItem.label">
                        </div>
                        <div class="col-md-6">
                          <label class="form-label small fw-bold">Icono (Bootstrap Icons)</label>
                          <div class="input-group input-group-sm">
                            <span class="input-group-text"><i [class]="'bi ' + selectedMenuItem.icon"></i></span>
                            <input type="text" class="form-control" [(ngModel)]="selectedMenuItem.icon"
                                   placeholder="bi-circle">
                          </div>
                        </div>
                        <div class="col-md-4">
                          <label class="form-label small fw-bold">Servicio Target</label>
                          <select class="form-select form-select-sm" [(ngModel)]="selectedMenuItem.target_service_id">
                            <option value="">-- Ninguno --</option>
                            <option *ngFor="let svc of allBackendServices" [value]="svc.id">{{ svc.nombre }}</option>
                          </select>
                        </div>
                        <div class="col-md-4">
                          <label class="form-label small fw-bold">Endpoint Path</label>
                          <input type="text" class="form-control form-control-sm"
                                 [(ngModel)]="selectedMenuItem.target_endpoint_path" placeholder="/api/v1/...">
                        </div>
                        <div class="col-md-4">
                          <label class="form-label small fw-bold">Método</label>
                          <select class="form-select form-select-sm" [(ngModel)]="selectedMenuItem.target_endpoint_method">
                            <option value="">-- Ninguno --</option>
                            <option value="get">GET</option>
                            <option value="post">POST</option>
                            <option value="put">PUT</option>
                            <option value="patch">PATCH</option>
                            <option value="delete">DELETE</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Preview del menú -->
                <div class="col-md-5">
                  <div class="card border-0 shadow-sm">
                    <div class="card-header bg-dark text-white fw-bold py-3">
                      <i class="bi bi-eye me-2"></i> Vista Previa del Menú
                    </div>
                    <div class="menu-preview bg-dark text-white">
                      <div class="p-3 border-bottom border-secondary">
                        <div class="d-flex align-items-center gap-2">
                          <div class="bg-info rounded-circle" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
                            <i class="bi bi-app-indicator text-dark small"></i>
                          </div>
                          <span class="fw-bold small">{{ selectedApp.nombre }}</span>
                        </div>
                      </div>
                      <nav class="p-2">
                        <div *ngFor="let item of menuItems" class="mb-1">
                          <div class="d-flex align-items-center gap-2 px-3 py-2 rounded menu-preview-item">
                            <i [class]="'bi ' + item.icon" style="width:20px"></i>
                            <span class="small">{{ item.label }}</span>
                          </div>
                          <div *ngIf="item.children?.length" class="ms-4">
                            <div *ngFor="let child of item.children"
                                 class="d-flex align-items-center gap-2 px-3 py-1 rounded menu-preview-item">
                              <i [class]="'bi ' + child.icon" style="width:16px;font-size:0.75rem"></i>
                              <span class="small" style="font-size:0.8rem">{{ child.label }}</span>
                            </div>
                          </div>
                        </div>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Previsualización en vivo: Módulos generados y probar funcionalidad -->
              <div class="mt-4 pt-4 border-top">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold mb-0">
                    <i class="bi bi-eye me-2"></i> Previsualización en vivo — Módulos generados y probar funcionalidad
                  </h6>
                  <button class="btn btn-sm btn-outline-secondary" (click)="menuPreviewPanel?.loadEnabledServices()">
                    <i class="bi bi-arrow-repeat me-1"></i> Actualizar datos
                  </button>
                </div>
                <app-module-preview-panel
                  #menuPreviewPanel
                  [compactMode]="true"
                  [showConfigurarLink]="false">
                </app-module-preview-panel>
              </div>
            </div>

            <!-- TAB: URL -->
            <div *ngIf="activeTab === 'url'">
              <div class="text-center py-4">
                <i class="bi bi-link-45deg display-1 text-primary"></i>
                <h4 class="mt-3 fw-bold">URL de Acceso</h4>
                <p class="text-muted">Los usuarios pueden acceder a esta aplicación desde:</p>
                <div class="bg-light rounded-3 p-4 d-inline-block">
                  <code class="fs-4 text-primary">{{ runtimeBaseUrl }}/{{ selectedApp.slug }}</code>
                </div>
                <div class="mt-3 d-flex justify-content-center gap-2">
                  <button class="btn btn-outline-primary" (click)="copyUrl()">
                    <i class="bi bi-clipboard me-2"></i> Copiar URL
                  </button>
                  <button class="btn btn-primary" (click)="openAppUrl()" [disabled]="checkingAccess">
                    <span *ngIf="checkingAccess" class="spinner-border spinner-border-sm me-2"></span>
                    <i *ngIf="!checkingAccess" class="bi bi-box-arrow-up-right me-2"></i>
                    {{ checkingAccess ? 'Verificando...' : 'Abrir Aplicación' }}
                  </button>
                  <button class="btn btn-outline-secondary" (click)="runAccessCheck()" [disabled]="checkingAccess"
                          title="Verificar estado de la configuración">
                    <i class="bi bi-shield-check me-1"></i> Diagnosticar
                  </button>
                </div>

                <!-- Resultado del diagnóstico -->
                <div *ngIf="accessCheckResult" class="mt-4 text-start mx-auto" style="max-width:700px">
                  <div class="card border-0 shadow-sm">
                    <div class="card-header d-flex align-items-center justify-content-between"
                         [class.bg-success]="accessCheckResult.can_access" [class.bg-danger]="!accessCheckResult.can_access"
                         [class.bg-opacity-10]="true">
                      <div class="d-flex align-items-center gap-2">
                        <i class="bi fs-4" [class.bi-check-circle-fill]="accessCheckResult.can_access"
                           [class.text-success]="accessCheckResult.can_access"
                           [class.bi-x-circle-fill]="!accessCheckResult.can_access"
                           [class.text-danger]="!accessCheckResult.can_access"></i>
                        <span class="fw-bold">
                          {{ accessCheckResult.can_access ? 'La aplicación está lista para acceder' : 'La aplicación no está lista para acceder' }}
                        </span>
                      </div>
                      <button class="btn btn-sm btn-outline-secondary border-0" (click)="accessCheckResult = null">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div class="card-body">
                      <div class="row g-3 mb-3">
                        <div class="col-6 col-md-3">
                          <div class="text-center p-2 rounded-3" [class.bg-success]="accessCheckResult.app_active"
                               [class.bg-danger]="!accessCheckResult.app_active" [class.bg-opacity-10]="true">
                            <i class="bi fs-4" [class.bi-check-circle]="accessCheckResult.app_active"
                               [class.bi-x-circle]="!accessCheckResult.app_active"
                               [class.text-success]="accessCheckResult.app_active"
                               [class.text-danger]="!accessCheckResult.app_active"></i>
                            <div class="small fw-bold mt-1">App Activa</div>
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <div class="text-center p-2 rounded-3" [class.bg-success]="accessCheckResult.has_roles"
                               [class.bg-danger]="!accessCheckResult.has_roles" [class.bg-opacity-10]="true">
                            <i class="bi fs-4" [class.bi-check-circle]="accessCheckResult.has_roles"
                               [class.bi-x-circle]="!accessCheckResult.has_roles"
                               [class.text-success]="accessCheckResult.has_roles"
                               [class.text-danger]="!accessCheckResult.has_roles"></i>
                            <div class="small fw-bold mt-1">{{ accessCheckResult.total_roles }} Roles</div>
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <div class="text-center p-2 rounded-3" [class.bg-success]="accessCheckResult.has_modules"
                               [class.bg-warning]="!accessCheckResult.has_modules" [class.bg-opacity-10]="true">
                            <i class="bi fs-4" [class.bi-check-circle]="accessCheckResult.has_modules"
                               [class.bi-exclamation-circle]="!accessCheckResult.has_modules"
                               [class.text-success]="accessCheckResult.has_modules"
                               [class.text-warning]="!accessCheckResult.has_modules"></i>
                            <div class="small fw-bold mt-1">{{ accessCheckResult.total_modules }} Módulos</div>
                          </div>
                        </div>
                        <div class="col-6 col-md-3">
                          <div class="text-center p-2 rounded-3" [class.bg-success]="accessCheckResult.has_menu"
                               [class.bg-warning]="!accessCheckResult.has_menu" [class.bg-opacity-10]="true">
                            <i class="bi fs-4" [class.bi-check-circle]="accessCheckResult.has_menu"
                               [class.bi-exclamation-circle]="!accessCheckResult.has_menu"
                               [class.text-success]="accessCheckResult.has_menu"
                               [class.text-warning]="!accessCheckResult.has_menu"></i>
                            <div class="small fw-bold mt-1">{{ accessCheckResult.menu_items_count }} Menú</div>
                          </div>
                        </div>
                      </div>

                      <div *ngIf="accessCheckResult.issues.length > 0">
                        <h6 class="fw-bold mb-2"><i class="bi bi-exclamation-triangle me-1"></i> Problemas detectados:</h6>
                        <div *ngFor="let issue of accessCheckResult.issues" class="alert py-2 px-3 mb-2"
                             [class.alert-danger]="issue.severity === 'error'"
                             [class.alert-warning]="issue.severity === 'warning'">
                          <div class="d-flex align-items-start gap-2">
                            <i class="bi mt-1" [class.bi-x-circle-fill]="issue.severity === 'error'"
                               [class.bi-exclamation-triangle-fill]="issue.severity === 'warning'"></i>
                            <div>
                              <div class="fw-bold small">{{ issue.message }}</div>
                              <div class="small opacity-75"><i class="bi bi-lightbulb me-1"></i>{{ issue.suggestion }}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div *ngIf="accessCheckResult.issues.length === 0 && accessCheckResult.can_access"
                           class="alert alert-success py-2 mb-0">
                        <i class="bi bi-check-circle-fill me-2"></i>
                        Todos los requisitos están cumplidos. La aplicación está lista para ser utilizada.
                      </div>

                      <div *ngIf="runtimeUnreachable" class="alert alert-danger py-2 mt-2 mb-0">
                        <div class="d-flex align-items-start gap-2">
                          <i class="bi bi-wifi-off mt-1"></i>
                          <div>
                            <div class="fw-bold small">El servidor de aplicaciones (app-runtime) no está accesible.</div>
                            <div class="small opacity-75">
                              <i class="bi bi-lightbulb me-1"></i>Verifique que el servicio app-runtime esté corriendo en el puerto 4201.
                              Ejecute <code>ng serve</code> en <code>microfrontends/app-runtime</code>.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-4 text-start mx-auto" style="max-width:600px">
                  <h6 class="fw-bold">Resumen de la configuración:</h6>
                  <table class="table table-sm">
                    <tr><td class="fw-bold">Nombre</td><td>{{ selectedApp.nombre }}</td></tr>
                    <tr><td class="fw-bold">Slug</td><td>/{{ selectedApp.slug }}</td></tr>
                    <tr><td class="fw-bold">Roles asignados</td><td>{{ selectedApp.roles?.length || 0 }}</td></tr>
                    <tr><td class="fw-bold">Menú configurado</td><td>{{ selectedApp.menu_config ? 'Sí' : 'No' }}</td></tr>
                    <tr><td class="fw-bold">Estado</td><td>{{ selectedApp.is_active ? 'Activa' : 'Inactiva' }}</td></tr>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Toast -->
      <div *ngIf="toastMessage" class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:9999">
        <div class="toast show border-0 shadow-lg" [class.bg-success]="toastType==='success'"
             [class.bg-danger]="toastType==='error'" [class.bg-warning]="toastType==='warning'">
          <div class="toast-body text-white d-flex justify-content-between align-items-center">
            <span>{{ toastMessage }}</span>
            <button type="button" class="btn-close btn-close-white ms-3" (click)="toastMessage=''"></button>
          </div>
        </div>
      </div>
    </div>

    <style>
      .page-header-sticky {
        position: sticky;
        top: 0;
        z-index: 100;
        background: var(--md-bg-secondary);
        padding-bottom: 1rem;
      }
      .app-card {
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: default;
      }
      .app-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px var(--md-shadow-sm) !important;
      }
      .menu-preview {
        min-height: 300px;
        border-radius: 0 0 0.375rem 0.375rem;
      }
      .menu-preview-item {
        opacity: 0.8;
        transition: all 0.2s;
        cursor: pointer;
      }
      .menu-preview-item:hover {
        opacity: 1;
        background: rgba(255,255,255,0.1);
      }
      .menu-item-card {
        transition: all 0.2s;
      }
      .cursor-move { cursor: move; }
    </style>
  `
})
export class AppDefinitionComponent implements OnInit {
  private middlewareService = inject(MiddlewareService);
  private http = inject(HttpClient);

  apps: AppDefinition[] = [];
  selectedApp: AppDefinition | null = null;
  loading = false;
  showForm = false;
  activeTab = 'info';

  formData = { nombre: '', descripcion: '', slug: '', id_aplicacion: '' };
  editData = { nombre: '', descripcion: '', slug: '', is_active: true, id_aplicacion: '' };

  // Aplicaciones del microservicio
  aplicacionesList: Aplicacion[] = [];

  // Roles
  availableRoles: Rol[] = [];
  rolesDeApp: Rol[] = [];
  loadingRoles = false;
  linkedAplicacionNombre = '';

  // Datos enriquecidos para la vista de roles asignados
  usuarioRoles: UsuarioRol[] = [];
  usuariosMap: Map<string, Usuario> = new Map();
  rolesDescMap: Map<string, string> = new Map();
  aplicacionesMap: Map<string, string> = new Map();

  // Modules
  selectedRoleId = '';
  loadingModules = false;
  loadingModuleSummary = false;
  availableServices: any[] = [];
  allBackendServices: BackendService[] = [];
  roleModuleSummary: { roleConfigId: number; roleName: string; idRole: string; moduleCount: number; modules: { service: string; endpoint: string; method: string }[] }[] = [];

  // Menu
  menuItems: MenuItem[] = [];
  selectedMenuItem: MenuItem | null = null;

  // URL & Access Check
  runtimeBaseUrl = '';
  checkingAccess = false;
  accessCheckResult: AppAccessCheckResponse | null = null;
  runtimeUnreachable = false;

  // Toast
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';

  ngOnInit() {
    this.runtimeBaseUrl = `${window.location.protocol}//${window.location.hostname}:4201`;
    this.loadApps();
    this.loadAplicaciones();
  }

  loadAplicaciones() {
    this.middlewareService.getAplicaciones(false).subscribe({
      next: (list) => this.aplicacionesList = list,
      error: () => this.aplicacionesList = []
    });
  }

  onAplicacionSelected() {
    if (this.formData.id_aplicacion) {
      const ap = this.aplicacionesList.find(a => a.id === this.formData.id_aplicacion);
      if (ap && !this.formData.nombre) {
        this.formData.nombre = ap.descripcion;
        this.autoSlug();
      }
    }
  }

  loadApps() {
    this.loading = true;
    this.middlewareService.getApps().subscribe({
      next: (apps) => { this.apps = apps; this.loading = false; },
      error: () => { this.loading = false; this.showToast('Error al cargar aplicaciones', 'error'); }
    });
  }

  openCreateForm() {
    this.formData = { nombre: '', descripcion: '', slug: '', id_aplicacion: '' };
    this.showForm = true;
    this.selectedApp = null;
    this.loadAplicaciones();
  }

  cancelForm() { this.showForm = false; }

  autoSlug() {
    if (!this.formData.nombre) { this.formData.slug = ''; return; }
    this.formData.slug = this.formData.nombre
      .toLowerCase().trim()
      .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u').replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  saveNewApp() {
    this.middlewareService.createApp({
      nombre: this.formData.nombre,
      descripcion: this.formData.descripcion || undefined,
      slug: this.formData.slug || undefined,
      id_aplicacion: this.formData.id_aplicacion || undefined,
    }).subscribe({
      next: (app) => {
        this.showForm = false;
        this.showToast('Aplicación creada correctamente', 'success');
        this.loadApps();
      },
      error: (err) => this.showToast(err.error?.detail || 'Error al crear', 'error'),
    });
  }

  selectApp(app: AppDefinition) {
    this.middlewareService.getApp(app.id).subscribe({
      next: (full) => {
        this.selectedApp = full;
        this.editData = {
          nombre: full.nombre,
          descripcion: full.descripcion || '',
          slug: full.slug,
          is_active: full.is_active,
          id_aplicacion: full.id_aplicacion || '',
        };
        this.activeTab = 'info';
        this.loadAllBackendServices();
        this.loadAplicaciones();
        this.resolveLinkedAplicacion(full.id_aplicacion);
      },
      error: () => this.showToast('Error al cargar la aplicación', 'error'),
    });
  }

  private resolveLinkedAplicacion(idAplicacion?: string) {
    this.linkedAplicacionNombre = '';
    if (!idAplicacion) return;
    const cached = this.aplicacionesList.find(a => a.id === idAplicacion);
    if (cached) {
      this.linkedAplicacionNombre = cached.descripcion;
    }
  }

  backToList() {
    this.selectedApp = null;
    this.selectedMenuItem = null;
    this.accessCheckResult = null;
    this.runtimeUnreachable = false;
    this.loadApps();
  }

  updateAppInfo() {
    if (!this.selectedApp) return;
    const payload: any = { ...this.editData };
    if (payload.id_aplicacion === '') payload.id_aplicacion = null;
    this.middlewareService.updateApp(this.selectedApp.id, payload).subscribe({
      next: (app) => {
        this.selectedApp = app;
        this.resolveLinkedAplicacion(app.id_aplicacion);
        this.showToast('Aplicación actualizada', 'success');
      },
      error: (err) => this.showToast(err.error?.detail || 'Error al actualizar', 'error'),
    });
  }

  deleteApp(app: AppDefinition) {
    if (!confirm(`¿Dar de baja la aplicación "${app.nombre}"?`)) return;
    this.middlewareService.deleteApp(app.id).subscribe({
      next: () => { this.showToast('Aplicación dada de baja', 'success'); this.loadApps(); },
      error: () => this.showToast('Error al dar de baja', 'error'),
    });
  }

  // --- Roles ---

  loadAvailableRoles() {
    if (!this.selectedApp) return;
    this.loadingRoles = true;
    this.resolveLinkedAplicacion(this.selectedApp.id_aplicacion);

    const idApp = this.selectedApp.id_aplicacion;
    if (!idApp) {
      this.availableRoles = [];
      this.rolesDeApp = [];
      this.loadingRoles = false;
      return;
    }

    forkJoin({
      roles: this.middlewareService.getRolesByAplicacion(idApp, false),
      usuarioRoles: this.middlewareService.getUsuarioRoles(false),
      usuarios: this.middlewareService.getUsuarios(false),
      aplicaciones: this.middlewareService.getAplicaciones(false),
    }).subscribe({
      next: ({ roles, usuarioRoles, usuarios, aplicaciones }) => {
        const rolesList = Array.isArray(roles) ? roles : [];
        this.rolesDeApp = rolesList;
        this.availableRoles = rolesList;

        this.usuarioRoles = Array.isArray(usuarioRoles) ? usuarioRoles : [];

        this.usuariosMap.clear();
        (Array.isArray(usuarios) ? usuarios : []).forEach(u => this.usuariosMap.set(u.id, u));

        this.rolesDescMap.clear();
        rolesList.forEach(r => this.rolesDescMap.set(r.id, r.descripcion));

        this.aplicacionesMap.clear();
        (Array.isArray(aplicaciones) ? aplicaciones : []).forEach(a => this.aplicacionesMap.set(a.id, a.descripcion));

        this.loadingRoles = false;
      },
      error: () => {
        this.availableRoles = [];
        this.rolesDeApp = [];
        this.loadingRoles = false;
        this.showToast('No se pudo cargar los roles. Verifica que el servicio de roles esté activo.', 'warning');
      }
    });
  }

  getRoleDescription(idRole: string): string {
    return this.rolesDescMap.get(idRole) || '';
  }

  getRolObject(idRole: string): Rol | undefined {
    return this.rolesDeApp.find(r => r.id === idRole);
  }

  getAplicacionDescription(idAplicacion: string): string {
    return this.aplicacionesMap.get(idAplicacion) || '';
  }

  getUsersForRole(idRole: string): { id: string; nombre: string; apellido: string; nombre_usuario: string }[] {
    if (!this.selectedApp) return [];
    const idApp = this.selectedApp.id_aplicacion;
    return this.usuarioRoles
      .filter(ur => ur.id_rol === idRole && (!idApp || ur.id_aplicacion === idApp))
      .map(ur => {
        const u = this.usuariosMap.get(ur.id_usuario);
        return u
          ? { id: u.id, nombre: u.nombre, apellido: u.apellido, nombre_usuario: u.nombre_usuario }
          : { id: ur.id_usuario, nombre: ur.id_usuario, apellido: '', nombre_usuario: '' };
      })
      .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i);
  }

  isRoleAssigned(roleId: string): boolean {
    return this.selectedApp?.roles?.some(r => r.id_role === roleId) || false;
  }

  assignRole(role: Rol) {
    if (!this.selectedApp) return;
    this.middlewareService.addAppRole(this.selectedApp.id, {
      id_role: role.id,
      role_nombre: role.descripcion || role.id,
    }).subscribe({
      next: () => {
        this.syncAplicacionRole(this.selectedApp!.id_aplicacion, role.id);
        this.showToast('Rol asignado', 'success');
        this.refreshSelectedApp();
      },
      error: (err) => this.showToast(err.error?.detail || 'Error al asignar rol', 'error'),
    });
  }

  unassignRole(role: AppRoleConfig) {
    if (!this.selectedApp) return;
    if (!confirm(`¿Remover el rol "${role.role_nombre}"?`)) return;
    this.middlewareService.removeAppRole(this.selectedApp.id, role.id).subscribe({
      next: () => {
        this.showToast('Rol removido', 'success');
        this.refreshSelectedApp();
      },
      error: () => this.showToast('Error al remover rol', 'error'),
    });
  }

  private syncAplicacionRole(idAplicacion: string | undefined, idRole: string) {
    if (!idAplicacion) return;
    this.middlewareService.createAplicacionRole({
      id_aplicacion: idAplicacion,
      id_role: idRole
    }).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  // --- Modules ---

  loadAllBackendServices() {
    this.middlewareService.getBackendServices(false).subscribe({
      next: (svcs) => this.allBackendServices = svcs,
      error: () => {}
    });
  }

  loadModulesData() {
    this.selectedRoleId = '';
    this.availableServices = [];
    this.loadModuleSummary();
  }

  loadModuleSummary() {
    if (!this.selectedApp || this.selectedApp.roles.length === 0) {
      this.roleModuleSummary = [];
      return;
    }
    this.loadingModuleSummary = true;
    this.roleModuleSummary = [];

    const roles = this.selectedApp.roles;
    let loaded = 0;

    roles.forEach(role => {
      this.middlewareService.getAppRoleModules(this.selectedApp!.id, role.id).subscribe({
        next: (modules) => {
          const enabledModules = modules.filter(m => m.is_enabled);
          this.roleModuleSummary.push({
            roleConfigId: role.id,
            roleName: role.role_nombre,
            idRole: role.id_role,
            moduleCount: enabledModules.length,
            modules: enabledModules.map(m => ({
              service: this.allBackendServices.find(s => s.id === m.backend_service_id)?.nombre || m.backend_service_id,
              endpoint: m.endpoint_path,
              method: m.metodo.toUpperCase(),
            })),
          });
          loaded++;
          if (loaded === roles.length) this.loadingModuleSummary = false;
        },
        error: () => {
          this.roleModuleSummary.push({
            roleConfigId: role.id,
            roleName: role.role_nombre,
            idRole: role.id_role,
            moduleCount: 0,
            modules: [],
          });
          loaded++;
          if (loaded === roles.length) this.loadingModuleSummary = false;
        }
      });
    });
  }

  onRoleSelected() {
    if (!this.selectedRoleId || !this.selectedApp) return;
    this.loadingModules = true;

    const roleConfigId = parseInt(this.selectedRoleId);

    this.middlewareService.getBackendServices(false).subscribe({
      next: (services) => {
        const activeServices = services.filter(s => !s.baja_logica);
        let loaded = 0;
        this.availableServices = [];

        if (activeServices.length === 0) {
          this.loadingModules = false;
          return;
        }

        activeServices.forEach(svc => {
          this.middlewareService.inspectService(svc.id).subscribe({
            next: (inspectData) => {
              const enabledEndpoints = (inspectData.endpoints || []).filter((ep: any) => ep.is_enabled);
              if (enabledEndpoints.length > 0) {
                this.availableServices.push({
                  ...svc,
                  endpoints: enabledEndpoints,
                  _expanded: false,
                });
              }
              loaded++;
              if (loaded === activeServices.length) {
                this.markExistingModules(roleConfigId);
                this.loadingModules = false;
              }
            },
            error: () => {
              loaded++;
              if (loaded === activeServices.length) {
                this.markExistingModules(roleConfigId);
                this.loadingModules = false;
              }
            }
          });
        });
      },
      error: () => { this.loadingModules = false; }
    });
  }

  private markExistingModules(roleConfigId: number) {
    if (!this.selectedApp) return;
    this.middlewareService.getAppRoleModules(this.selectedApp.id, roleConfigId).subscribe({
      next: (modules) => {
        const enabledSet = new Set(
          modules.filter(m => m.is_enabled).map(m => `${m.backend_service_id}:${m.metodo}:${m.endpoint_path}`)
        );
        for (const svc of this.availableServices) {
          for (const ep of svc.endpoints) {
            ep._selected = enabledSet.has(`${svc.id}:${ep.method}:${ep.path}`);
          }
        }
      },
      error: () => {}
    });
  }

  isServiceFullySelected(svc: any): boolean {
    return svc.endpoints?.every((ep: any) => ep._selected) || false;
  }

  toggleService(svc: any, event: any) {
    const checked = event.target.checked;
    svc.endpoints?.forEach((ep: any) => ep._selected = checked);
  }

  saveRoleModules() {
    if (!this.selectedApp || !this.selectedRoleId) return;
    const roleConfigId = parseInt(this.selectedRoleId);
    const modules: any[] = [];

    for (const svc of this.availableServices) {
      for (const ep of svc.endpoints) {
        if (ep._selected) {
          modules.push({
            backend_service_id: svc.id,
            endpoint_path: ep.path,
            metodo: ep.method,
            is_enabled: true,
          });
        }
      }
    }

    this.middlewareService.setAppRoleModules(this.selectedApp.id, roleConfigId, modules).subscribe({
      next: () => {
        this.showToast('Módulos guardados correctamente', 'success');
        this.loadModuleSummary();
      },
      error: () => this.showToast('Error al guardar módulos', 'error'),
    });
  }

  getMethodBadgeClass(method: string): string {
    const map: Record<string, string> = {
      get: 'bg-success', post: 'bg-primary', put: 'bg-warning text-dark',
      patch: 'bg-info', delete: 'bg-danger'
    };
    return map[method.toLowerCase()] || 'bg-secondary';
  }

  // --- Menu ---

  loadMenuData() {
    if (!this.selectedApp) return;
    this.middlewareService.getAppMenu(this.selectedApp.id).subscribe({
      next: (menu) => { this.menuItems = menu.menu_structure || []; },
      error: () => { this.menuItems = []; }
    });
  }

  autoGenerateMenu() {
    if (!this.selectedApp) return;
    this.middlewareService.autoGenerateMenu(this.selectedApp.id).subscribe({
      next: (menu) => {
        this.menuItems = menu.menu_structure || [];
        this.showToast('Menú generado automáticamente', 'success');
      },
      error: (err) => this.showToast(err.error?.detail || 'Error al generar menú', 'error'),
    });
  }

  addMenuItem() {
    const id = 'item-' + Math.random().toString(36).substring(7);
    this.menuItems.push({
      id, label: 'Nuevo Item', icon: 'bi-circle', order: this.menuItems.length,
      children: [],
    });
  }

  addChildItem(parent: MenuItem) {
    const id = 'child-' + Math.random().toString(36).substring(7);
    if (!parent.children) parent.children = [];
    parent.children.push({
      id, label: 'Sub-item', icon: 'bi-circle', order: parent.children.length,
      children: [],
    });
  }

  removeMenuItem(idx: number) { this.menuItems.splice(idx, 1); }
  removeChildItem(parent: MenuItem, idx: number) { parent.children.splice(idx, 1); }

  selectMenuItem(item: MenuItem) { this.selectedMenuItem = item; }

  moveItem(idx: number, direction: number) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= this.menuItems.length) return;
    [this.menuItems[idx], this.menuItems[newIdx]] = [this.menuItems[newIdx], this.menuItems[idx]];
  }

  saveMenu() {
    if (!this.selectedApp) return;
    this.menuItems.forEach((item, i) => {
      item.order = i;
      item.children?.forEach((c, ci) => c.order = ci);
    });
    this.middlewareService.saveAppMenu(this.selectedApp.id, this.menuItems).subscribe({
      next: () => {
        this.showToast('Menú guardado correctamente', 'success');
        this.refreshSelectedApp();
      },
      error: () => this.showToast('Error al guardar menú', 'error'),
    });
  }

  // --- URL & Access Check ---

  copyUrl() {
    if (!this.selectedApp) return;
    const url = `${this.runtimeBaseUrl}/${this.selectedApp.slug}`;
    navigator.clipboard.writeText(url).then(
      () => this.showToast('URL copiada al portapapeles', 'success'),
      () => this.showToast('No se pudo copiar', 'error')
    );
  }

  openAppUrl() {
    if (!this.selectedApp) return;
    this.checkingAccess = true;
    this.accessCheckResult = null;
    this.runtimeUnreachable = false;

    this.middlewareService.checkAppAccess(this.selectedApp.id).subscribe({
      next: (result) => {
        this.accessCheckResult = result;
        if (result.can_access) {
          this.checkRuntimeReachability().then(reachable => {
            this.checkingAccess = false;
            if (reachable) {
              window.open(`${this.runtimeBaseUrl}/${this.selectedApp!.slug}`, '_blank');
            } else {
              this.runtimeUnreachable = true;
            }
          });
        } else {
          this.checkingAccess = false;
        }
      },
      error: () => {
        this.checkingAccess = false;
        this.showToast('Error al verificar acceso de la aplicación', 'error');
      }
    });
  }

  runAccessCheck() {
    if (!this.selectedApp) return;
    this.checkingAccess = true;
    this.accessCheckResult = null;
    this.runtimeUnreachable = false;

    this.middlewareService.checkAppAccess(this.selectedApp.id).subscribe({
      next: (result) => {
        this.accessCheckResult = result;
        this.checkRuntimeReachability().then(reachable => {
          this.runtimeUnreachable = !reachable;
          this.checkingAccess = false;
        });
      },
      error: () => {
        this.checkingAccess = false;
        this.showToast('Error al verificar acceso', 'error');
      }
    });
  }

  private async checkRuntimeReachability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(this.runtimeBaseUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  // --- Helpers ---

  private refreshSelectedApp() {
    if (!this.selectedApp) return;
    this.middlewareService.getApp(this.selectedApp.id).subscribe({
      next: (app) => this.selectedApp = app,
      error: () => {}
    });
  }

  private showToast(msg: string, type: 'success' | 'error' | 'warning') {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => this.toastMessage = '', 4000);
  }
}
