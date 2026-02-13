import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MiddlewareService } from '../../core/services/middleware.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="card shadow-lg border-0 rounded-4" style="width: 100%; max-width: 400px;">
        <div class="card-body p-5">
          <div class="text-center mb-4">
            <div class="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
              <i class="bi bi-lock-fill text-info fs-2"></i>
            </div>
            <h4 class="fw-bold">Middleware Designer</h4>
            <p class="text-muted small mb-0">Inicie sesión para continuar</p>
          </div>

          <form (ngSubmit)="onSubmit()" #f="ngForm">
            <div class="mb-3">
              <label for="username" class="form-label fw-semibold">Usuario</label>
              <input type="text" id="username" name="username" class="form-control form-control-lg"
                     [(ngModel)]="username" (ngModelChange)="errorMessage = ''" required autocomplete="username"
                     [class.is-invalid]="f.submitted && (usernameInvalid || errorMessage)"
                     placeholder="Usuario">
              <div class="invalid-feedback" *ngIf="f.submitted && usernameInvalid">Ingrese el usuario.</div>
            </div>
            <div class="mb-4">
              <label for="password" class="form-label fw-semibold">Contraseña</label>
              <input type="password" id="password" name="password" class="form-control form-control-lg"
                     [(ngModel)]="password" (ngModelChange)="errorMessage = ''" required autocomplete="current-password"
                     [class.is-invalid]="f.submitted && (passwordInvalid || errorMessage)"
                     placeholder="Contraseña">
              <div class="invalid-feedback" *ngIf="f.submitted && passwordInvalid">Ingrese la contraseña.</div>
            </div>

            <div class="alert alert-danger py-2 small" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 fw-bold" [disabled]="loading">
              <span *ngIf="!loading">Iniciar sesión</span>
              <span *ngIf="loading">
                <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                Verificando...
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private middleware = inject(MiddlewareService);
  private router = inject(Router);
  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  get usernameInvalid(): boolean {
    return !this.username?.trim();
  }

  get passwordInvalid(): boolean {
    return !this.password;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    if (this.usernameInvalid || this.passwordInvalid) return;

    this.loading = true;
    const user = this.username.trim();
    const pass = this.password;

    try {
      const res = await firstValueFrom(this.middleware.login(user, pass));
      this.auth.setCredentials(user, pass);
      if (res.usuario_id) {
        this.auth.setUsuarioId(res.usuario_id);
      }
      if (res.requires_password_change) {
        this.loading = false;
        this.router.navigate(['/cambiar-password']);
      } else {
        this.loading = false;
        this.router.navigate(['/']);
      }
    } catch (err: unknown) {
      this.loading = false;
      this.auth.clearCredentials();
      const e = err as { status?: number; message?: string };
      if (e?.status === 401) {
        this.errorMessage = 'Usuario o contraseña incorrectos.';
      } else if (e?.status === 0) {
        this.errorMessage = 'No se pudo conectar con el middleware. Compruebe que esté ejecutándose (puerto 9000). Ejecute scripts/start_all.ps1 o scripts/start_middleware.ps1.';
      } else {
        this.errorMessage = (e?.message as string) || 'Error de conexión. Compruebe que el middleware esté en ejecución.';
      }
    }
  }
}
