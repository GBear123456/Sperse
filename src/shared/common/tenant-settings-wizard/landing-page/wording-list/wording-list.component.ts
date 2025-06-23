/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild,
    Input
} from '@angular/core';

/** Third party imports */
import { DxValidationGroupComponent } from 'devextreme-angular/ui/validation-group';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    LandingPageWordingSettingsDto
} from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'wording-list',
    templateUrl: 'wording-list.component.html',
    styleUrls: [
        '../../shared/styles/common.less',
        'wording-list.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WordingListComponent {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent

    @Input() title: string;
    @Input() wordings: LandingPageWordingSettingsDto[];
    @Input() itemTitle: string = 'Title';
    @Input() textTitle: string = 'Text';

    constructor(
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
    }

    addWording(): void {
        this.wordings.push(new LandingPageWordingSettingsDto());
    }

    removeWording(index: number): void {
        this.wordings.splice(index, 1);
    }

    isValid(): boolean {
        return this.validationGroup.instance.validate().isValid;
    }
}