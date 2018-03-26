import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { Router } from '@angular/router';

@Component({
    templateUrl: './setup-steps.component.html',
    styleUrls: ['./setup-steps.component.less'],
    selector: 'setup-steps',
})
export class SetupStepComponent extends CFOComponentBase implements OnInit {

    @Input() SelectedStepIndex: number;
    @Input() SetupSteps = [
        { caption: 'FinancialAccounts', component: '/linkaccounts' },
        { caption: 'BusinessEntity', component: '/business-entities' },
        { caption: 'Chart', component: '/chart-of-accounts' },
        { caption: 'Rules', component: '/rules' }
    ];
    @Input() HeaderTitle: string = this.l(this._cfoService.initialized ? 'SetupStep_MainHeader' : 'SetupStep_InitialHeader');
    @Input() headerLink: string = '/app/cfo/' + this.instanceType.toLowerCase() + '/start';

    constructor(injector: Injector,
        private _router: Router) {
        super(injector);
    }

    ngOnInit(): void {
    }

    onClick(index: number, elem) {
        if (this._cfoService.hasTransactions && elem.component)
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + elem.component]);
    }

    getItemClass(index: number) {
        if (index < this.SelectedStepIndex) return 'passed';
        else if (index == this.SelectedStepIndex) return 'current';
        else return '';
    }
}
