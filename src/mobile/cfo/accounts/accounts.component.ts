import { AppComponentBase } from "shared/common/app-component-base";
import { Component, OnInit, Injector } from '@angular/core';
import { FinancialInformationServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { OnDestroy } from "@angular/core/src/metadata/lifecycle_hooks";

@Component({
    selector: 'accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.less'],
    providers: [ FinancialInformationServiceProxy ]
})
export class AccountsComponent extends AppComponentBase implements OnInit, OnDestroy  {
    sourceUrl: any;
    instanceId: number;
    instanceType: string;

    protected _route: ActivatedRoute;

    private _sub: any;

    constructor(
        injector: Injector,
        private sanitizer: DomSanitizer,
        private _financialInformationServiceProxy: FinancialInformationServiceProxy,
        private _router: Router
    ) {
        super(injector);

        this._route = injector.get(ActivatedRoute);
        this._sub = this._route.params.subscribe(params => {
            let instance = params['instance'];

            if (!(this.instanceId = parseInt(instance))) {
                this.instanceId = undefined;
            }
            this.instanceType = this.capitalize(instance);
        });
    }

    ngOnInit() {
        this.initIFrame();
    }

    ngOnDestroy() {
        this._sub.unsubscribe();
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
}
