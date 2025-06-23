<<<<<<< HEAD
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'api-welcome',
    templateUrl: './api-welcome.component.html',
    styleUrls: ['./api-welcome.component.less']
})
export class ApiWelcomeComponent {
    @Input() small: false;
    constructor(
        public ls: AppLocalizationService
    ) {}
}
=======
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'api-welcome',
    templateUrl: './api-welcome.component.html',
    styleUrls: ['./api-welcome.component.less']
})
export class ApiWelcomeComponent {
    @Input() small: false;
    constructor(
        public ls: AppLocalizationService
    ) {}
}
>>>>>>> f999b481882149d107812286d0979872df712626
