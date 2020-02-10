import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-announcements',
    templateUrl: './announcements.component.html',
    styleUrls: ['./announcements.component.less']
})
export class AnnouncementsComponent {

    constructor(public ls: AppLocalizationService) {}

}
