import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MiddlewareService, BackendService, Endpoint } from '../../core/services/middleware.service';

interface PageFlow {
  id: string;
  name: string;
  type: 'dashboard' | 'admin' | 'portal' | 'custom';
  menu_items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  target_service_id: string;
  target_endpoint_path: string;
  target_endpoint_method: string;
  children: MenuItem[];
}

@Component({
  selector: 'app-custom-page-designer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <!-- Header Flotante -->
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
                <li class="breadcrumb-item active" aria-current="page">Diseñador de Flujos y Páginas</li>
              </ol>
            </nav>
            <h2 class="mb-0 fw-bold">Diseñador de Flujos y Páginas</h2>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary shadow-sm fw-bold" (click)="createNewFlow()">
              <i class="bi bi-plus-lg me-2"></i> Nuevo Proyecto
            </button>
            <button class="btn btn-primary shadow-sm fw-bold" *ngIf="activeFlow" (click)="saveFlow()">
              <i class="bi bi-save me-2"></i> Guardar Proyecto
            </button>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Sidebar: Proyectos y Estructura -->
        <div class="col-md-3">
          <div class="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
            <div class="card-header bg-dark text-white py-3 fw-bold">
              <i class="bi bi-folder2-open me-2"></i> Proyectos Guardados
            </div>
            <div class="list-group list-group-flush">
              <div *ngIf="flows.length === 0" class="p-4 text-center text-muted small">
                No hay proyectos creados.
              </div>
              <button *ngFor="let flow of flows" 
                      class="list-group-item list-group-item-action py-3 px-4 d-flex justify-content-between align-items-center"
                      [class.active]="activeFlow?.id === flow.id"
                      (click)="activeFlow = flow">
                <div>
                    <span class="d-block fw-bold">{{ flow.name }}</span>
                    <span class="x-small text-muted">{{ flow.type | uppercase }}</span>
                </div>
                <i class="bi bi-chevron-right small"></i>
              </button>
            </div>
          </div>

          <div *ngIf="activeFlow" class="card shadow-sm border-0 rounded-4 overflow-hidden animate-in">
            <div class="card-header bg-primary text-white py-3 fw-bold d-flex justify-content-between">
              <span><i class="bi bi-list-task me-2"></i> Estructura de Menú</span>
              <button class="btn btn-xs btn-light py-0 px-1" (click)="addMenuItem()">
                <i class="bi bi-plus"></i>
              </button>
            </div>
            <div class="card-body p-0">
                <div class="menu-tree p-2">
                    <div *ngFor="let item of activeFlow.menu_items" class="menu-node mb-2">
                        <div class="d-flex align-items-center p-2 rounded-3 border bg-white shadow-xs"
                             [class.border-primary]="selectedMenuItem === item"
                             (click)="selectedMenuItem = item">
                            <i class="bi" [class]="item.icon || 'bi-circle'" class="me-2 text-muted"></i>
                            <span class="flex-grow-1 small fw-medium">{{ item.label || 'Nuevo Item' }}</span>
                            <button class="btn btn-xs btn-link text-danger p-0 ms-2" (click)="removeMenuItem(item)">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <!-- Editor Central -->
        <div class="col-md-9">
          <div *ngIf="!activeFlow" class="card shadow-sm border-0 bg-white py-5 text-center rounded-4">
            <div class="card-body">
              <i class="bi bi-layout-text-window-reverse text-muted" style="font-size: 4rem opacity: 0.2"></i>
              <h4 class="mt-4 fw-bold text-muted">Diseña tu experiencia de usuario</h4>
              <p class="text-muted mx-auto" style="max-width: 500px">
                Crea un nuevo proyecto para definir el tipo de aplicación, estructurar el menú de navegación y configurar el flujo entre los microservicios generados.
              </p>
              <button class="btn btn-primary mt-3 px-4 fw-bold shadow-sm" (click)="createNewFlow()">
                EMPEZAR A DISEÑAR
              </button>
            </div>
          </div>

          <div *ngIf="activeFlow" class="animate-in">
            <!-- Paso 1: Configuración General -->
            <div class="card shadow-sm border-0 rounded-4 mb-4">
              <div class="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center">
                <div class="icon-circle bg-info-subtle text-info me-3" style="width: 32px; height: 32px">1</div>
                <h6 class="fw-bold mb-0">Configuración General de la Aplicación</h6>
              </div>
              <div class="card-body p-4">
                <div class="row g-4">
                  <div class="col-md-6">
                    <label class="form-label fw-bold small text-muted text-uppercase">Nombre de la Aplicación</label>
                    <input type="text" class="form-control" [(ngModel)]="activeFlow.name" placeholder="Ej: Mi Portal de Administración">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold small text-muted text-uppercase">Tipo de Aplicación</label>
                    <select class="form-select" [(ngModel)]="activeFlow.type">
                      <option value="dashboard">Dashboard Ejecutivo</option>
                      <option value="admin">Administrador de Datos (CRUD)</option>
                      <option value="portal">Portal de Autogestión</option>
                      <option value="custom">Personalizada (Custom)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paso 2: Diseño de Navegación -->
            <div *ngIf="selectedMenuItem" class="card shadow-sm border-0 rounded-4 animate-in">
              <div class="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center">
                <div class="icon-circle bg-primary-subtle text-primary me-3" style="width: 32px; height: 32px">2</div>
                <h6 class="fw-bold mb-0">Configuración del Nodo: {{ selectedMenuItem.label }}</h6>
              </div>
              <div class="card-body p-4">
                <div class="row g-4">
                  <div class="col-md-4">
                    <label class="form-label fw-bold small text-muted text-uppercase">Etiqueta del Menú</label>
                    <input type="text" class="form-control" [(ngModel)]="selectedMenuItem.label">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-bold small text-muted text-uppercase">Icono (Bootstrap Icons)</label>
                    <div class="input-group">
                        <span class="input-group-text bg-light"><i class="bi" [class]="selectedMenuItem.icon || 'bi-search'"></i></span>
                        <input type="text" class="form-control" [(ngModel)]="selectedMenuItem.icon" placeholder="bi-house">
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label fw-bold small text-muted text-uppercase">Microservicio Destino</label>
                    <select class="form-select" [(ngModel)]="selectedMenuItem.target_service_id" (change)="onServiceChange(selectedMenuItem)">
                      <option [value]="''">Seleccione un servicio...</option>
                      <option *ngFor="let svc of services" [value]="svc.id">{{ svc.id }} - {{ svc.nombre }}</option>
                    </select>
                  </div>
                  
                  <div class="col-md-12" *ngIf="selectedMenuItem.target_service_id">
                    <label class="form-label fw-bold small text-muted text-uppercase">Acción / Endpoint de Inicio</label>
                    <div class="row g-3">
                        <div *ngFor="let ep of getServiceEndpoints(selectedMenuItem.target_service_id)" class="col-md-4">
                            <div class="card border p-3 cursor-pointer shadow-xs h-100"
                                 [class.bg-primary]="selectedMenuItem.target_endpoint_path === ep.path && selectedMenuItem.target_endpoint_method === ep.method"
                                 [class.text-white]="selectedMenuItem.target_endpoint_path === ep.path && selectedMenuItem.target_endpoint_method === ep.method"
                                 (click)="selectedMenuItem.target_endpoint_path = ep.path; selectedMenuItem.target_endpoint_method = ep.method">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge" [ngClass]="getMethodClass(ep.method)">{{ ep.method }}</span>
                                    <i *ngIf="selectedMenuItem.target_endpoint_path === ep.path && selectedMenuItem.target_endpoint_method === ep.method" class="bi bi-check-circle-fill"></i>
                                </div>
                                <div class="fw-bold small mb-1">{{ ep.configuracion_ui?.label || ep.summary }}</div>
                                <div class="x-small opacity-75 truncate">{{ ep.path }}</div>
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

    <style>
      .icon-circle {
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%; font-weight: bold;
      }
      .menu-tree { max-height: 400px; overflow-y: auto; }
      .cursor-pointer { cursor: pointer; }
      .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .btn-xs { padding: 0.1rem 0.25rem; font-size: 0.75rem; }
      .bg-primary-subtle { background-color: #cfe2ff !important; }
      .bg-info-subtle { background-color: #cff4fc !important; }

      /* Header Flotante Global */
      .page-header-sticky {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--md-bg-secondary);
        border-bottom: 1px solid var(--md-border-color);
        margin: -1rem -1rem 1.5rem -1rem;
        padding: 0 1rem;
        box-shadow: 0 2px 4px var(--md-shadow-sm);
        transition: all 0.3s ease;
      }

      .page-header-sticky .breadcrumb {
        background-color: transparent;
        padding: 0;
        margin: 0;
      }

      .page-header-sticky .breadcrumb-item a {
        color: var(--md-text-secondary);
        transition: color 0.2s ease;
        font-weight: 500;
      }

      .page-header-sticky .breadcrumb-item a:hover {
        color: #0d6efd;
        text-decoration: underline;
      }

      .page-header-sticky .breadcrumb-item.active {
        color: var(--md-text-primary);
        font-weight: 600;
      }

      .page-header-sticky .breadcrumb-item + .breadcrumb-item::before {
        color: var(--md-text-muted);
        content: "/";
        padding: 0 0.5rem;
      }

      .page-header-sticky h2 {
        color: var(--md-text-primary);
      }

      .page-header-sticky .text-muted {
        color: var(--md-text-secondary) !important;
      }
    </style>
  `
})
export class CustomPageDesignerComponent implements OnInit {
  private middlewareService = inject(MiddlewareService);

  services: BackendService[] = [];
  serviceEndpointsMap: { [key: string]: Endpoint[] } = {};
  flows: PageFlow[] = [];
  activeFlow: PageFlow | null = null;
  selectedMenuItem: MenuItem | null = null;

  ngOnInit() {
    this.loadServices();
    // Cargar flujos guardados desde el middleware (simulado por ahora)
    this.flows = [
      {
        id: '1',
        name: 'Portal de Recursos Humanos',
        type: 'portal',
        menu_items: [
          { id: 'm1', label: 'Dashboard', icon: 'bi-speedometer2', target_service_id: '', target_endpoint_path: '', target_endpoint_method: '', children: [] }
        ]
      }
    ];
  }

  loadServices() {
    this.middlewareService.getBackendServices(false).subscribe(data => {
      this.services = data;
      // Precargar endpoints para cada servicio
      data.forEach(svc => {
        this.middlewareService.inspectService(svc.id).subscribe(inspect => {
          this.serviceEndpointsMap[svc.id] = inspect.endpoints.filter((e: any) => e.is_enabled);
        });
      });
    });
  }

  createNewFlow() {
    const newFlow: PageFlow = {
      id: Math.random().toString(36).substring(7),
      name: 'Nueva Página Customizada',
      type: 'admin',
      menu_items: []
    };
    this.flows.push(newFlow);
    this.activeFlow = newFlow;
    this.selectedMenuItem = null;
  }

  saveFlow() {
    alert('Flujo guardado con éxito en el middleware.');
    console.log('Guardando flujo:', this.activeFlow);
  }

  addMenuItem() {
    if (!this.activeFlow) return;
    const newItem: MenuItem = {
      id: Math.random().toString(36).substring(7),
      label: 'Nuevo Item',
      icon: 'bi-circle',
      target_service_id: '',
      target_endpoint_path: '',
      target_endpoint_method: '',
      children: []
    };
    this.activeFlow.menu_items.push(newItem);
    this.selectedMenuItem = newItem;
  }

  removeMenuItem(item: MenuItem) {
    if (!this.activeFlow) return;
    this.activeFlow.menu_items = this.activeFlow.menu_items.filter(i => i !== item);
    if (this.selectedMenuItem === item) this.selectedMenuItem = null;
  }

  onServiceChange(item: MenuItem) {
    item.target_endpoint_path = '';
    item.target_endpoint_method = '';
  }

  getServiceEndpoints(serviceId: string): Endpoint[] {
    return this.serviceEndpointsMap[serviceId] || [];
  }

  getMethodClass(method: string): string {
    const map: any = {
      'GET': 'bg-success-subtle text-success',
      'POST': 'bg-primary-subtle text-primary',
      'PUT': 'bg-warning-subtle text-warning',
      'PATCH': 'bg-info-subtle text-info',
      'DELETE': 'bg-danger-subtle text-danger'
    };
    return map[method] || 'bg-secondary-subtle';
  }
}
