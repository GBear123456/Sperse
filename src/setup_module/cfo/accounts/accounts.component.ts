import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { FinancialInformationServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer } from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { Router } from '@angular/router';

@Component({
    selector: 'accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ FinancialInformationServiceProxy ]
})
export class AccountsComponent extends AppComponentBase implements OnInit {

    sourceUrl: any;

    constructor(
        injector: Injector,
                private sanitizer: DomSanitizer,
                private _financialInformationServiceProxy: FinancialInformationServiceProxy,
        private _router: Router
    ) {
        super(injector);
        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit() {
        this.initIFrame();
    }

    initIFrame() {
        this._financialInformationServiceProxy.getSetupAccountsLink(
            'https://testadmin.sperse.com/assets/cfo-css/custom.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });
    }
}
