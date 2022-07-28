export class UrlHelper {
    /**
     * The URL requested, before initial routing.
     */
    static readonly initialUrl = location.href;

    static publicUrls = [
        'bank-pass',
        'why-they-buy'
    ];

    static getLookupIpUrl(ip: string): string {
        return 'https://search.arin.net/rdap/?query=' + ip;
    }

    static getQueryParameters(): any {
        return UrlHelper.getQueryParametersUsingParameters(document.location.search);
    }

    static getQueryParametersUsingParameters(search: string): any {
        return search ? search.replace(/(^\?)/, '').split('&').map(function (n) {
            return n = n.split('='), this[n[0]] = n[1], this;
        }.bind({}))[0] : {};
    }

    static getInitialUrlParameters(): string {
        let questionMarkIndex = UrlHelper.initialUrl.indexOf('?');
        if (questionMarkIndex >= 0) {
            return UrlHelper.initialUrl.substr(questionMarkIndex, UrlHelper.initialUrl.length - questionMarkIndex);
        }

        return '';
    }

    static getInitialUrlRelativePath() {
        return (this.initialUrl.split('?').shift().match(/^http[s]?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*(:[0-9]+)?(\/.+)+$/) || []).pop();
    }

    static getUrl(uri, params: { [param: string]: string }): string {
        return uri + '?' + Object.keys(params)
            .map((param: string) => encodeURIComponent(param) + '=' + encodeURIComponent(params[param]))
            .join('&');
    }

    static getReturnUrl(): string {
        const queryStringObj = UrlHelper.getQueryParametersUsingParameters(UrlHelper.getInitialUrlParameters());
        if (queryStringObj.returnUrl) {
            return decodeURIComponent(queryStringObj.returnUrl);
        }
        return null;
    }

    static getSingleSignIn(): boolean {
        const queryStringObj = UrlHelper.getQueryParametersUsingParameters(UrlHelper.getInitialUrlParameters());
        if (queryStringObj.ss) {
            return queryStringObj.ss;
        }

        return false;
    }

    static isInstallUrl(url): boolean {
        return url && url.indexOf('app/admin/install') >= 0;
    }

    static isAccountModuleUrl(url): boolean {
        return url && url.indexOf('account/') >= 0;
    }

    static isPFMUrl(url): boolean {
        return url && url.indexOf('personal-finance') >= 0;
    }

    static isPfmAppUrl(url): boolean {
        return url && /.?personal\-finance\/{0,1}$/.test(url.split('?').shift());
    }

    static isPfmSignUpUrl(url): boolean {
        return url && url.indexOf('personal-finance/sign-up') >= 0;
    }

    static isPublicUrl(url) {
        return url && UrlHelper.getQueryParameters()['user-key'] && UrlHelper.publicUrls.some(publicUrl => url.indexOf(publicUrl) >= 0);
    }
}
