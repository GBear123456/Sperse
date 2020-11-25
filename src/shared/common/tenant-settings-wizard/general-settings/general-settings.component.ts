import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'general-settings',
    templateUrl: 'general-settings.component.html',
    styleUrls: [ 'general-settings.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralSettingsComponent {
    constructor(public ls: AppLocalizationService) {}
}