import * as _ from 'underscore';

export class DomHelper {
    static getElementIndexByInnerText(collection: any[], innerText: string): number {
        if (collection && collection.length)
            for (let i = 0; i < collection.length; i++)
                if (collection[i].innerText == innerText)
                    return i;
        return 0;
    }

    static isDomElementVisible(element: any): boolean {
        while(element.tagName.toLowerCase() != 'body') {
            if (element.style.display == 'none')
              return false;

            element = element.parentNode;
            if (!element)
                return false;
        }
        return true;
    }

    static waitUntilElementIsReady(selector: string, callback: any, checkPeriod?: number): void {
        if (!$) {
            return;
        }

        let elementCount = selector.split(',').length;

        if (!checkPeriod) {
            checkPeriod = 100;
        }

        let checkExist = setInterval(() => {
            if ($(selector).length >= elementCount) {
                clearInterval(checkExist);
                callback();
            }
        }, checkPeriod);
    }

    static waitUntilElementIsVisible(selector: string, callback: any, checkPeriod?: number): void {
        if (!$) {
            return;
        }

        let elementCount = selector.split(',').length;

        if (!checkPeriod) {
            checkPeriod = 100;
        }

        let checkExist = setInterval(() => {
            if ($(selector.replace('/,/g', ':visible,' + ':visible')).length >= elementCount) {
                clearInterval(checkExist);
                callback();
            }
        }, checkPeriod);
    }

    public static addScriptLink(src: string, type: string = 'text/javascript', callback = null, data = {}): void {
        if (Array.prototype.some.call(document.scripts, (script) => {
            return script.src == src;
        })) return;

        let script = document.createElement('script');
        script.type = type;
        script.src = src;
        for (const prop in data)
            script.dataset[prop] = data[prop];

        if (callback)
            script.addEventListener('load', callback);
        document.head.append(script);
    }

    public static removeScriptLink(src: string): void {
        let script = document.querySelector('script[src="' + src + '"]');
        if (script) script.remove();
    }

    public static addStyleSheet(id: string, href: string, rel: string = 'stylesheet'): void {
        let link = document.createElement('link');
        _.mapObject({ id: id, href: href, rel: rel },
            (val, key) => {
                link.setAttribute(key, val);
            }
        );
        document.head.append(link);
    }
}