import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-creditor-contacts',
    templateUrl: './creditor-contacts.component.html',
    styleUrls: ['./creditor-contacts.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreditorContactsComponent {
    @Input() creditReport;

    constructor(
        public ls: AppLocalizationService
    ) {
    }
}
