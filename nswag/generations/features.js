var fs = require('fs');
var apiRelativeLink = '/api/services/Platform/Feature/GetAll';
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

fs.readFile('generations/config.json', 'utf8', function(err, config) {
    var remoteServiceBaseUrl = JSON.parse(config).url;
    var xhr = new XMLHttpRequest();
    /** Load permissions list */
    xhr.open('GET', remoteServiceBaseUrl + apiRelativeLink, false);
    xhr.send();
    if (xhr.status !== 200) {
        console.log('error', xhr.status + xhr.statusText);
    } else {
        var data = JSON.parse(xhr.responseText);
        var features = data.result
        .map(item => '    ' + item.name.split('.').join('') + ' = ' + '\'' + item.name + '\'')
        .join(',\n');
        var fileName = '../src/shared/AppFeatures.ts';
        var fileContent = 'export enum AppFeatures {\n' + features + '\n}';
        /** Create permissions enum and fill it with permissions from response */
        fs.writeFile(fileName, fileContent, function() {});
    }
});


