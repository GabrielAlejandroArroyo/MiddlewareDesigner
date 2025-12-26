import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { BackendManagementComponent } from './app/features/backend-management/backend-management.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BackendManagementComponent],
  template: `
    <nav class="navbar navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Middleware Designer</a>
      </div>
    </nav>
    <main>
      <app-backend-management></app-backend-management>
    </main>
  `
})
export class App {}

bootstrapApplication(App, {
  providers: [provideHttpClient()]
}).catch(err => console.error(err));

