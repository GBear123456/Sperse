export class RequestHelper {
    static downloadFileBlob(url, callback, includeAuth = false, errorHandler?) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200)
                    callback(this.response, RequestHelper.getFileName(this));
                else if (errorHandler)
                    errorHandler(this);
            }
        };

        xhr.open('GET', url);
        xhr.responseType = 'blob';

        xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        if (includeAuth)
            xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());

        xhr.send();
    }

    private static getFileName(xhr: XMLHttpRequest): string {
        let disposition = xhr.getResponseHeader('Content-Disposition');
        if (disposition && disposition.indexOf('attachment') !== -1) {
            let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            let matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) {
                return matches[1].replace(/['"]/g, '');
            }
        }

        return null;
    }
}