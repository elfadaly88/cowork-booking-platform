# CoworkBooking

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Progressive Web App (PWA) & Cross-platform notes

This project includes a basic Angular service worker configuration and manifest so you can build a PWA-ready bundle.

Quick steps to build and test the PWA:

1. Install dependencies (ensure `@angular/service-worker` was installed):

```powershell
npm install
```

2. Build a production bundle (this will include the service worker):

```powershell
ng build --configuration production
```

3. Serve the `dist/` directory from a static server (service workers require HTTPS or localhost). Example (using a simple static server):

```powershell
npx http-server ./dist/cowork-booking -p 8080
```

4. Open `http://localhost:8080` in Chrome (or other browsers) and use DevTools > Application to inspect the service worker, manifest, and test offline behavior. On mobile, open the site and add to home screen to test PWA installation flows.

Responsive considerations added in CSS:
- fluid container widths, safe-area insets for notched devices
- grid and card layouts use auto-fill/minmax for flexibility
- reduced paddings and full-width actions on small screens

If you want further polishing (app icons, splash screens, advanced caching strategies), I can add icon assets and refine `ngsw-config.json` for API caching and versioning.
