import { Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'resources',
    templateUrl: 'resources.component.html',
    styleUrls: ['resources.component.less']
})
export class ResourcesComponent {
    constructor(public ls: AppLocalizationService) {}
}
