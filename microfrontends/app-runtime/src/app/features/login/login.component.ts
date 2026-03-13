import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RuntimeService } from '../../core/services/runtime.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex align-items-center justify-content-center vh-100" style="background:var(--rt-bg-secondary)">
      <div class="card shadow-lg border-0 p-4" style="min-width:380px;max-width:420px">
        <div class="text-center mb-4">
          <div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
               style="width:56px;height:56px">
            <i class="bi bi-app-indicator text-white fs-3"></i>
          </div>
          <h4 class="fw-bold mb-1">{{ appName || 'Aplicación' }}</h4>
          <p class="text-muted small">Ingresa tus credenciales para acceder</p>
        </div>

        <div *ngIf="error" class="alert alert-danger small py-2">{{ error }}</div>

        <form (ngSubmit)="onLogin()">
          <div class="mb-3">
            <label class="form-label small fw-bold">Usuario</label>
            <input type="text" class="form-control" [(ngModel)]="username" name="username"
                   placeholder="Nombre de usuario" autofocus>
          </div>
          <div class="mb-3">
            <label class="form-label small fw-bold">Contraseña</label>
            <input type="password" class="form-control" [(ngModel)]="password" name="password"
                   placeholder="Contraseña">
          </div>
          <button type="submit" class="btn btn-primary w-100 fw-bold py-2" [disabled]="loading || !username || !password">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private runtimeService = inject(RuntimeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  username = '';
  password = '';
  error = '';
  loading = false;
  appName = '';

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/apps';
      this.router.navigateByUrl(returnUrl);
      return;
    }

    const slug = this.route.snapshot.queryParamMap.get('app') || '';
    if (slug) {
      this.runtimeService.getAppBySlug(slug).subscribe({
        next: (app) => this.appName = app.nombre,
        error: () => {}
      });
    }
  }

  onLogin() {
    this.loading = true;
    this.error = '';

    this.runtimeService.login(this.username, this.password).subscribe({
      next: (res) => {
        if (res.success) {
          this.auth.setCredentials(
            this.username, this.password,
            res.session_timeout_minutes,
            res.usuario_id
          );
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/apps';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.error = 'Credenciales inválidas';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al autenticar';
        this.loading = false;
      }
    });
  }
}
