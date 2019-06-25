import { Component, OnInit, Injector } from '@angular/core';
import { SyncServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { DomSanitizer } from '@angular/platform-browser';
import { CFOComponentBase } from '../shared/common/cfo-component-base';
import { AppConsts } from '@shared/AppConsts';
import { SyncTypeIds } from '@shared/AppEnums';

@Component({
    selector: 'accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ SyncServiceProxy ]
})
export class AccountsComponent extends CFOComponentBase implements OnInit  {
    sourceUrl: any;

    constructor(
        injector: Injector,
        private sanitizer: DomSanitizer,
        private _syncServiceProxy: SyncServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.initIFrame();
    }

    initIFrame() {
        this._syncServiceProxy.getSetupAccountsLink(
            InstanceType[this.instanceType],
            this.instanceId,
            SyncTypeIds.Quovo,
            AppConsts.appBaseHref + 'assets/cfo-css/quovocustom.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });
    }
}
