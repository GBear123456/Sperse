import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AppConsts } from '@shared/AppConsts';
import { Title } from '@angular/platform-browser';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class TitleService {
    constructor(
        private title: Title,
        private appSession: AppSessionService,
        @Inject(DOCUMENT) private document: any
    ) {}

    public setTitle(moduleName: string) {
        const tenantName = this.appSession.tenantName;
        let newTitle = (tenantName === '' ? AppConsts.defaultTenantName : tenantName) + ': ' + moduleName,
            ogTitle = this.document.head.querySelector('meta[property="og:title"]');
        if (ogTitle)
            ogTitle.setAttribute('content', newTitle);
        this.title.setTitle(newTitle);
    }
}
