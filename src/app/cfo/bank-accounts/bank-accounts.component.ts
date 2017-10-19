import { Component, OnInit, Injector } from '@angular/core';
import { FinancialInformationServiceProxy } from '@shared/service-proxies/service-proxies';
import { AppComponentBase } from '@shared/common/app-component-base';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
        // this._FinancialInformationServiceProxy.getSetupAccountsLink(
        //     'https://dl.dropboxusercontent.com/s/jfn70y0kyg4hoc1/kba-override.css',
        //     ''
        // ).subscribe(result => {
        //     console.log(result);
        //     this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl( result);
        // });

        this.sourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl( 'https://embed.quovo.com/auth/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWFkX29ubHkiOm51bGwsImlwIjoiMTkzLjkzLjIxOS42IiwidXNlciI6MjQ0ODExNCwiaWQiOiJkYWRlN2RhYTM3MjliYmE3ZWY0MjNjYjRjZTA5M2RkYTMxMmY5MTkyIiwic3luY190eXBlIjoiYWdnIiwib25lX3RpbWVfdXNlIjp0cnVlLCJzdWIiOiIyNDQ4MTE0IiwidHlwZSI6ImlmcmFtZSIsImV4cCI6MTUwODQyMzA5NywiaWF0IjoxNTA4NDE5NDk3LCJpcF9yZXN0cmljdGVkIjpmYWxzZX0._EPQ7OkiS7TXmp_vURjzLxxm421ZNUqyDVcWNKwsXg8?test-institutions=1');
    }
}
