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

      <!-- Estado vacío (Solo para Activos y Todos) -->
      <div *ngIf="services.length === 0 && filterTab !== 'inactive'" class="text-center py-5 bg-light rounded-4 border-dashed">
        <h4 class="text-muted">No hay microservicios registrados</h4>
        <p class="text-muted mb-4">Comienza registrando tu primer backend haciendo clic en el botón superior.</p>
        <button (click)="showRegisterModal = true" class="btn btn-primary">Registrar mi primer Backend</button>
      </div>

      <!-- Estado vacío específico para Inactivos -->
      <div *ngIf="services.length === 0 && filterTab === 'inactive'" class="text-center py-5">
        <p class="text-muted italic">No hay microservicios en baja lógica actualmente.</p>
      </div>

      <!-- Vista de Tarjetas (Cards) -->
      <div *ngIf="services.length > 0 && viewMode === 'cards'" class="row g-4">
        <div *ngFor="let svc of services" class="col-12 col-md-6 col-lg-4 col-xl-3">
          <div class="card h-100 shadow-sm border-0 service-card" [class.opacity-75]="svc.baja_logica">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <span class="badge px-2 py-1" [ngClass]="svc.baja_logica ? 'bg-secondary' : 'bg-info bg-opacity-10 text-info'">
                  {{ svc.id }} {{ svc.baja_logica ? '(INACTIVO)' : '' }}
                </span>
                <div class="dropdown">
                  <button *ngIf="!svc.baja_logica" class="btn btn-link p-0 text-muted" type="button" (click)="confirmDelete(svc)">
                    <span class="text-danger small">Eliminar</span>
                  </button>
                  <button *ngIf="svc.baja_logica" class="btn btn-link p-0 text-muted" type="button" (click)="reactivate(svc.id)">
                    <span class="text-success small fw-bold">Activar</span>
                  </button>
                </div>
              </div>
              <h5 class="card-title mb-1 fw-bold">{{ svc.nombre }}</h5>
              <p class="card-text text-muted small mb-3 text-truncate-2">{{ svc.descripcion || 'Sin descripción' }}</p>
              
              <div class="mt-auto border-top pt-3">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <div class="icon-circle bg-light">
                    <span class="small fw-bold">URL</span>
                  </div>
                  <code class="small text-primary text-truncate">{{ svc.host }}:{{ svc.puerto }}</code>
                </div>
                <button *ngIf="!svc.baja_logica" [routerLink]="['/inspect', svc.id]" class="btn btn-outline-primary w-100">
                  Inspeccionar Contrato
                </button>
                <div *ngIf="svc.baja_logica" class="alert alert-secondary py-2 px-3 mb-0 small text-center">
                  Servicio Inactivo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista de Lista -->
      <div *ngIf="services.length > 0 && viewMode === 'list'" class="card shadow-sm border-0">
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
                    <button *ngIf="!svc.baja_logica" [routerLink]="['/inspect', svc.id]" class="btn btn-sm btn-outline-primary">Inspeccionar</button>
                    <button *ngIf="!svc.baja_logica" (click)="confirmDelete(svc)" class="btn btn-sm btn-outline-danger">Eliminar</button>
                    <button *ngIf="svc.baja_logica" (click)="reactivate(svc.id)" class="btn btn-sm btn-outline-success">Activar</button>
                    <button *ngIf="svc.baja_logica" (click)="confirmDelete(svc)" class="btn btn-sm btn-outline-danger">Eliminar Definitivo</button>
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

    <style>
      .line-height-1 { line-height: 1; }
      .border-dashed { border: 2px dashed #dee2e6; }
      .service-card { transition: transform 0.2s, box-shadow 0.2s; }
      .service-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; }
      .text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .icon-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; }
      
      .nav-tabs .nav-link { color: #6c757d; border: none; border-bottom: 3px solid transparent; }
      .nav-tabs .nav-link.active { color: #0d6efd; border-bottom: 3px solid #0d6efd; background: transparent; }
      
             .custom-modal-overlay {
               position: fixed; top: 0; left: 0; width: 100%; height: 100%;
               background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
               display: flex; align-items: center; justify-content: center; z-index: 9999 !important;
             }
      .custom-modal { max-width: 450px; width: 90%; }
      .animate-in { animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      
      @keyframes modalIn {
        from { opacity: 0; transform: scale(0.9) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    </style>
  `
})
export class BackendManagementComponent implements OnInit {
  private service = inject(MiddlewareService);
  private router = inject(Router);
  
  services: BackendService[] = [];
  allServicesRaw: BackendService[] = [];
  newService: Partial<BackendService> = {};
  showRegisterModal = false;
  serviceToDelete: BackendService | null = null;
  viewMode: 'cards' | 'list' = 'cards';
  filterTab: 'active' | 'inactive' | 'all' = 'active';

  ngOnInit() {
    this.loadServices();
  }

  setFilter(tab: 'active' | 'inactive' | 'all') {
    this.filterTab = tab;
    this.applyFilter();
  }

  loadServices() {
    // Siempre pedimos con include_deleted=true para poder filtrar localmente en los tabs
    this.service.getBackendServices(true).subscribe(data => {
      this.allServicesRaw = data;
      this.applyFilter();
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
      next: () => {
        this.loadServices();
        this.newService = {};
        this.showRegisterModal = false;
        alert('Servicio registrado correctamente.');
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
