import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { FinancialInformationServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer } from '@angular/platform-browser';
import { AppConsts } from '@shared/AppConsts';
import { Router } from '@angular/router';
import { SynchProgressComponent } from '@app/cfo/shared/synch-progress/synch-progress.component';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less'],
    providers: [ FinancialInformationServiceProxy ]
})
export class BankAccountsComponent extends AppComponentBase implements OnInit {
    @ViewChild(SynchProgressComponent) syncComponent: SynchProgressComponent;

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
        this.syncComponent = this.getElementRef().nativeElement.querySelector('synch-progress');
    }

    ngOnInit() {
        this.initIFrame();

        this.headlineConfig = {
            names: [this.l('CashflowSetup_Title'), this.l('SetupStep_FinancialAccounts')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: [
                {
                    enabled: true,
                    action: this.onRefreshClick.bind(this),
                    lable: this.l('Refresh'),
                    icon: 'refresh',
                    class: 'btn-default back-button'
                }, {
                    enabled: true,
                    action: this.onNextClick.bind(this),
                    lable: this.l('Continue'),
                    class: 'btn-layout next-button'
                }
            ]
        };
    }
    initIFrame() {
        this._financialInformationServiceProxy.getSetupAccountsLink(
            'https://testadmin.sperse.com/assets/cfo-css/custom.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });
    }

    onRefreshClick() {
        this.initIFrame();
        this.syncComponent.requestSync();
    }

    onNextClick() {
        this._router.navigate(['app/cfo/cashflow']);
    }
}
