/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild,
    Input
} from '@angular/core';

/** Third party imports */

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    LandingPageWordingSettingsDto
} from '@shared/service-proxies/service-proxies';
import { LandingPageListComponent } from '../landing-page-list/landing-page-list.component';

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
    @ViewChild(LandingPageListComponent, { static: false }) landingPageList: LandingPageListComponent;

    @Input() title: string;
    @Input() wordings: LandingPageWordingSettingsDto[];
    @Input() itemTitle: string = 'Title';
    @Input() textTitle: string = 'Text';

    constructor(
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
    }

    isValid(): boolean {
        return this.landingPageList.isValid();
    }
}