import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MiddlewareService, Endpoint } from '../../core/services/middleware.service';

@Component({
  selector: 'app-endpoint-inspector',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
                <li class="breadcrumb-item">
                  <a routerLink="/backends" class="text-decoration-none">Gestión de Microservicios</a>
                </li>
                <li class="breadcrumb-item active" aria-current="page">Inspección de Contrato</li>
              </ol>
            </nav>
            <h2 class="mb-0 fw-bold" *ngIf="inspectionData">
              {{ inspectionData.service_name }}
            </h2>
            <p class="text-muted mb-0 small mt-1" *ngIf="inspectionData">ID: {{ inspectionData.service_id }}</p>
          </div>
          <button class="btn btn-light border shadow-sm ms-3" routerLink="/">
            <i class="bi bi-arrow-left me-2"></i> Volver al listado
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Analizando contrato y definiciones...</p>
      </div>

      <div *ngIf="error" class="alert alert-danger shadow-sm border-0 animate-in">
        <h5 class="alert-heading fw-bold">Error de Inspección</h5>
        <p class="mb-0">{{ error }}</p>
        <hr>
        <button class="btn btn-sm btn-outline-danger" (click)="loadInspection()">Reintentar</button>
      </div>

      <!-- Tabla de Endpoints -->
      <div *ngIf="inspectionData && !loading" class="card shadow-sm border-0 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style="width: 80px" class="ps-4">ESTADO</th>
                <th style="width: 100px">MÉTODO</th>
                <th>RUTA (ENDPOINT)</th>
                <th>DESCRIPCIÓN</th>
                <th class="text-end pe-4">CONFIGURACIÓN</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ep of inspectionData.endpoints" [class.table-active]="ep.is_enabled">
                <td class="ps-4">
                  <div class="form-check form-switch">
                    <input class="form-check-input pointer" type="checkbox" 
                           [checked]="ep.is_enabled"
                           (change)="toggleEndpoint(ep)">
                  </div>
                </td>
                <td>
                  <span class="badge w-100 py-2" [ngClass]="getMethodClass(ep.method)">{{ ep.method }}</span>
                </td>
                <td>
                  <code class="text-primary fw-bold fs-6">{{ ep.path }}</code>
                </td>
                <td>
                  <span class="text-muted small">{{ ep.summary || 'Sin descripción' }}</span>
                </td>
                <td class="text-end pe-4">
                  <button *ngIf="ep.is_enabled" 
                          [routerLink]="['/inspect', inspectionData.service_id, 'action-definition']"
                          [queryParams]="{ path: ep.path, method: ep.method }"
                          class="btn btn-sm btn-primary shadow-sm">
                    Definir Acción
                  </button>
                  <span *ngIf="!ep.is_enabled" class="text-muted small italic">Deshabilitado</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <style>
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
export class EndpointInspectorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private middlewareService = inject(MiddlewareService);
  
  inspectionData: any = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadInspection();
  }

  loadInspection() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading = true;
    this.error = null;

    this.middlewareService.inspectService(id).subscribe({
      next: (data) => {
        this.inspectionData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || err.message || 'Error desconocido al cargar contrato';
        this.loading = false;
      }
    });
  }

  toggleEndpoint(ep: Endpoint) {
    if (!this.inspectionData) return;

    if (ep.is_enabled) {
      this.middlewareService.removeEndpointMapping(
        this.inspectionData.service_id,
        ep.path,
        ep.method
      ).subscribe({
        next: () => {
          ep.is_enabled = false;
          ep.configuracion_ui = {};
        },
        error: (err) => alert('No se pudo deshabilitar: ' + err.message)
      });
    } else {
      const mapping = {
        backend_service_id: this.inspectionData.service_id,
        endpoint_path: ep.path,
        metodo: ep.method,
        frontend_service_id: 'default',
        configuracion_ui: {
          label: ep.summary || ep.path,
          parameters: ep.parameters,
          request_dto: ep.request_dto,
          response_dto: ep.response_dto
        }
      };

      this.middlewareService.toggleEndpointMapping(mapping).subscribe({
        next: () => {
          ep.is_enabled = true;
          ep.configuracion_ui = mapping.configuracion_ui;
        },
        error: (err) => alert('No se pudo habilitar: ' + err.message)
      });
    }
  }

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }
}
