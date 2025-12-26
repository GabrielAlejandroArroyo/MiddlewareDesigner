import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes, RouterOutlet, RouterModule } from '@angular/router';
import { BackendManagementComponent } from './app/features/backend-management/backend-management.component';
import { EndpointInspectorComponent } from './app/features/endpoint-inspector/endpoint-inspector.component';
import { ActionDefinitionComponent } from './app/features/action-definition/action-definition.component';

const routes: Routes = [
  { path: '', component: BackendManagementComponent },
  { path: 'inspect/:id', component: EndpointInspectorComponent },
  { path: 'inspect/:id/action-definition', component: ActionDefinitionComponent },
  { path: '**', redirectTo: '' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" routerLink="/">
          <span class="text-info">Middleware</span> Designer
        </a>
      </div>
    </nav>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));
