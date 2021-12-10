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
}