var fs = require('fs');
var apiRelativeLink = '/api/services/Platform/Permission/GetAllPermissions';
var environmentName = process.argv.slice(2)[0];
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var environment = require('../src/assets/appconfig' + (environmentName ? '.' + environmentName : '') + '.json');
var xhr = new XMLHttpRequest();
/** Load permissions list */
xhr.open('GET', environment.remoteServiceBaseUrl + apiRelativeLink, false);
xhr.send();
if (xhr.status !== 200) {
    console.log('error', xhr.status + xhr.statusText);
} else {
    var data = JSON.parse(xhr.responseText);
    var tenantSpecificPermissions = [
        { name: 'Pages.Administration.Tenant.Settings' },
        { name: 'Pages.Administration.Tenant.SubscriptionManagement' }
    ];
    var hostPermissions = data.result.items;
    var allPermissions = tenantSpecificPermissions.concat(hostPermissions).map(item => '    ' + item.name.split('.').join('') + ' = ' + '\'' + item.name + '\'').join(',\n');
    var permissionsFileName = 'src/shared/AppPermissions.ts';
    /** Create permissions enum and fill it with permissions from response */
    fs.writeFile(permissionsFileName, 'export enum AppPermissions {\n', function() {
        fs.appendFile(permissionsFileName, allPermissions, function() {
            fs.appendFile(permissionsFileName, '\n}', function() {});
        });
    });
}
