import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes, RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackendManagementComponent } from './app/features/backend-management/backend-management.component';
import { EndpointInspectorComponent } from './app/features/endpoint-inspector/endpoint-inspector.component';
import { ActionDefinitionComponent } from './app/features/action-definition/action-definition.component';
import { PreviewComponent } from './app/features/preview/preview.component';
import { CustomPageDesignerComponent } from './app/features/custom-page-designer/custom-page-designer.component';
import { DashboardComponent } from './app/features/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'backends', component: BackendManagementComponent },
  { path: 'preview', component: PreviewComponent },
  { path: 'custom-designer', component: CustomPageDesignerComponent },
  { path: 'inspect/:id', component: EndpointInspectorComponent },
  { path: 'inspect/:id/action-definition', component: ActionDefinitionComponent },
  { path: '**', redirectTo: '' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  template: `
    <div class="d-flex h-100 vh-100 overflow-hidden">
      <!-- Sidebar Vertical -->
      <aside class="sidebar bg-dark text-white shadow d-flex flex-column transition-all" 
             [class.collapsed]="isCollapsed">
        <div class="sidebar-header p-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2 overflow-hidden" *ngIf="!isCollapsed">
            <div class="bg-info rounded-circle flex-shrink-0 shadow-sm" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <i class="bi bi-cpu text-dark small"></i>
            </div>
            <span class="fw-bold fs-5 text-nowrap">Designer</span>
          </div>
          <button class="btn btn-dark btn-sm rounded-circle shadow-none border-0" (click)="isCollapsed = !isCollapsed">
            <i class="bi" [class.bi-list]="isCollapsed" [class.bi-chevron-left]="!isCollapsed"></i>
          </button>
        </div>

        <nav class="sidebar-nav flex-grow-1 py-3 px-2">
          <ul class="nav flex-column gap-2">
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm" 
                 [routerLinkActiveOptions]="{exact: true}"
                 [title]="isCollapsed ? 'Dashboard' : ''">
                <i class="bi bi-grid-1x2-fill fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Panel Principal</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/backends" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm"
                 [title]="isCollapsed ? 'Gestión' : ''">
                <i class="bi bi-gear-fill fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Gestión Backends</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/preview" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm"
                 [title]="isCollapsed ? 'Previsualización' : ''">
                <i class="bi bi-eye-fill fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Previsualización</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center rounded-3 p-3 transition-all" 
                 routerLink="/custom-designer" routerLinkActive="active bg-info bg-opacity-10 text-info shadow-sm"
                 [title]="isCollapsed ? 'Creación de Página Customizadas' : ''">
                <i class="bi bi-layout-text-window-reverse fs-5" [class.me-3]="!isCollapsed"></i>
                <span class="text-nowrap" *ngIf="!isCollapsed">Diseño de Flujos</span>
              </a>
            </li>
          </ul>
        </nav>

        <div class="sidebar-footer p-3 border-top border-secondary border-opacity-25" *ngIf="!isCollapsed">
          <div class="small text-muted text-center">v1.2.0-beta</div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-grow-1 overflow-auto bg-light">
        <header class="bg-white border-bottom px-4 py-3 d-flex align-items-center shadow-sm">
          <h5 class="mb-0 fw-bold text-dark d-lg-none me-3" *ngIf="isCollapsed">
            <span class="text-info">MD</span>
          </h5>
          <h5 class="mb-0 fw-bold text-dark">Middleware Designer</h5>
        </header>
        <main class="p-0">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <style>
      .sidebar { width: 280px; min-width: 280px; z-index: 1000; }
      .sidebar.collapsed { width: 80px; min-width: 80px; }
      .transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      
      .nav-link { color: #adb5bd; text-decoration: none; }
      .nav-link:hover { color: #fff; background: rgba(255,255,255,0.05); }
      .nav-link.active { font-weight: 600; }
      
      aside.collapsed .nav-link { justify-content: center; padding: 1rem !important; }
      aside.collapsed .sidebar-header { justify-content: center !important; }
      
      body { overflow: hidden; }
    </style>
  `
})
export class App {
  isCollapsed = true;
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
