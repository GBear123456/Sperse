import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-gear',
    templateUrl: 'bank-gear.component.html',
    styleUrls: ['./bank-gear.component.less']
})
export class BankGearComponent {
    constructor(public ls: AppLocalizationService) {}
}
