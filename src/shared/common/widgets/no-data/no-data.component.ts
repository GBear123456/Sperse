import { Component, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'app-no-data',
    templateUrl: './no-data.component.html',
    styleUrls: ['./no-data.component.less']
})
export class NoDataComponent {
    @Input('imageSource') imageSource = './assets/common/icons/no-data-icon.png';
    @Input('title') title: string = this.ls.l('No_Available_Data');
    @Input('text') text = '';
    @Input('showLink') showLink: boolean;
    @Input('linkText') linkText: string;
    @Input('linkUrl') linkUrl: string;

    constructor(private ls: AppLocalizationService) {}

}
