import { Component, OnInit, Injector } from '@angular/core';
import { FinancialInformationServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'bank-accounts',
    templateUrl: './bank-accounts.component.html',
    styleUrls: ['./bank-accounts.component.less'],
    providers: [ FinancialInformationServiceProxy ]
})
export class BankAccountsComponent extends AppComponentBase implements OnInit {
    sourceUrl: any;
    constructor(
        injector: Injector,
        private sanitizer: DomSanitizer,
        private _FinancialInformationServiceProxy: FinancialInformationServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this._FinancialInformationServiceProxy.getSetupAccountsLink(
            'https://dl.dropboxusercontent.com/s/jfn70y0kyg4hoc1/kba-override.css',
            ''
        ).subscribe((data) => {
            this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.setupAccountsLink);
        });
    }
}
