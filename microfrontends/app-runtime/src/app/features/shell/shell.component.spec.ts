import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ShellComponent } from './shell.component';
import { RuntimeService, MenuItem, RuntimeModule } from '../../core/services/runtime.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

const mockConfig = {
  app_id: 2,
  app_nombre: 'COCOMO',
  app_slug: 'cocomo',
  role_id: 'V1_5676',
  role_nombre: 'CREADOR',
  menu_structure: [
    {
      id: 'item-0',
      label: 'Microservicio de País',
      icon: 'bi-globe',
      order: 0,
      children: [
        {
          id: 'item-0-0',
          label: 'Listar todos los paises',
          target_service_id: 'pais-api',
          target_endpoint_path: '/api/v1/paises/',
          target_endpoint_method: 'GET',
          children: [],
        },
      ],
    },
  ],
  modules: [
    {
      backend_service_id: 'pais-api',
      endpoint_path: '/api/v1/paises/',
      metodo: 'GET',
      backend_service_nombre: 'pais-api',
    } as RuntimeModule,
  ],
};

describe('ShellComponent', () => {
  it('onMenuClick encuentra módulo por clave service|path|method', () => {
    const mockRuntime = {
      getAppBySlug: () => of({}),
      getAppRuntime: () => of({}),
      getUserRoles: () => of([]),
    };
    const mockAuth = {
      usuarioId: signal<string | null>(null),
      username: signal<string | null>(null),
      clearCredentials: () => {},
    };
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        { provide: RuntimeService, useValue: mockRuntime },
        { provide: AuthService, useValue: mockAuth },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'cocomo' } } } },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ThemeService, useValue: {} },
      ],
    });
    const fixture = TestBed.createComponent(ShellComponent);
    const comp = fixture.componentInstance;
    comp.runtimeConfig = { ...mockConfig, menu_structure: mockConfig.menu_structure.map(i => ({ ...i, _expanded: true })) } as any;
    comp.loading = false;
    const child = mockConfig.menu_structure[0].children[0] as MenuItem;
    comp.onMenuClick(child);
    expect(comp.displayedModule?.backend_service_id).toBe('pais-api');
    expect(comp.displayedModule?.endpoint_path).toContain('paises');
  });
});
