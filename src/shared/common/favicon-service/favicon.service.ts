import { Injectable, Inject } from '@angular/core';
import { FaviconDto } from '@shared/service-proxies/service-proxies';
import { DOCUMENT } from '@angular/common';
import { AppConsts } from '@shared/AppConsts';

@Injectable()
export class FaviconService {
    constructor(@Inject(DOCUMENT) private document) {}

    static DEFAULT_FAVICONS: FaviconDto[] = [
        FaviconDto.fromJS({relationship: 'icon', type: 'image/x-icon', name: 'favicon.ico', size: '32x32'}),
        FaviconDto.fromJS({relationship: 'icon', type: 'image/png', name: 'favicon-32x32.png', size: '32x32'}),
        FaviconDto.fromJS({relationship: 'icon', type: 'image/png', name: 'favicon-16x16.png', size: '16x16'}),
        FaviconDto.fromJS({relationship: 'apple-touch-icon', type: 'image/png', name: 'apple-touch-icon.png', size: '180x180'})
    ];

    updateFavicons(favicons: FaviconDto[], faviconBaseUrl: string) {
        let oldFaviconsLinks = Array.prototype.slice.call(this.document.head.querySelectorAll('link[rel*="icon"]'), 0),
            oldManifest = this.document.head.querySelector('link[rel="manifest"]');

        favicons.forEach((item: FaviconDto) => {
            let href = faviconBaseUrl + item.name;
            if (document.head.querySelector('link[href="' + href + '"]')) 
                oldFaviconsLinks = oldFaviconsLinks.map((link) => {
                    if (link.href == href)
                        return undefined;
                    return link;
                });
            else {
                let link = this.document.createElement('link');
                link.rel = item.relationship;
                link.type = item.type;
                link.sizes = item.size;
                link.href = href;
                this.document.head.appendChild(link);
            }
        });        

        oldFaviconsLinks.forEach((link) => { link && link.remove() });
        oldManifest && oldManifest.remove();
    }

    resetFavicons() {
        const newFavicons = this.document.head.querySelectorAll('link[rel*="icon"]');
        Array.prototype.forEach.call(newFavicons, link => link.remove());
        this.updateFavicons(FaviconService.DEFAULT_FAVICONS, AppConsts.appBaseHref);
    }
}