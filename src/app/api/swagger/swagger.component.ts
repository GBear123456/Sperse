import { Component, Injector, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    templateUrl: './swagger.component.html',
    styleUrls: ['./swagger.component.less']
})
export class SwaggerComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    link: SafeResourceUrl;

    constructor(
        injector: Injector,
        private sanitizer: DomSanitizer
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        this.getRootComponent().overflowHidden(true);
    }

    ngOnInit() {
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
