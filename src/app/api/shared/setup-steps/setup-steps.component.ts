import { Component, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    templateUrl: './setup-steps.component.html',
    styleUrls: ['./setup-steps.component.less'],
    selector: 'setup-steps',
})
export class SetupStepComponent {

    @Input() SelectedStepIndex: number;
    public readonly SetupSteps = [
        'API_Platform',
        'API_CRM',
        'API_CFO',
        'API_CreditReports',
        'API_Tenant'
    ];

    constructor(public ls: AppLocalizationService) {}

}
