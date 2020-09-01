
export class RequestHelper {
    static downloadFileBlob(url, callback, includeAuth = false) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200)
                callback(this.response);
        };

        xhr.open('GET', url);
        xhr.responseType = 'blob';

        xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        if (includeAuth)
            xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());

        xhr.send();
    }
}
