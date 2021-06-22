/** Core imports */
import { Component, Injector, AfterViewInit, OnDestroy, OnInit } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LeftMenuService } from '@app/cfo/shared/common/left-menu/left-menu.service';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './swagger.component.html',
    styleUrls: ['./swagger.component.less']
})
export class SwaggerComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    link: SafeResourceUrl;
    leftMenuCollapsed$: Observable<boolean> = this.leftMenuService.collapsed$;

    constructor(
        injector: Injector,
        private appService: AppService,
        private sanitizer: DomSanitizer,
        private leftMenuService: LeftMenuService
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        this.getRootComponent().overflowHidden(true);
    }

    ngOnInit() {
        this.appService.isClientSearchDisabled = true;
        window.addEventListener('message', this.onSwaggerLoaded);
        if (AppConsts.remoteServiceBaseUrl == AppConsts.appBaseUrl) {
            this.link = this.sanitizer
                .bypassSecurityTrustResourceUrl(
                    AppConsts.remoteServiceBaseUrl +
                    '/api/index.html'
                );
        } else {
            this.link = this.sanitizer
                .bypassSecurityTrustResourceUrl(
                    AppConsts.remoteServiceBaseUrl +
                    '/api/index.html?tokenAuth=' + abp.auth.getToken()
                );
        }
        abp.ui.setBusy();
    }

    onSwaggerLoaded(e) {
        if (e.origin == AppConsts.remoteServiceBaseUrl && e.data) {
            abp.ui.clearBusy();
        }
    }

    ngOnDestroy() {
        window.removeEventListener('message', this.onSwaggerLoaded);
        this.getRootComponent().overflowHidden();
    }
}
