import { Component, OnInit, Injector, Input } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    templateUrl: './setup-steps.component.html',
    styleUrls: ['./setup-steps.component.less'],
    selector: 'setup-steps',
})
export class SetupStepComponent extends AppComponentBase implements OnInit {

    @Input() SelectedStepIndex: number;
    public readonly SetupSteps = [
        'FinancialAccounts',
        'BusinessEntity',
        'Chart',        
        'Rules'
    ];

    constructor(injector: Injector) {
        super(injector);

        this.localizationSourceName = AppConsts.localization.CFOLocalizationSourceName;
    }

    ngOnInit(): void {
    }

    getItemClass(index: number) {
        if (index < this.SelectedStepIndex) return 'passed';
        else if (index == this.SelectedStepIndex) return 'current';
        else return '';
    }
}
