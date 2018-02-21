import { Component, OnInit, Injector } from '@angular/core';
import { FinancialInformationServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { DomSanitizer } from '@angular/platform-browser';
import { CFOComponentBase } from '../shared/common/cfo-component-base';

@Component({
    selector: 'accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ FinancialInformationServiceProxy ]
})
export class AccountsComponent extends CFOComponentBase implements OnInit  {
    sourceUrl: any;

    constructor(
        injector: Injector,
        private sanitizer: DomSanitizer,
        private _financialInformationServiceProxy: FinancialInformationServiceProxy
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
            'https://testadmin.sperse.com/assets/cfo-css/quovocustommobile.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });
    }
}
