import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isMiddlewareUrl(req.url)) {
    const header = auth.getAuthorizationHeader();
    if (header) {
      req = req.clone({ setHeaders: { Authorization: header } });
    }
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && auth.isMiddlewareUrl(req.url)) {
        auth.clearCredentials();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
