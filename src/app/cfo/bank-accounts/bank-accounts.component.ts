import { Component, OnInit, Injector } from '@angular/core';
import { FinancialInformationServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer } from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { Router } from '@angular/router';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less'],
    providers: [ FinancialInformationServiceProxy ]
})
export class BankAccountsComponent extends AppComponentBase implements OnInit {
    sourceUrl: any;
    headlineConfig: any;

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
        this._financialInformationServiceProxy.getSetupAccountsLink(
            'https://testadmin.sperse.com/assets/cfo-css/custom.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });

        this.headlineConfig = {
            names: [this.l('CashflowSetup_Title'), this.l('SetupStep_FinancialAccounts')],
            icon: 'globe',
            buttons: [
                {
                    enabled: true,
                    action: this.onBackClick.bind(this),
                    lable: this.l('Back'),
                    class: 'btn-default back-button'
                }, {
                    enabled: true,
                    action: this.onNextClick.bind(this),
                    lable: this.l('Next'),
                    class: 'btn-layout next-button'
                }
            ]
        };
    }

    onBackClick() {
        this._router.navigate(['/app/cfo/cashflow-setup']);
    }

    onNextClick() {
        this._router.navigate(['app/cfo/cashflow']);
    }
}
