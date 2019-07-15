/** Core imports */
import { ChangeDetectionStrategy, Component, Inject, ViewChild } from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-external',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './bank-code-external.component.html',
    styleUrls: ['./bank-code-external.component.less']
})
export class BankCodeExternalComponent {

    constructor(
        public ls: AppLocalizationService
    ) {}
}