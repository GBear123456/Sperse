import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-welcome-video',
    templateUrl: './welcome-video.component.html',
    styleUrls: [
        '../../shared/common/styles/card-body.less',
        '../../shared/common/styles/card-header.less',
        './welcome-video.component.less'
    ]
})
export class WelcomeVideoComponent {

    constructor(public ls: AppLocalizationService) {}

}
