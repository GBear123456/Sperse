var fs = require('fs');
var apiRelativeLink = '/api/services/Platform/Permission/GetAllPermissions';
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

fs.readFile('generations/config.json', 'utf8', function(err, config) {
    var remoteServiceBaseUrl = JSON.parse(config).url;
    var xhr = new XMLHttpRequest();
    /** Load permissions list */
    xhr.open('GET', remoteServiceBaseUrl + apiRelativeLink + '?includeIrrelevant=true', false);
    xhr.send();
    if (xhr.status !== 200) {
        console.log('error', xhr.status + xhr.statusText);
    } else {
        var data = JSON.parse(xhr.responseText);
        var permissions = data.result.items
            .filter(item => item.name !== 'Pages')
            .map(item => '    ' + item.name.split('.').splice(1).join('') + ' = ' + '\'' + item.name + '\'')
            .join(',\n');
        var permissionsFileContent = 'export enum AppPermissions {\n' + permissions + '\n}';
        var fileName = '../src/shared/AppPermissions.ts';
        /** Create permissions enum and fill it with permissions from response */
        fs.writeFile(fileName, permissionsFileContent, function() {});
    }
});
