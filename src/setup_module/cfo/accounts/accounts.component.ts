import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { FinancialInformationServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
import { DomSanitizer } from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { Router } from '@angular/router';

@Component({
    selector: 'accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ FinancialInformationServiceProxy ]
})
export class AccountsComponent extends CFOComponentBase implements OnInit {

    sourceUrl: any;

    constructor(
        injector: Injector,
        private sanitizer: DomSanitizer,
        private _financialInformationServiceProxy: FinancialInformationServiceProxy,
        private _router: Router
    ) {
        super(injector);
    }

    ngOnInit() {
        super.ngOnInit();
        this.initIFrame();
    }

    initIFrame() {
        this._financialInformationServiceProxy.getSetupAccountsLink(
            InstanceType[this.instanceType],
            this.instanceId,
            'https://testadmin.sperse.com/assets/cfo-css/setup.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });
    }
}
