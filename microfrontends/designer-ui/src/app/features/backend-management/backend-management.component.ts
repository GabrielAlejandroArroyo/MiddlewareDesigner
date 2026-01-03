import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MiddlewareService, BackendService } from '../../core/services/middleware.service';

@Component({
  selector: 'app-backend-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0 fw-bold">Gestión de Microservicios</h2>
        <div class="d-flex gap-2">
          <!-- Botón para abrir modal de registro (Solo en Activos o Todos) -->
          <button *ngIf="filterTab !== 'inactive'" (click)="showRegisterModal = true" class="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
            <span class="fs-4 line-height-1">+</span> Registrar Backend
          </button>
          
          <div class="btn-group shadow-sm" role="group">
            <button type="button" class="btn btn-outline-secondary" 
                    [class.active]="viewMode === 'cards'"
                    (click)="viewMode = 'cards'">
              <span class="small">Cuadrícula</span>
            </button>
            <button type="button" class="btn btn-outline-secondary" 
                    [class.active]="viewMode === 'list'"
                    (click)="viewMode = 'list'">
              <span class="small">Lista</span>
            </button>
          </div>

          <button class="btn btn-light border shadow-sm" (click)="loadServices()">
            Refrescar
          </button>
        </div>
      </div>

      <!-- Filtro por Tabs -->
      <ul class="nav nav-tabs mb-4 border-bottom-0">
        <li class="nav-item">
          <button class="nav-link px-4 fw-bold" [class.active]="filterTab === 'active'" 
                  (click)="setFilter('active')">Activos</button>
        </li>
        <li class="nav-item">
          <button class="nav-link px-4 fw-bold" [class.active]="filterTab === 'inactive'" 
                  (click)="setFilter('inactive')">Inactivos</button>
        </li>
        <li class="nav-item">
          <button class="nav-link px-4 fw-bold" [class.active]="filterTab === 'all'" 
                  (click)="setFilter('all')">Todos</button>
        </li>
      </ul>

      <!-- Indicador de carga -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted">Cargando microservicios...</p>
      </div>

      <!-- Estado vacío (Solo para Activos y Todos) -->
      <div *ngIf="!loading && services.length === 0 && filterTab !== 'inactive'" class="text-center py-5 bg-light rounded-4 border-dashed">
        <h4 class="text-muted">No hay microservicios registrados</h4>
        <p class="text-muted mb-4">Comienza registrando tu primer backend haciendo clic en el botón superior.</p>
        <button (click)="showRegisterModal = true" class="btn btn-primary">Registrar mi primer Backend</button>
      </div>

      <!-- Estado vacío específico para Inactivos -->
      <div *ngIf="!loading && services.length === 0 && filterTab === 'inactive'" class="text-center py-5">
        <p class="text-muted italic">No hay microservicios en baja lógica actualmente.</p>
      </div>

      <!-- Vista de Tarjetas (Cards) -->
      <div *ngIf="!loading && services.length > 0 && viewMode === 'cards'" class="row g-4">
        <div *ngFor="let svc of services" class="col-12 col-md-6 col-lg-4 col-xl-3">
          <div class="card h-100 shadow-sm border-0 service-card" [class.opacity-75]="svc.baja_logica" style="min-height: 280px;">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <span class="badge px-2 py-1" [ngClass]="svc.baja_logica ? 'bg-secondary' : 'bg-info bg-opacity-10 text-info'">
                  {{ svc.id }} {{ svc.baja_logica ? '(INACTIVO)' : '' }}
                </span>
                <div class="dropdown">
                  <button *ngIf="!svc.baja_logica" class="btn btn-link p-0 text-muted me-2" type="button" (click)="openEditModal(svc)" title="Editar información">
                    <i class="bi bi-pencil-square text-primary"></i>
                  </button>
                  <button *ngIf="!svc.baja_logica" class="btn btn-link p-0 text-muted" type="button" (click)="confirmDelete(svc)" title="Eliminar servicio">
                    <i class="bi bi-trash3 text-danger"></i>
                  </button>
                  <button *ngIf="svc.baja_logica" class="btn btn-link p-0 text-muted" type="button" (click)="reactivate(svc.id)" title="Activar servicio">
                    <i class="bi bi-check-circle text-success"></i>
                  </button>
                </div>
              </div>
              <h5 class="card-title mb-1 fw-bold">{{ svc.nombre }}</h5>
              <p class="card-text text-muted small mb-3 text-truncate-2">{{ svc.descripcion || 'Sin descripción' }}</p>
              
              <!-- Indicador de cambios en Swagger -->
              <div *ngIf="svc.has_swagger_changes && !svc.baja_logica" class="alert alert-warning py-2 px-3 mb-3 small">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>Cambios detectados</strong> en el Swagger
              </div>
              
              <div class="mt-auto border-top pt-3">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <div class="icon-circle bg-light">
                    <span class="small fw-bold">URL</span>
                  </div>
                  <code class="small text-primary text-truncate">{{ svc.host }}:{{ svc.puerto }}</code>
                </div>
                <div *ngIf="!svc.baja_logica" class="d-flex flex-column gap-2">
                  <button [routerLink]="['/inspect', svc.id]" class="btn btn-primary w-100 py-2 shadow-sm" title="Inspeccionar Contrato">
                    <i class="bi bi-search fs-5"></i>
                  </button>
                  <button *ngIf="svc.has_swagger_changes" 
                          (click)="refreshSwagger(svc.id)" 
                          class="btn btn-warning w-100 btn-sm">
                    <i class="bi bi-arrow-clockwise me-2"></i> Actualizar Swagger
                  </button>
                </div>
                <div *ngIf="svc.baja_logica" class="alert alert-secondary py-2 px-3 mb-0 small text-center">
                  Servicio Inactivo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de Lista -->
      <div *ngIf="!loading && services.length > 0 && viewMode === 'list'" class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th class="ps-4">ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Endpoint Base</th>
                <th class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let svc of services" [class.table-light]="svc.baja_logica" [class.text-muted]="svc.baja_logica">
                <td class="ps-4">
                  <span class="badge border" [ngClass]="svc.baja_logica ? 'bg-secondary text-white' : 'bg-light text-dark'">
                    {{ svc.id }}
                  </span>
                </td>
                <td>
                  <span class="fw-bold">{{ svc.nombre }}</span>
                  <span *ngIf="svc.baja_logica" class="ms-2 small badge bg-secondary">INACTIVO</span>
                </td>
                <td><span class="small">{{ svc.descripcion }}</span></td>
                <td><code class="small">{{ svc.host }}:{{ svc.puerto }}</code></td>
                <td class="text-end pe-4">
                  <div class="btn-group">
                    <button *ngIf="!svc.baja_logica" (click)="openEditModal(svc)" class="btn btn-sm btn-outline-secondary" title="Editar">
                      <i class="bi bi-pencil-square"></i>
                    </button>
                    <button *ngIf="!svc.baja_logica" [routerLink]="['/inspect', svc.id]" class="btn btn-sm btn-outline-primary" title="Inspeccionar Contrato">
                      <i class="bi bi-search"></i>
                    </button>
                    <button *ngIf="!svc.baja_logica" (click)="confirmDelete(svc)" class="btn btn-sm btn-outline-danger" title="Eliminar">
                      <i class="bi bi-trash3"></i>
                    </button>
                    <button *ngIf="svc.baja_logica" (click)="reactivate(svc.id)" class="btn btn-sm btn-outline-success" title="Activar">
                      <i class="bi bi-check-lg"></i>
                    </button>
                    <button *ngIf="svc.baja_logica" (click)="confirmDelete(svc)" class="btn btn-sm btn-outline-danger" title="Eliminar Definitivo">
                      <i class="bi bi-trash3-fill"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Registro (Contextual) -->
    <div *ngIf="showRegisterModal" class="custom-modal-overlay">
      <div class="custom-modal shadow-lg p-0 bg-white rounded-4 overflow-hidden animate-in">
        <div class="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
          <h4 class="mb-0 fw-bold text-primary">Registrar Nuevo Backend</h4>
          <button (click)="showRegisterModal = false" class="btn-close"></button>
        </div>
        <div class="p-4">
          <div class="mb-3">
            <label class="form-label fw-bold small">ID del Servicio</label>
            <input type="text" [(ngModel)]="newService.id" class="form-control form-control-lg fs-6" 
                   placeholder="ej: pais-api">
            <div class="form-text">Identificador único (letras, números y guiones).</div>
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold small">URL completa del openapi.json</label>
            <input type="text" [(ngModel)]="newService.openapi_url" class="form-control form-control-lg fs-6" 
                   placeholder="http://127.0.0.1:8000/openapi.json">
            <div class="form-text">El middleware intentará leer el contrato desde esta URL.</div>
          </div>
          <div class="mb-4">
            <label class="form-label fw-bold small">Descriptor / Descripción</label>
            <textarea [(ngModel)]="newService.descripcion" class="form-control fs-6" rows="2" 
                      placeholder="Breve descripción del propósito del servicio"></textarea>
          </div>
          
          <div class="d-flex gap-2">
            <button (click)="showRegisterModal = false" class="btn btn-light border flex-grow-1 py-2">Cancelar</button>
            <button (click)="register()" class="btn btn-primary flex-grow-1 py-2 shadow-sm fw-bold">Registrar Backend</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div *ngIf="editingService" class="custom-modal-overlay">
      <div class="custom-modal shadow-lg p-0 bg-white rounded-4 overflow-hidden animate-in">
        <div class="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
          <h4 class="mb-0 fw-bold text-primary">Editar Backend: {{ editingService.id }}</h4>
          <button (click)="editingService = null" class="btn-close"></button>
        </div>
        <div class="p-4">
          <div class="mb-3">
            <label class="form-label fw-bold small">Nombre del Servicio</label>
            <input type="text" [(ngModel)]="editingService.nombre" class="form-control fs-6" 
                   placeholder="ej: Microservicio de Países">
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold small">URL completa del openapi.json</label>
            <input type="text" [(ngModel)]="editingService.openapi_url" class="form-control fs-6" 
                   placeholder="http://127.0.0.1:8000/openapi.json">
          </div>
          <div class="mb-4">
            <label class="form-label fw-bold small">Descripción</label>
            <textarea [(ngModel)]="editingService.descripcion" class="form-control fs-6" rows="2" 
                      placeholder="Breve descripción del propósito del servicio"></textarea>
          </div>
          
          <div class="d-flex gap-2">
            <button (click)="editingService = null" class="btn btn-light border flex-grow-1 py-2">Cancelar</button>
            <button (click)="update()" class="btn btn-primary flex-grow-1 py-2 shadow-sm fw-bold">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Eliminación -->
    <div *ngIf="serviceToDelete" class="custom-modal-overlay">
      <div class="custom-modal shadow-lg p-0 bg-white rounded-4 overflow-hidden animate-in">
        <div class="p-4 border-bottom bg-danger bg-opacity-10 d-flex justify-content-between align-items-center">
          <h4 class="mb-0 fw-bold text-danger">Eliminar Servicio</h4>
          <button (click)="serviceToDelete = null" class="btn-close"></button>
        </div>
        <div class="p-4">
          <p class="mb-4">¿Cómo deseas proceder con la eliminación de <strong>{{ serviceToDelete.id }}</strong>?</p>
          
          <div class="card mb-4 border-warning bg-warning bg-opacity-10">
            <div class="card-body p-3">
              <div class="d-flex gap-2 mb-2">
                <span class="text-warning fw-bold">!</span>
                <span class="small fw-bold">Nota sobre tipos de baja:</span>
              </div>
              <ul class="small mb-0 ps-3">
                <li><strong>Baja Lógica:</strong> El servicio se oculta pero se conserva su configuración.</li>
                <li><strong>Baja Definitiva:</strong> Se elimina completamente de la base de datos (solo si no tiene referencias).</li>
              </ul>
            </div>
          </div>

          <div class="d-flex flex-column gap-2">
            <button (click)="delete(false)" class="btn btn-outline-warning py-2">Realizar Baja Lógica</button>
            <button (click)="delete(true)" class="btn btn-danger py-2 fw-bold">Realizar Baja Definitiva</button>
            <button (click)="serviceToDelete = null" class="btn btn-light border py-2 mt-2">Conservar Servicio</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BackendManagementComponent implements OnInit {
  private service = inject(MiddlewareService);
  private router = inject(Router);
  
  services: BackendService[] = [];
  allServicesRaw: BackendService[] = [];
  newService: Partial<BackendService> = {};
  editingService: Partial<BackendService> | null = null;
  showRegisterModal = false;
  serviceToDelete: BackendService | null = null;
  viewMode: 'cards' | 'list' = 'cards';
  filterTab: 'active' | 'inactive' | 'all' = 'active';
  loading = false;

  ngOnInit() {
    this.loadServices();
  }

  setFilter(tab: 'active' | 'inactive' | 'all') {
    this.filterTab = tab;
    this.applyFilter();
  }

  loadServices() {
    this.loading = true;
    // Usar el endpoint que verifica cambios automáticamente
    this.service.getBackendServicesWithChanges(true).subscribe({
      next: (data) => {
        this.allServicesRaw = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        // Fallback al endpoint normal si falla
        this.service.getBackendServices(true).subscribe({
          next: (data) => {
            this.allServicesRaw = data;
            this.applyFilter();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      }
    });
  }

  refreshSwagger(serviceId: string) {
    if (!confirm('¿Deseas actualizar el Swagger conservando la configuración actual de endpoints?')) {
      return;
    }

    this.service.refreshSwagger(serviceId, true).subscribe({
      next: (res) => {
        alert(`Swagger actualizado correctamente.\n${res.preserved_mappings ? `Mapeos preservados: ${res.preserved_mappings}` : ''}\n${res.removed_endpoints ? `Endpoints removidos: ${res.removed_endpoints}` : ''}`);
        this.loadServices();
      },
      error: (err) => {
        alert('Error al actualizar Swagger: ' + (err.error?.detail || err.message));
      }
    });
  }

  applyFilter() {
    if (this.filterTab === 'active') {
      this.services = this.allServicesRaw.filter(s => !s.baja_logica);
    } else if (this.filterTab === 'inactive') {
      this.services = this.allServicesRaw.filter(s => s.baja_logica);
    } else {
      this.services = [...this.allServicesRaw];
    }
  }

  register() {
    if (!this.newService.id || !this.newService.openapi_url) {
      alert('Por favor, ingresa el ID y la URL del openapi.json');
      return;
    }

    this.service.registerBackend(this.newService).subscribe({
      next: (response) => {
        this.loadServices();
        this.newService = {};
        this.showRegisterModal = false;
        // Verificar si fue una actualización o un registro nuevo
        const message = response.swagger_hash ? 
          'Servicio actualizado correctamente. El Swagger ha sido refrescado.' : 
          'Servicio registrado correctamente.';
        alert(message);
      },
      error: (err) => {
        console.error('Error detallado:', err);
        let msg = 'Error de comunicación con el Middleware.';
        if (err.status === 0) {
          msg = 'No se pudo conectar con el Middleware (Puerto 9000).';
        } else if (err.error?.detail) {
          msg = typeof err.error.detail === 'string' ? err.error.detail : JSON.stringify(err.error.detail, null, 2);
        } else {
          msg = err.message;
        }
        alert('Error al registrar:\n' + msg);
      }
    });
  }

  openEditModal(svc: BackendService) {
    // Clonar para no modificar la referencia original hasta guardar
    this.editingService = { ...svc };
  }

  update() {
    if (!this.editingService || !this.editingService.id || !this.editingService.openapi_url) {
      alert('Datos incompletos para actualizar');
      return;
    }

    this.service.registerBackend(this.editingService).subscribe({
      next: () => {
        this.loadServices();
        this.editingService = null;
        alert('Servicio actualizado correctamente');
      },
      error: (err) => {
        const msg = err.error?.detail || err.message;
        alert('Error al actualizar:\n' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
      }
    });
  }

  confirmDelete(svc: BackendService) {
    this.serviceToDelete = svc;
  }

  reactivate(id: string) {
    this.service.reactivateBackend(id).subscribe({
      next: (res) => {
        alert(res.message);
        this.loadServices();
      },
      error: (err) => alert('Error al reactivar: ' + err.message)
    });
  }

  delete(physical: boolean) {
    if (!this.serviceToDelete) return;

    this.service.deleteBackend(this.serviceToDelete.id, physical).subscribe({
      next: (res) => {
        alert(res.message);
        this.serviceToDelete = null;
        this.loadServices();
      },
      error: (err) => {
        const msg = err.error?.detail || err.message;
        alert('No se pudo eliminar:\n' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
      }
    });
  }
}
