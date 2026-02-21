import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** En desarrollo (ng serve) usa proxy /usuario-api -> 127.0.0.1:8007; en producción configurar reverse proxy equivalente. */
const USUARIO_API = '/usuario-api/api/v1';

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
