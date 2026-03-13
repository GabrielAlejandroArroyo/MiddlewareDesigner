import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RuntimeModule } from '../../core/services/runtime.service';

@Component({
  selector: 'app-module-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 h-100 overflow-auto">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold mb-1">
            {{ module.configuracion_ui?.label || module.endpoint_path }}
          </h4>
          <div class="d-flex align-items-center gap-2">
            <span class="badge rounded-pill" [class]="getMethodClass(module.metodo)">
              {{ module.metodo | uppercase }}
            </span>
            <code class="small">{{ module.endpoint_path }}</code>
            <span class="text-muted small">- {{ module.backend_service_nombre }}</span>
          </div>
        </div>
        <button class="btn btn-outline-primary btn-sm" (click)="executeRequest()">
          <i class="bi bi-play-fill me-1"></i> Ejecutar
        </button>
      </div>

      <!-- GET: Data grid -->
      <div *ngIf="(module.metodo || '').toLowerCase() === 'get'">
        <div *ngIf="loading" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>

        <div *ngIf="!loading && errorMsg" class="alert alert-danger">{{ errorMsg }}</div>

        <div *ngIf="!loading && !errorMsg && data !== null">
          <!-- Array data: table -->
          <div *ngIf="isArray(data)" class="table-responsive">
            <table class="table table-hover table-sm">
              <thead>
                <tr>
                  <th *ngFor="let col of columns" class="small fw-bold">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of data">
                  <td *ngFor="let col of columns" class="small">
                    {{ formatCell(row[col]) }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="text-muted small">{{ data.length }} registros</div>
          </div>

          <!-- Object data: detail card -->
          <div *ngIf="!isArray(data)" class="card">
            <div class="card-body">
              <div class="row g-2" *ngFor="let key of objectKeys(data)">
                <div class="col-md-3"><span class="fw-bold small">{{ key }}</span></div>
                <div class="col-md-9"><span class="small">{{ formatCell(data[key]) }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- POST/PUT/PATCH: Form -->
      <div *ngIf="['post','put','patch'].includes((module.metodo || '').toLowerCase())">
        <div class="card">
          <div class="card-header fw-bold">
            <i class="bi bi-pencil-square me-2"></i>
            {{ (module.metodo || '').toLowerCase() === 'post' ? 'Crear' : 'Editar' }}
          </div>
          <div class="card-body">
            <div *ngIf="formFields.length === 0" class="text-muted small">
              No hay campos de formulario configurados para este endpoint.
            </div>
            <div class="row g-3">
              <div class="col-md-6" *ngFor="let field of formFields">
                <label class="form-label small fw-bold">
                  {{ field.visualName || field.name }}
                </label>
                <input type="text" class="form-control form-control-sm"
                       [(ngModel)]="formValues[field.name]"
                       [placeholder]="field.name">
              </div>
            </div>
            <div class="mt-4">
              <button class="btn btn-primary" (click)="submitForm()" [disabled]="loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ (module.metodo || '').toLowerCase() === 'post' ? 'Crear' : 'Guardar' }}
              </button>
            </div>
            <div *ngIf="successMsg" class="alert alert-success mt-3 small">{{ successMsg }}</div>
            <div *ngIf="errorMsg" class="alert alert-danger mt-3 small">{{ errorMsg }}</div>
          </div>
        </div>
      </div>

      <!-- DELETE: Confirm -->
      <div *ngIf="(module.metodo || '').toLowerCase() === 'delete'">
        <div class="card border-danger">
          <div class="card-header bg-danger text-white fw-bold">
            <i class="bi bi-trash me-2"></i> Eliminar
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label small fw-bold">ID del registro</label>
              <input type="text" class="form-control" [(ngModel)]="deleteId" placeholder="Ingresa el ID">
            </div>
            <button class="btn btn-danger" (click)="executeDelete()" [disabled]="loading || !deleteId">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              Eliminar
            </button>
            <div *ngIf="successMsg" class="alert alert-success mt-3 small">{{ successMsg }}</div>
            <div *ngIf="errorMsg" class="alert alert-danger mt-3 small">{{ errorMsg }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ModuleViewerComponent implements OnChanges {
  @Input() module!: RuntimeModule;
  @Input() allModules: RuntimeModule[] = [];

  private http = inject(HttpClient);

  loading = false;
  errorMsg = '';
  successMsg = '';
  data: any = null;
  columns: string[] = [];
  formFields: { name: string; visualName: string }[] = [];
  formValues: Record<string, any> = {};
  deleteId = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['module']) {
      this.reset();
      this.buildFormFields();
      if ((this.module.metodo || '').toLowerCase() === 'get') {
        this.executeRequest();
      }
    }
  }

  private reset() {
    this.data = null;
    this.columns = [];
    this.errorMsg = '';
    this.successMsg = '';
    this.formValues = {};
    this.deleteId = '';
  }

  private buildFormFields() {
    const cfg = this.module.configuracion_ui;
    if (!cfg?.fields_config?.request) {
      this.formFields = [];
      return;
    }
    const requestFields = cfg.fields_config.request;
    this.formFields = Object.entries(requestFields)
      .filter(([_, v]: [string, any]) => v.show !== false)
      .sort(([_, a]: [string, any], [__, b]: [string, any]) => (a.order ?? 99) - (b.order ?? 99))
      .map(([name, v]: [string, any]) => ({
        name,
        visualName: v.visualName || name,
      }));
    this.formValues = {};
    this.formFields.forEach(f => this.formValues[f.name] = '');
  }

  private unwrapListResponse(res: any): any {
    if (Array.isArray(res)) return res;
    if (res && typeof res === 'object') {
      const values = Object.values(res);
      const arr = values.find(v => Array.isArray(v) && v.length > 0) ?? values.find(v => Array.isArray(v));
      if (arr) return arr;
    }
    return res;
  }

  private buildUrl(): string {
    const path = (this.module.endpoint_path || '').startsWith('/')
      ? this.module.endpoint_path
      : `/${this.module.endpoint_path}`;
    return `/api/v1/runtime/proxy/${this.module.backend_service_id}${path}`;
  }

  executeRequest() {
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    const url = this.buildUrl();

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.data = this.unwrapListResponse(res);
        const arr = Array.isArray(this.data) ? this.data : [];
        if (arr.length > 0) {
          this.columns = Object.keys(arr[0]);
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || err.message || 'Error al ejecutar la petición';
        this.loading = false;
      }
    });
  }

  submitForm() {
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    const url = this.buildUrl();
    const body = { ...this.formValues };

    const method = this.module.metodo.toLowerCase();
    const request$ = method === 'post'
      ? this.http.post<any>(url, body)
      : method === 'put'
        ? this.http.put<any>(url, body)
        : this.http.patch<any>(url, body);

    request$.subscribe({
      next: () => {
        this.successMsg = 'Operación completada exitosamente';
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error en la operación';
        this.loading = false;
      }
    });
  }

  executeDelete() {
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    let url = this.buildUrl();
    url = url.replace(/\{[^}]+\}/, this.deleteId);

    this.http.delete<any>(url).subscribe({
      next: () => {
        this.successMsg = 'Registro eliminado';
        this.loading = false;
        this.deleteId = '';
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al eliminar';
        this.loading = false;
      }
    });
  }

  getMethodClass(method: string): string {
    const map: Record<string, string> = {
      get: 'badge-GET', post: 'badge-POST', put: 'badge-PUT',
      patch: 'badge-PATCH', delete: 'badge-DELETE'
    };
    return map[method.toLowerCase()] || 'bg-secondary';
  }

  isArray(val: any): boolean { return Array.isArray(val); }
  objectKeys(obj: any): string[] { return obj ? Object.keys(obj) : []; }

  formatCell(val: any): string {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }
}
