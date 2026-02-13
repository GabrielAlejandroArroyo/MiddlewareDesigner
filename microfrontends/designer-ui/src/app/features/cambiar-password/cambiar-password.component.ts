import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div class="card shadow-lg border-0 rounded-4" style="width: 100%; max-width: 400px;">
        <div class="card-body p-5">
          <div class="text-center mb-4">
            <div class="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
              <i class="bi bi-key-fill text-warning fs-2"></i>
            </div>
            <h4 class="fw-bold">Cambiar contraseña</h4>
            <p class="text-muted small mb-0">Debe actualizar su contraseña antes de continuar</p>
          </div>

          <form (ngSubmit)="onSubmit()" #f="ngForm">
            <div class="mb-3">
              <label for="password_actual" class="form-label fw-semibold">Contraseña actual</label>
              <input type="password" id="password_actual" name="password_actual" class="form-control form-control-lg"
                     [(ngModel)]="passwordActual" (ngModelChange)="errorMessage = ''" required
                     [class.is-invalid]="f.submitted && !passwordActual"
                     placeholder="Contraseña actual">
              <div class="invalid-feedback" *ngIf="f.submitted && !passwordActual">Ingrese la contraseña actual.</div>
            </div>
            <div class="mb-3">
              <label for="password_nueva" class="form-label fw-semibold">Nueva contraseña</label>
              <input type="password" id="password_nueva" name="password_nueva" class="form-control form-control-lg"
                     [(ngModel)]="passwordNueva" (ngModelChange)="errorMessage = ''" required
                     [class.is-invalid]="f.submitted && (!passwordNueva || passwordNueva !== passwordNuevaConfirm)"
                     placeholder="Nueva contraseña">
              <div class="invalid-feedback" *ngIf="f.submitted && !passwordNueva">Ingrese la nueva contraseña.</div>
            </div>
            <div class="mb-4">
              <label for="password_nueva_confirm" class="form-label fw-semibold">Confirmar nueva contraseña</label>
              <input type="password" id="password_nueva_confirm" name="password_nueva_confirm" class="form-control form-control-lg"
                     [(ngModel)]="passwordNuevaConfirm" (ngModelChange)="errorMessage = ''" required
                     [class.is-invalid]="f.submitted && (passwordNueva !== passwordNuevaConfirm)"
                     placeholder="Repita la nueva contraseña">
              <div class="invalid-feedback" *ngIf="f.submitted && passwordNueva !== passwordNuevaConfirm">Las contraseñas no coinciden.</div>
            </div>

            <div class="alert alert-danger py-2 small" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <button type="submit" class="btn btn-primary btn-lg w-100 fw-bold" [disabled]="loading">
              <span *ngIf="!loading">Actualizar contraseña</span>
              <span *ngIf="loading">
                <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                Actualizando...
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CambiarPasswordComponent {
  private auth = inject(AuthService);
  private usuario = inject(UsuarioService);
  private router = inject(Router);

  passwordActual = '';
  passwordNueva = '';
  passwordNuevaConfirm = '';
  loading = false;
  errorMessage = '';

  async onSubmit(): Promise<void> {
    this.errorMessage = '';
    const id = this.auth.usuarioId();
    if (!id) {
      this.errorMessage = 'Sesión inválida. Por favor inicie sesión de nuevo.';
      this.router.navigate(['/login']);
      return;
    }
    if (this.passwordNueva !== this.passwordNuevaConfirm) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }
    if (!this.passwordActual || !this.passwordNueva) {
      this.errorMessage = 'Complete todos los campos.';
      return;
    }

    this.loading = true;
    try {
      await firstValueFrom(this.usuario.cambiarPassword(id, {
        password_actual: this.passwordActual,
        password_nueva: this.passwordNueva
      }));
      this.loading = false;
      this.router.navigate(['/']);
    } catch (err: unknown) {
      this.loading = false;
      const e = err as { status?: number; error?: { detail?: string } };
      if (e?.status === 400) {
        this.errorMessage = (e?.error?.detail as string) || 'Contraseña actual incorrecta.';
      } else {
        this.errorMessage = 'Error al actualizar. Compruebe que el servicio de usuarios esté en ejecución.';
      }
    }
  }
}
