import { bootstrapApplication } from '@angular/platform-browser';
import { Component, inject } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Routes, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './app/features/login/login.component';
import { ShellComponent } from './app/features/shell/shell.component';
import { HomeComponent } from './app/features/home/home.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { authGuard } from './app/core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'apps', component: HomeComponent, canActivate: [authGuard] },
  {
    path: ':slug',
    component: ShellComponent,
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/apps', pathMatch: 'full' },
  { path: '**', redirectTo: '/apps' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `<router-outlet></router-outlet>`
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
