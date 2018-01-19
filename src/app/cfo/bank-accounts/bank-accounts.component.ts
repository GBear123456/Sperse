import {Component, OnInit, Injector, ViewChild, OnDestroy, AfterViewInit} from '@angular/core';
import { FinancialInformationServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOComponentBase } from '@app/cfo/shared/common/cfo-component-base';
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
export class BankAccountsComponent extends CFOComponentBase implements OnInit, AfterViewInit, OnDestroy  {
    @ViewChild(SynchProgressComponent) syncComponent: SynchProgressComponent;

    sourceUrl: any;
    headlineConfig: any;
    private rootComponent: any;

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

        this.headlineConfig = {
            names: [this.l('Setup_Title'), this.l('SetupStep_FinancialAccounts')],
            iconSrc: 'assets/common/icons/magic-stick-icon.svg',
            buttons: [
                {
                    enabled: this._cfoService.initialized,
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
            InstanceType[this.instanceType],
            this.instanceId,
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
        this._cfoService.instanceChangeProcess();
        this._router.navigate(['app/cfo/' + this.instanceType.toLowerCase() + '/start']);
    }

    ngAfterViewInit(): void {
        this.rootComponent = this.getRootComponent();
        this.rootComponent.overflowHidden(true);
    }

    ngOnDestroy() {
        this.rootComponent.overflowHidden();
    }
}
