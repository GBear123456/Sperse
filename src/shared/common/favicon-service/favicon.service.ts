import { Injectable, Inject } from '@angular/core';
import { FaviconDto } from '@shared/service-proxies/service-proxies';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class FaviconService {
    constructor(@Inject(DOCUMENT) private document) {}
    private defaultFavicons;
    private defaultManifest;

    updateFavicons(favicons: FaviconDto[], faviconBaseUrl: string) {
        const oldFaviconsLinks = this.document.head.querySelectorAll('link[rel*="icon"]');
        const oldManifest = this.document.head.querySelector('link[rel="manifest"]');
        favicons.forEach((item: FaviconDto) => {
            let link = this.document.createElement('link');
            link.rel = item.relationship;
            link.type = item.type;
            link.sizes = item.size;
            link.href = faviconBaseUrl + item.name;
            this.document.head.appendChild(link);
        });
        if (oldManifest)
            oldManifest.remove();
        Array.prototype.forEach.call(oldFaviconsLinks, link => link.remove());
    }

    saveDefaultFavicons() {
        this.defaultFavicons = this.document.head.querySelectorAll('link[rel*="icon"]');
        this.defaultManifest = this.document.head.querySelector('link[rel="manifest"]');
    }

    resetFavicons() {
        const newFavicons = this.document.head.querySelectorAll('link[rel*="icon"]');
        Array.prototype.forEach.call(newFavicons, link => link.remove());
        this.defaultFavicons.forEach(item => {
            this.document.head.appendChild(item);
        });
        if (this.defaultManifest) {
            this.document.head.appendChild(this.defaultManifest);
        }
    }
}
