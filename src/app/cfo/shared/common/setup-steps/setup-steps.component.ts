import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { CFOComponentBase } from 'app/cfo/shared/common/cfo-component-base';
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
        { caption: 'BusinessEntity', component: '' },
        { caption: 'Chart', component: '' },
        { caption: 'Rules', component: '/rules' }
    ];

    public headerTitle: string;
    public headerLink: string;

    constructor(injector: Injector,
        private _router: Router) {
        super(injector);

        this.headerTitle = this.l(this._cfoService.initialized ? 'SetupStep_MainHeader' : 'SetupStep_InitialHeader');
        this.headerLink = '/app/cfo/' + this.instanceType.toLowerCase() + '/start';
    }

    ngOnInit(): void {
    }

    onClick(index: number) {
        if (this._cfoService.hasTransactions)
            this._router.navigate(['/app/cfo/' + this.instanceType.toLowerCase() + this.SetupSteps[index].component]);
    }

    getItemClass(index: number) {
        if (index < this.SelectedStepIndex) return 'passed';
        else if (index == this.SelectedStepIndex) return 'current';
        else return '';
    }
}
