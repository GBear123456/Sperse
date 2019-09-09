import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-consumer-statements',
    templateUrl: './consumer-statements.component.html',
    styleUrls: ['./consumer-statements.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsumerStatementsComponent  {
    @Input() creditReport;

    constructor(
        public ls: AppLocalizationService
    ) {
    }
}
