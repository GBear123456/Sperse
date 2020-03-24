import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-announcements',
    templateUrl: './announcements.component.html',
    styleUrls: [
        '../../shared/common/styles/card-header.less',
        '../../shared/common/styles/card-title.less',
        '../../shared/common/styles/card-body.less',
        '../../shared/common/styles/card-text-footer.less',
        './announcements.component.less'
    ]
})
export class AnnouncementsComponent {

    constructor(public ls: AppLocalizationService) {}

}
