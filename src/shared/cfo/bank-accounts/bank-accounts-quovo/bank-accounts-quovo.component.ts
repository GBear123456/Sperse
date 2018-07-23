import { Component, OnInit } from '@angular/core';
import { SyncServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { DomSanitizer } from '@angular/platform-browser';
import { CFOService } from '@shared/cfo/cfo.service.ts';

@Component({
    selector: 'app-bank-accounts-quovo',
    templateUrl: './bank-accounts-quovo.component.html',
    styleUrls: ['./bank-accounts-quovo.component.less']
})
export class BankAccountsQuovoComponent implements OnInit {

    /** Quovo source url */
    sourceUrl: any;
    constructor(
        private _syncServiceProxy: SyncServiceProxy,
        private sanitizer: DomSanitizer,
        private _cfoSerfice: CFOService
    ) {}

    ngOnInit() {
        this.initIFrame();
    }

    initIFrame() {
        this._syncServiceProxy.getSetupAccountsLink(
            InstanceType[this._cfoSerfice.instanceType],
            this._cfoSerfice.instanceId,
            'Q',
            AppConsts.appBaseUrl + '/assets/cfo-css/quovocustom.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });
    }

}
