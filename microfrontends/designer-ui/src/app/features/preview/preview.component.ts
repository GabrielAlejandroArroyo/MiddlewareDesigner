import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ModulePreviewPanelComponent } from '../../shared/module-preview-panel/module-preview-panel.component';
import type { BackendService } from '../../core/services/middleware.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, ModulePreviewPanelComponent],
  template: `
    <div class="container-fluid px-4 py-4">
      <!-- Header Flotante con Breadcrumb -->
      <div class="preview-header-sticky">
        <div class="d-flex justify-content-between align-items-center py-3">
          <div class="flex-grow-1">
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
                <li class="breadcrumb-item" *ngIf="selectedServiceId && selectedServiceRaw">
                  <a [routerLink]="['/inspect', selectedServiceId]" class="text-decoration-none">
                    {{ selectedServiceRaw.id | uppercase }}
                  </a>
                </li>
                <li class="breadcrumb-item active" aria-current="page">
                  Previsualización
                  <span *ngIf="selectedServiceId && selectedServiceRaw" class="text-muted">
                    - {{ selectedServiceRaw.nombre }}
                  </span>
                </li>
              </ol>
            </nav>
            <h2 class="mb-0 fw-bold">Previsualización de Aplicación</h2>
          </div>
          <button class="btn btn-light border shadow-sm ms-3" (click)="panel.loadEnabledServices()">
            <i class="bi bi-arrow-repeat me-2"></i> Actualizar Datos
          </button>
        </div>
      </div>

      <app-module-preview-panel
        #panel
        [compactMode]="false"
        [showConfigurarLink]="true"
        (serviceSelected)="onServiceSelected($event)">
      </app-module-preview-panel>
    </div>

    <style>
      .preview-header-sticky {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--md-bg-secondary) !important;
        border-bottom: 1px solid var(--md-border-color);
        margin: -1rem -1rem 0 -1rem;
        padding: 0 1rem 1rem 1rem;
        box-shadow: 0 2px 8px var(--md-shadow-sm);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .preview-header-sticky .breadcrumb {
        background-color: transparent;
        padding: 0;
        margin: 0;
      }
      .preview-header-sticky .breadcrumb-item a {
        color: var(--md-text-secondary);
        transition: color 0.2s ease;
        font-weight: 500;
      }
      .preview-header-sticky .breadcrumb-item a:hover {
        color: #0d6efd;
        text-decoration: underline;
      }
      .preview-header-sticky .breadcrumb-item.active {
        color: var(--md-text-primary);
        font-weight: 600;
      }
      .preview-header-sticky .breadcrumb-item.active .text-muted {
        color: var(--md-text-secondary) !important;
        font-weight: 400;
      }
      .preview-header-sticky .breadcrumb-item + .breadcrumb-item::before {
        color: var(--md-text-muted);
        content: "/";
        padding: 0 0.5rem;
      }
      .preview-header-sticky h2 {
        color: var(--md-text-primary);
      }
      .preview-header-sticky .text-muted {
        color: var(--md-text-secondary) !important;
      }
    </style>
  `
})
export class PreviewComponent {
  selectedServiceId: string | null = null;
  selectedServiceRaw: BackendService | null = null;

  onServiceSelected(event: { id: string; raw: BackendService } | null) {
    this.selectedServiceId = event?.id ?? null;
    this.selectedServiceRaw = event?.raw ?? null;
  }
}
