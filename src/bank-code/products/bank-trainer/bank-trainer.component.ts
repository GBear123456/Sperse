import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-trainer',
    templateUrl: 'bank-trainer.component.html',
    styleUrls: ['./bank-trainer.component.less']
})
export class BankTrainerComponent {
    constructor(public ls: AppLocalizationService) {}
}
