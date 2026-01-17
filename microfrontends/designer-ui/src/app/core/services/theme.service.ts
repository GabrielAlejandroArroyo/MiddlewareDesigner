import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'md-theme-preference';
  
  // Signal reactivo para el tema actual
  currentTheme = signal<ThemeMode>(this.loadTheme());

  constructor() {
    // Aplicar tema inicial inmediatamente
    const initialTheme = this.currentTheme();
    this.applyTheme(initialTheme);
    
    // Efecto que se ejecuta cuando cambia el tema
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.saveTheme(theme);
    });
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
  }

  private loadTheme(): ThemeMode {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Detectar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private saveTheme(theme: ThemeMode): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  private applyTheme(theme: ThemeMode): void {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(`theme-${theme}`);
  }
}
