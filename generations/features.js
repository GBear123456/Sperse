var fs = require('fs');
var apiRelativeLink = '/api/services/Platform/Feature/GetAll';
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
    var features = data.result
        .map(item => '    ' + item.name.split('.').join('') + ' = ' + '\'' + item.name + '\'')
        .join(',\n');
    var fileName = 'src/shared/AppFeatures.ts';
    /** Create permissions enum and fill it with permissions from response */
    fs.writeFile(fileName, 'export enum AppFeatures {\n', function() {
        fs.appendFile(fileName, features, function() {
            fs.appendFile(fileName, '\n}', function() {});
        });
    });
}
