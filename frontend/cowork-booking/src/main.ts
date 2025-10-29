import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // Register the Angular service worker (ngsw-worker.js) when running a production build
    if (environment.production && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/ngsw-worker.js')
        .then((reg) => console.log('Service worker registered.', reg))
        .catch((err) => console.error('Service worker registration failed:', err));
    }
  })
  .catch((err) => console.error(err));
