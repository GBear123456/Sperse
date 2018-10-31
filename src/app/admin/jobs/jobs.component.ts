import { Component, Injector, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    templateUrl: './jobs.component.html',
    styleUrls: ['./jobs.component.less']
})
export class JobsComponent extends AppComponentBase implements AfterViewInit, OnInit, OnDestroy {
    link: SafeResourceUrl;
    public headlineConfig = {
        names: [this.l('Jobs')],
        icon: 'magic-wand',
        buttons: []
    };

    constructor(
        injector: Injector,
        private _sanitizer: DomSanitizer
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        this.getRootComponent().overflowHidden(true);
    }

    ngOnInit() {
        this.link = this._sanitizer.bypassSecurityTrustResourceUrl(AppConsts.remoteServiceBaseUrl + '/hangfire?tokenAuth=' + abp.auth.getToken());
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}
