/** Core imports */
import { Component, ChangeDetectionStrategy } from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'external-auth-info',
    templateUrl: './external-auth-info.component.html',
    styleUrls: ['./external-auth-info.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: []
})
export class ExternalAuthInfoComponent {
    constructor(
        private localizationService: AppLocalizationService
    ) {
    }

    l(key: string, ...args: any[]): string {
        return this.localizationService.l(key, ...args);
    }
}