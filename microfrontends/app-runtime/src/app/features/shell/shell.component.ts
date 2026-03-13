import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RuntimeService, AppRuntimeConfig, MenuItem, RuntimeModule } from '../../core/services/runtime.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ModuleViewerComponent } from '../module-viewer/module-viewer.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, ModuleViewerComponent],
  template: `
    <div class="d-flex vh-100 overflow-hidden" *ngIf="runtimeConfig">
      <!-- Sidebar -->
      <aside class="sidebar bg-dark text-white d-flex flex-column" [class.collapsed]="isCollapsed">
        <div class="sidebar-header p-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25">
          <div class="d-flex align-items-center gap-2 overflow-hidden" *ngIf="!isCollapsed">
            <div class="bg-info rounded-circle flex-shrink-0" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
              <i class="bi bi-app-indicator text-dark small"></i>
            </div>
            <span class="fw-bold text-nowrap">{{ runtimeConfig.app_nombre }}</span>
          </div>
          <button class="btn btn-dark btn-sm rounded-circle border-0" (click)="isCollapsed = !isCollapsed">
            <i class="bi" [class.bi-list]="isCollapsed" [class.bi-chevron-left]="!isCollapsed"></i>
          </button>
        </div>

        <nav class="flex-grow-1 py-3 px-2 overflow-auto">
          <ul class="nav flex-column gap-1">
            <ng-container *ngFor="let item of runtimeConfig.menu_structure">
              <!-- Parent item con hijos -->
              <li class="nav-item" *ngIf="item.children && item.children.length > 0">
                <a class="nav-link d-flex align-items-center rounded-3 p-3 text-white menu-link"
                   href="javascript:void(0)"
                   role="button"
                   (click)="$event.preventDefault(); onParentClick(item)"
                   [title]="isCollapsed ? item.label : ''">
                  <i [class]="'bi ' + item.icon + ' fs-5'" [class.me-3]="!isCollapsed"></i>
                  <span class="text-nowrap flex-grow-1" *ngIf="!isCollapsed">{{ item.label }}</span>
                  <i class="bi small" *ngIf="!isCollapsed"
                     [class.bi-chevron-down]="item._expanded" [class.bi-chevron-right]="!item._expanded"></i>
                </a>
                <ul class="nav flex-column ms-3" *ngIf="item._expanded && !isCollapsed">
                  <li class="nav-item" *ngFor="let child of item.children">
                    <a class="nav-link d-flex align-items-center rounded-3 py-2 px-3 text-white menu-link"
                       href="javascript:void(0)"
                       role="button"
                       [class.active-item]="isActiveItem(child)"
                       (click)="$event.preventDefault(); onMenuClick(child)">
                      <i [class]="'bi ' + child.icon + ' small'" [class.me-2]="!isCollapsed"></i>
                      <span class="small">{{ child.label }}</span>
                    </a>
                  </li>
                </ul>
              </li>

              <!-- Item sin hijos (leaf) -->
              <li class="nav-item" *ngIf="!item.children || item.children.length === 0">
                <a class="nav-link d-flex align-items-center rounded-3 p-3 text-white menu-link"
                   href="javascript:void(0)"
                   role="button"
                   [class.active-item]="isActiveItem(item)"
                   (click)="$event.preventDefault(); onMenuClick(item)"
                   [title]="isCollapsed ? item.label : ''">
                  <i [class]="'bi ' + item.icon + ' fs-5'" [class.me-3]="!isCollapsed"></i>
                  <span class="text-nowrap" *ngIf="!isCollapsed">{{ item.label }}</span>
                </a>
              </li>
            </ng-container>
          </ul>
        </nav>

        <div class="p-3 border-top border-secondary border-opacity-25" *ngIf="!isCollapsed">
          <div class="small text-muted mb-2">
            <i class="bi bi-person me-1"></i>{{ authService.username() }}
            <br><span class="x-small">Rol: {{ runtimeConfig.role_nombre }}</span>
          </div>
          <button class="btn btn-sm btn-outline-info w-100 mb-2" (click)="goToApps()">
            <i class="bi bi-grid-1x2 me-1"></i> Todas las Aplicaciones
          </button>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-light flex-grow-1" (click)="themeService.toggleTheme()">
              <i class="bi" [class.bi-moon-stars-fill]="themeService.currentTheme() === 'light'"
                 [class.bi-sun-fill]="themeService.currentTheme() === 'dark'"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger flex-grow-1" (click)="logout()">
              <i class="bi bi-box-arrow-right me-1"></i> Salir
            </button>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-grow-1 overflow-auto" style="background:var(--rt-bg-secondary)">
        <div *ngIf="!displayedModule" class="d-flex align-items-center justify-content-center h-100">
          <div class="text-center">
            <i class="bi bi-hand-index-thumb display-1 text-muted"></i>
            <h4 class="mt-3 text-muted">Selecciona una opción del menú</h4>
            <p class="text-muted">{{ runtimeConfig.app_nombre }}</p>
          </div>
        </div>

        <app-module-viewer *ngIf="displayedModule"
          [module]="displayedModule"
          [allModules]="runtimeConfig.modules">
        </app-module-viewer>
      </div>
    </div>

    <!-- Loading -->
    <div *ngIf="loading" class="d-flex align-items-center justify-content-center vh-100">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3"></div>
        <p class="text-muted">Cargando aplicación...</p>
      </div>
    </div>

    <!-- Error descriptivo -->
    <div *ngIf="errorCode && !loading" class="d-flex align-items-center justify-content-center vh-100"
         style="background: var(--rt-bg-secondary, #f8f9fa)">
      <div class="error-page text-center p-4" style="max-width: 650px; width: 100%">
        <div class="error-icon-container mb-4">
          <div class="error-icon-circle mx-auto d-flex align-items-center justify-content-center rounded-circle"
               [class.bg-danger]="errorSeverity === 'error'" [class.bg-warning]="errorSeverity === 'warning'"
               [class.bg-opacity-10]="true" style="width: 100px; height: 100px;">
            <i class="bi display-3"
               [class.bi-shield-x]="errorCode === 'APP_NOT_FOUND' || errorCode === 'APP_DELETED'"
               [class.bi-toggle-off]="errorCode === 'APP_INACTIVE'"
               [class.bi-people-fill]="errorCode === 'NO_ROLES' || errorCode === 'NO_USER_ROLE'"
               [class.bi-boxes]="errorCode === 'NO_MODULES'"
               [class.bi-list-nested]="errorCode === 'NO_MENU'"
               [class.bi-wifi-off]="errorCode === 'RUNTIME_ERROR'"
               [class.bi-exclamation-triangle]="errorCode === 'UNKNOWN'"
               [class.text-danger]="errorSeverity === 'error'"
               [class.text-warning]="errorSeverity === 'warning'"></i>
          </div>
        </div>

        <h3 class="fw-bold mb-2" [class.text-danger]="errorSeverity === 'error'"
            [class.text-warning]="errorSeverity === 'warning'">
          {{ errorTitle }}
        </h3>
        <p class="text-muted mb-4 fs-6">{{ errorMsg }}</p>

        <div class="card border-0 shadow-sm text-start mb-4" *ngIf="errorDetails.length > 0">
          <div class="card-header bg-dark text-white py-2">
            <i class="bi bi-info-circle me-2"></i>
            <span class="fw-bold small">Detalle del problema</span>
          </div>
          <div class="card-body p-0">
            <div *ngFor="let detail of errorDetails; let last = last"
                 class="px-3 py-3 d-flex align-items-start gap-3"
                 [class.border-bottom]="!last">
              <i class="bi mt-1"
                 [class.bi-x-circle-fill]="detail.type === 'error'"
                 [class.bi-exclamation-triangle-fill]="detail.type === 'warning'"
                 [class.bi-info-circle-fill]="detail.type === 'info'"
                 [class.text-danger]="detail.type === 'error'"
                 [class.text-warning]="detail.type === 'warning'"
                 [class.text-info]="detail.type === 'info'"></i>
              <div>
                <div class="fw-bold small">{{ detail.label }}</div>
                <div class="small text-muted">{{ detail.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm text-start mb-4 bg-info bg-opacity-10" *ngIf="errorSuggestion">
          <div class="card-body py-3">
            <div class="d-flex align-items-start gap-2">
              <i class="bi bi-lightbulb-fill text-info mt-1"></i>
              <div>
                <div class="fw-bold small text-info">Sugerencia</div>
                <div class="small">{{ errorSuggestion }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center gap-2">
          <button class="btn btn-primary px-4" (click)="retry()">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar
          </button>
          <button class="btn btn-outline-secondary px-4" (click)="goToLogin()">
            <i class="bi bi-box-arrow-in-right me-2"></i> Ir al Login
          </button>
        </div>

        <div class="mt-4 text-muted small">
          <i class="bi bi-clock me-1"></i> {{ errorTimestamp }}
          <span class="mx-2">|</span>
          <i class="bi bi-link-45deg me-1"></i> /{{ slug }}
        </div>
      </div>
    </div>

    <style>
      .sidebar { width: 280px; min-width: 280px; transition: all 0.3s ease; background-color: var(--rt-sidebar-bg, #212529) !important; }
      .sidebar.collapsed { width: 70px; min-width: 70px; }
      .sidebar.collapsed .nav-link { justify-content: center; padding: 0.8rem !important; }
      .menu-link { opacity: 0.8; cursor: pointer; transition: all 0.2s; text-decoration: none; }
      .menu-link:hover { opacity: 1; background: rgba(255,255,255,0.1); }
      .active-item { opacity: 1 !important; background: rgba(13,110,253,0.2) !important; border-left: 3px solid #0d6efd; }
      .x-small { font-size: 0.75rem; }
      .error-page { animation: fadeIn 0.4s ease-out; }
      .error-icon-circle { transition: transform 0.3s; }
      .error-icon-circle:hover { transform: scale(1.1); }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
  `
})
export class ShellComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private runtimeService = inject(RuntimeService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  authService = inject(AuthService);
  themeService = inject(ThemeService);

  runtimeConfig: (AppRuntimeConfig & { menu_structure: (MenuItem & { _expanded?: boolean })[] }) | null = null;
  activeModule: RuntimeModule | null = null;
  isCollapsed = false;
  loading = true;

  errorCode = '';
  errorTitle = '';
  errorMsg = '';
  errorSeverity: 'error' | 'warning' = 'error';
  errorDetails: { type: string; label: string; description: string }[] = [];
  errorSuggestion = '';
  errorTimestamp = '';

  slug = '';
  private appId = 0;

  get displayedModule(): RuntimeModule | null {
    if (this.activeModule) return this.activeModule;
    const first = this.runtimeConfig?.modules?.find(m => this.norm(m.metodo) === 'get');
    return first ?? null;
  }

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    if (!this.slug) {
      this.setError('APP_NOT_FOUND', 'Aplicación no especificada',
        'No se proporcionó un identificador (slug) de aplicación en la URL.',
        'error', [], 'Acceda desde el enlace proporcionado en el Middleware Designer (pestaña "URL de Acceso").');
      this.loading = false;
      return;
    }
    this.loadApp();
  }

  private setError(
    code: string, title: string, msg: string, severity: 'error' | 'warning',
    details: { type: string; label: string; description: string }[],
    suggestion: string,
  ) {
    this.errorCode = code;
    this.errorTitle = title;
    this.errorMsg = msg;
    this.errorSeverity = severity;
    this.errorDetails = details;
    this.errorSuggestion = suggestion;
    this.errorTimestamp = new Date().toLocaleString('es-AR');
  }

  private clearError() {
    this.errorCode = '';
    this.errorTitle = '';
    this.errorMsg = '';
    this.errorDetails = [];
    this.errorSuggestion = '';
  }

  private loadApp() {
    this.loading = true;
    this.clearError();

    this.runtimeService.getAppBySlug(this.slug).subscribe({
      next: (app) => {
        if (!app.is_active) {
          this.setError('APP_INACTIVE', 'Aplicación inactiva',
            `La aplicación "${app.nombre}" (/${this.slug}) existe pero se encuentra deshabilitada.`,
            'error',
            [
              { type: 'error', label: 'Estado: Inactiva', description: 'La aplicación fue desactivada por un administrador.' },
              { type: 'info', label: 'Slug: /' + this.slug, description: 'El identificador de URL es correcto.' },
            ],
            'Contacte al administrador para que active la aplicación desde el Middleware Designer (pestaña "Información").');
          this.loading = false;
          return;
        }
        if (!app.roles || app.roles.length === 0) {
          this.setError('NO_ROLES', 'Sin roles configurados',
            `La aplicación "${app.nombre}" no tiene roles asignados. No es posible determinar qué contenido mostrar.`,
            'error',
            [
              { type: 'info', label: 'Aplicación: ' + app.nombre, description: 'La aplicación existe y está activa.' },
              { type: 'error', label: 'Roles: 0 asignados', description: 'No hay ningún rol vinculado a esta aplicación.' },
              { type: 'warning', label: 'Sin permisos de acceso', description: 'Sin roles no se puede determinar qué módulos y menú mostrar al usuario.' },
            ],
            'El administrador debe ir a la pestaña "Roles" en el Middleware Designer y asignar al menos un rol a esta aplicación.');
          this.loading = false;
          return;
        }
        this.appId = app.id;
        this.resolveUserRole(app);
      },
      error: (err) => {
        const status = err.status;
        if (status === 404) {
          this.setError('APP_NOT_FOUND', 'Aplicación no encontrada',
            `No existe una aplicación con el identificador "/${this.slug}" en el sistema.`,
            'error',
            [
              { type: 'error', label: 'Slug: /' + this.slug, description: 'No se encontró ninguna aplicación registrada con este identificador.' },
              { type: 'info', label: 'Posibles causas', description: 'La URL puede estar mal escrita, la aplicación fue eliminada, o aún no fue creada.' },
            ],
            'Verifique que la URL sea correcta. Si la aplicación fue eliminada, contacte al administrador.');
        } else {
          this.setError('RUNTIME_ERROR', 'Error de conexión',
            'No se pudo conectar con el servidor del middleware para obtener la información de la aplicación.',
            'error',
            [
              { type: 'error', label: 'Middleware inaccesible', description: 'El servidor middleware (API) no responde o no está disponible.' },
              { type: 'info', label: 'Código HTTP: ' + (status || 'Sin respuesta'), description: err.message || 'Error de red o timeout.' },
            ],
            'Verifique que el servidor middleware esté corriendo (puerto 9000). Si el problema persiste, contacte al equipo de infraestructura.');
        }
        this.loading = false;
      }
    });
  }

  private resolveUserRole(app: any) {
    const usuarioId = this.authService.usuarioId();
    if (!usuarioId) {
      this.loadRuntime(app.roles[0].id_role);
      return;
    }

    this.runtimeService.getUserRoles(usuarioId).subscribe({
      next: (userRoles) => {
        const appRoleIds = new Set((app.roles || []).map((r: any) => r.id_role));
        const matchedRole = userRoles.find((ur: any) => !ur.baja_logica && appRoleIds.has(ur.id_rol));

        if (matchedRole) {
          this.loadRuntime(matchedRole.id_rol);
        } else if (app.roles?.length > 0) {
          this.loadRuntime(app.roles[0].id_role);
        } else {
          this.setError('NO_USER_ROLE', 'Sin acceso a esta aplicación',
            `Tu usuario "${this.authService.username()}" no tiene un rol asignado para acceder a "${app.nombre}".`,
            'error',
            [
              { type: 'info', label: 'Aplicación: ' + app.nombre, description: 'La aplicación existe y está configurada correctamente.' },
              { type: 'error', label: 'Usuario sin rol', description: `El usuario "${this.authService.username()}" no tiene ningún rol vinculado a esta aplicación.` },
              { type: 'info', label: 'Roles de la app: ' + app.roles.length, description: 'La aplicación tiene roles configurados, pero tu usuario no tiene ninguno asignado.' },
            ],
            'Contacte al administrador para que le asigne un rol en esta aplicación (sección Usuarios > Asignar Rol).');
          this.loading = false;
        }
      },
      error: () => {
        if (app.roles?.length > 0) {
          this.loadRuntime(app.roles[0].id_role);
        } else {
          this.setError('RUNTIME_ERROR', 'Error al verificar permisos',
            'No se pudo verificar los roles del usuario. El servicio de usuarios no está disponible.',
            'error',
            [
              { type: 'error', label: 'Servicio de usuarios inaccesible', description: 'No se pudo consultar los roles asignados a tu usuario.' },
            ],
            'Verifique que el servicio de usuarios esté corriendo (puerto 8007).');
          this.loading = false;
        }
      }
    });
  }

  private loadRuntime(roleId: string) {
    this.runtimeService.getAppRuntime(this.appId, roleId).subscribe({
      next: (config) => {
        if (config.modules.length === 0 && config.menu_structure.length === 0) {
          this.setError('NO_MODULES', 'Aplicación sin contenido',
            `La aplicación "${config.app_nombre}" está configurada pero no tiene módulos ni menú asignados para el rol "${config.role_nombre}".`,
            'warning',
            [
              { type: 'info', label: 'Aplicación: ' + config.app_nombre, description: 'Existe y está activa.' },
              { type: 'info', label: 'Rol: ' + config.role_nombre, description: 'El rol está correctamente asignado.' },
              { type: 'warning', label: 'Módulos: 0', description: 'No hay endpoints/módulos habilitados para este rol.' },
              { type: 'warning', label: 'Menú: vacío', description: 'No se definió estructura de navegación.' },
            ],
            'El administrador debe configurar módulos en la pestaña "Módulos por Rol" y generar el menú en la pestaña "Menú".');
          this.loading = false;
          return;
        }

        const menuWithExpanded = config.menu_structure.map(item => ({ ...item, _expanded: true }));
        this.runtimeConfig = {
          ...config,
          menu_structure: menuWithExpanded,
        };
        this.activeModule = config.modules.find((m: RuntimeModule) => this.norm(m.metodo) === 'get') ?? null;
        this.loading = false;
        this.ngZone.run(() => this.cdr.detectChanges());
      },
      error: (err) => {
        const detail = err.error?.detail || '';
        if (detail.includes('inactiva') || detail.includes('baja')) {
          this.setError('APP_INACTIVE', 'Aplicación no disponible',
            detail, 'error',
            [{ type: 'error', label: 'Estado', description: detail }],
            'Contacte al administrador para verificar el estado de la aplicación.');
        } else if (detail.includes('rol')) {
          this.setError('NO_ROLES', 'Rol no configurado',
            detail, 'error',
            [{ type: 'error', label: 'Configuración de rol', description: detail }],
            'El administrador debe asignar y configurar roles correctamente en el Middleware Designer.');
        } else {
          this.setError('RUNTIME_ERROR', 'Error al cargar la aplicación',
            detail || 'Ocurrió un error inesperado al cargar la configuración runtime.',
            'error',
            [{ type: 'error', label: 'Detalle técnico', description: detail || err.message || 'Error desconocido' }],
            'Intente nuevamente. Si el problema persiste, contacte al administrador.');
        }
        this.loading = false;
      }
    });
  }

  private moduleKey(serviceId: string, path: string, method: string): string {
    return `${(serviceId || '').toLowerCase()}|${this.normalizePath(path)}|${this.norm(method)}`;
  }

  onParentClick(item: MenuItem & { _expanded?: boolean }) {
    item._expanded = !item._expanded;
    if (!item._expanded) return;
    const firstGet = item.children?.find(c => (c.target_endpoint_method || '').toLowerCase() === 'get');
    const childToSelect = firstGet || item.children?.[0];
    if (childToSelect?.target_service_id && childToSelect?.target_endpoint_path) {
      this.onMenuClick(childToSelect);
    }
    if (!this.activeModule && item.label) {
      this.setActiveByLabel(item.label);
    }
  }

  private normalizePath(p: string | undefined): string {
    return (p || '').replace(/\/+$/, '') || '/';
  }

  onMenuClick(item: MenuItem) {
    const it = item as any;
    const targetServiceId = it.target_service_id ?? it.targetServiceId ?? '';
    const targetPath = it.target_endpoint_path ?? it.targetEndpointPath ?? '';
    const targetMethod = it.target_endpoint_method ?? it.targetEndpointMethod ?? '';
    if (targetServiceId && targetPath) {
      const wantKey = this.moduleKey(targetServiceId, targetPath, targetMethod);
      const mod = this.runtimeConfig?.modules?.find(m => {
        const sid = m.backend_service_id ?? (m as any).backendServiceId ?? '';
        const path = m.endpoint_path ?? (m as any).endpointPath ?? '';
        const method = m.metodo ?? (m as any).metodo ?? '';
        return this.moduleKey(sid, path, method) === wantKey;
      });
      if (mod) {
        this.activeModule = mod;
        this.ngZone.run(() => this.cdr.detectChanges());
        return;
      }
    }
    this.setActiveByLabel(it.label ?? item.label ?? '');
    this.ngZone.run(() => this.cdr.detectChanges());
  }

  private setActiveByLabel(label: string): void {
    if (!this.runtimeConfig?.modules?.length) return;
    const normalized = (label || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    const rawWords = normalized.split(/\s+/).filter(w => w.length >= 2 && !/^(listar|crear|obtener|actualizar|eliminar|dar|todos|las|los|un|una|por|completo|logica|alta|baja)$/i.test(w));
    const terms = new Set<string>(rawWords);
    rawWords.forEach(w => {
      if (w.endsWith('es')) terms.add(w.slice(0, -2));
      else if (w.endsWith('s') && w.length > 2) terms.add(w.slice(0, -1));
    });
    const firstGet = this.runtimeConfig.modules.find(m => {
      if (this.norm(m.metodo) !== 'get') return false;
      const sid = (m.backend_service_id || '').toLowerCase();
      const snom = (m.backend_service_nombre || '').toLowerCase();
      return [...terms].some(t => sid.includes(t) || snom.includes(t));
    });
    if (firstGet) {
      this.activeModule = firstGet;
      this.ngZone.run(() => this.cdr.detectChanges());
    }
  }

  private norm(s: string | undefined): string {
    return (s || '').toLowerCase();
  }

  isActiveItem(item: MenuItem): boolean {
    const dm = this.displayedModule;
    if (!dm) return false;
    const it = item as any;
    const sid = it.target_service_id ?? it.targetServiceId;
    const path = it.target_endpoint_path ?? it.targetEndpointPath;
    const method = it.target_endpoint_method ?? it.targetEndpointMethod;
    return dm.backend_service_id === sid
      && this.normalizePath(dm.endpoint_path) === this.normalizePath(path)
      && this.norm(dm.metodo) === this.norm(method);
  }

  goToApps() {
    this.router.navigate(['/apps']);
  }

  logout() {
    this.authService.clearCredentials();
    this.router.navigate(['/login'], { queryParams: { app: this.slug } });
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { app: this.slug } });
  }

  retry() { this.loadApp(); }
}
