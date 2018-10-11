// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --configuration=production` then `environment.production.ts` will be used instead.
// The list of env maps can be found in `angular.json`.

export const environment = {
    production: false,
    zenDeskEnabled: false,
    hmr: false,
    appBaseUrl: 'http://localhost:7200',
    appBaseHref: 'https://testui.blob.core.windows.net/current/',
    appConfig: 'appconfig.json'
};
