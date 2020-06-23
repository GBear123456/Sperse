import { Component, OnInit } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'questionnaire',
    templateUrl: './questionnaire.component.html',
    styleUrls: ['./questionnaire.component.less']
})
export class QuestionnaireComponent implements OnInit {
    constructor(
        public ls: AppLocalizationService
    ) {
    }
    ngOnInit() {
    }
}
