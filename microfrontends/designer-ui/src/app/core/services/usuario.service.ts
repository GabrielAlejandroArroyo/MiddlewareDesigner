import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

const USUARIO_API = 'http://127.0.0.1:8007/api/v1';

export interface CambiarPasswordRequest {
  password_actual: string;
  password_nueva: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);

  cambiarPassword(usuarioId: string, body: CambiarPasswordRequest): Observable<unknown> {
    return this.http.patch(
      `${USUARIO_API}/usuarios/${usuarioId}/cambiar-password`,
      body
    );
  }
}
