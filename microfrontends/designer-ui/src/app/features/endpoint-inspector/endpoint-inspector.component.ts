import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MiddlewareService } from '../../core/services/middleware.service';

@Component({
  selector: 'app-endpoint-inspector',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid px-4 py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-1">
              <li class="breadcrumb-item"><a routerLink="/">Gestión de Microservicios</a></li>
              <li class="breadcrumb-item active" aria-current="page">Inspección</li>
            </ol>
          </nav>
          <h2 class="mb-0 text-primary" *ngIf="inspectionData">
            Contrato: {{ inspectionData.service_name }}
          </h2>
        </div>
        <button class="btn btn-outline-secondary" routerLink="/">
          <i class="bi bi-arrow-left"></i> Volver al listado
        </button>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Obteniendo contrato de microservicio...</p>
      </div>

      <div *ngIf="error" class="alert alert-danger shadow-sm border-0">
        <h5 class="alert-heading">Error al cargar contrato</h5>
        <p class="mb-0">{{ error }}</p>
        <hr>
        <button class="btn btn-sm btn-outline-danger" (click)="loadInspection()">Reintentar</button>
      </div>

      <div *ngIf="inspectionData && !loading" class="card shadow-sm border-0">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 120px" class="ps-4">MÉTODO</th>
                  <th>RUTA (ENDPOINT)</th>
                  <th class="pe-4">DESCRIPCIÓN</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ep of inspectionData.endpoints">
                  <td class="ps-4">
                    <span class="badge w-100 py-2" [ngClass]="getMethodClass(ep.method)">{{ ep.method }}</span>
                  </td>
                  <td>
                    <code class="text-primary fw-bold fs-6">{{ ep.path }}</code>
                  </td>
                  <td class="pe-4">
                    <span class="text-muted">{{ ep.summary || 'Sin descripción disponible' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
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
      .table th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; }
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

  getMethodClass(method: string): string {
    return `badge-${method}`;
  }
}

