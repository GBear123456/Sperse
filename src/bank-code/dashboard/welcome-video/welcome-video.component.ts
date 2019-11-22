import {Component, OnInit} from '@angular/core';
import {AppLocalizationService} from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'bank-code-welcome-video',
    templateUrl: './welcome-video.component.html',
    styleUrls: ['./welcome-video.component.less']
})
export class WelcomeVideoComponent implements OnInit {

    constructor(public ls: AppLocalizationService) {
    }

    ngOnInit() {
    }

}
