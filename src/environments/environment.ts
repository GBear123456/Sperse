// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --configuration=production` then `environment.production.ts` will be used instead.
// The list of env maps can be found in `angular.json`.

export const environment = {
    production: false,
    zenDeskEnabled: false,
    hmr: false,
    publicUrl: 'http://localhost:5200',
    appBaseHref: 'https://testuicdn.azureedge.net/current/',
    portalUrl: 'https://my.sperse.com',
    appConfig: 'appconfig.json',
    releaseStage: 'development',

    /* DNS Binding Info */
    ip: '40.80.155.102',
    host: 'testsperseplatformapi.azurewebsites.net',
    asuid: '8066AB9A3B4ED23B324AF524414E469D880D77FCBB2A34A7AB6591A5DA7305BB',
    portalCdn: 'sperseportaltestuicdn.azureedge.net',
    showNextJSPortal: true,
    showAngularPortal: true,

    /* Custom tenant domains */
    LENDSPACE_DOMAIN: 'http://localhost:9000',
    LENDSPACE_HEADER_THEME: 'black'
};
