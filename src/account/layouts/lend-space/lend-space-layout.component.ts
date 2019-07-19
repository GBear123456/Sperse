/** Core imports */
import { Component, Injector, Renderer2 } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import * as moment from 'moment';
import {LayoutType} from '@shared/service-proxies/service-proxies';
import {AppSessionService} from '@shared/common/session/app-session.service';

@Component({
    templateUrl: './lend-space-layout.component.html',
    styleUrls: [
        './lend-space-layout.component.less'
    ]
})
export class LendSpaceLayoutComponent extends AppComponentBase {
    currentDate = new Date();
    currentYear: number = moment().year();
    previousUrl: string;

    constructor(
        injector: Injector,
        private router: Router,
        private _appSession: AppSessionService,
        private renderer: Renderer2
    ) {
        super(injector);

        if (!this.previousUrl) {
            (this.router.url.indexOf('?') != -1) ?
                this.previousUrl = this.router.url.substring(0, this.router.url.indexOf('?')).split('/').pop() :
                this.previousUrl = this.router.url.split('/').pop();

            this.renderer.addClass(
                document.body,
                this.previousUrl
            );
        }

        this.router.events
            .subscribe((event) => {
                if (event instanceof NavigationStart) {
                    if (this.previousUrl) {
                        this.renderer.removeClass(document.body, this.previousUrl);
                    }
                    let currentUrlSlug;
                    (event.url.indexOf('?') != -1) ?
                        currentUrlSlug = event.url.substring(0, event.url.indexOf('?')).split('/').pop() :
                        currentUrlSlug = event.url.split('/').pop();

                    if (currentUrlSlug) {
                        this.renderer.addClass(document.body, currentUrlSlug);
                    }
                    this.previousUrl = currentUrlSlug;
                }
            });
    }
}
