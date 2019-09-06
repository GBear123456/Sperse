import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-personal-info',
    templateUrl: './personal-info.component.html',
    styleUrls: ['./personal-info.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalInfoComponent {
    @Input() creditReport;

    constructor(
        public ls: AppLocalizationService
    ) {
    }
}
