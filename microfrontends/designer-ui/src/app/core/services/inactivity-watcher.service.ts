import { inject, Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'keypress', 'scroll', 'touchstart'] as const;

/**
 * Servicio que detecta inactividad del usuario (sin mouse, teclado, scroll o touch).
 * Al alcanzar el timeout emite en inactivityDetected$.
 */
@Injectable({
  providedIn: 'root'
})
export class InactivityWatcherService {
  readonly inactivityDetected$ = new Subject<void>();

  private timerId: ReturnType<typeof setTimeout> | null = null;
  private boundHandler: (() => void) | null = null;
  private readonly ngZone = inject(NgZone);

  /**
   * Inicia la detección de inactividad. Si minutes <= 0, no hace nada.
   * En cada evento de actividad se reinicia el timer.
   */
  start(minutes: number): void {
    this.stop();
    if (minutes <= 0) return;

    const timeoutMs = minutes * 60 * 1000;

    this.boundHandler = () => {
      this.resetTimer(timeoutMs);
    };

    this.ngZone.runOutsideAngular(() => {
      for (const ev of ACTIVITY_EVENTS) {
        document.addEventListener(ev, this.boundHandler!);
      }
    });

    this.resetTimer(timeoutMs);
  }

  private resetTimer(timeoutMs: number): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.ngZone.run(() => {
        this.inactivityDetected$.next();
      });
      this.stop();
    }, timeoutMs);
  }

  /** Detiene la detección y limpia listeners y timer. */
  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.boundHandler) {
      this.ngZone.runOutsideAngular(() => {
        for (const ev of ACTIVITY_EVENTS) {
          document.removeEventListener(ev, this.boundHandler!);
        }
      });
      this.boundHandler = null;
    }
  }
}
