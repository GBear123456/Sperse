<<<<<<< HEAD
import { Component, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LeftMenuItem } from '../../../shared/common/left-menu/left-menu-item.interface';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'api-left-menu',
})
export class LeftMenuComponent {
    @Input() selectedItemIndex: number;
    public readonly leftMenuItems: LeftMenuItem[] = [
        {
            caption: this.ls.l('API_Platform'),
            iconSrc: './assets/common/icons/arrow-two-side.svg'
        },
        {
            caption: this.ls.l('API_CRM'),
            iconSrc: './assets/common/icons/people.svg'
        },
        {
            caption: this.ls.l('API_CFO'),
            iconSrc: './assets/common/icons/statistics.svg'
        },
        {
            caption: this.ls.l('API_CreditReports'),
            iconSrc: './assets/common/icons/document.svg'
        },
        {
            caption: this.ls.l('API_Tenant'),
            iconSrc: './assets/common/icons/person.svg'
        }
    ];

    constructor(
        public layoutService: LayoutService,
        public ls: AppLocalizationService
    ) {}
}
=======
import { Component, Input } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { LeftMenuItem } from '../../../shared/common/left-menu/left-menu-item.interface';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.less'],
    selector: 'api-left-menu',
})
export class LeftMenuComponent {
    @Input() selectedItemIndex: number;
    public readonly leftMenuItems: LeftMenuItem[] = [
        {
            caption: this.ls.l('API_Platform'),
            iconSrc: './assets/common/icons/arrow-two-side.svg'
        },
        {
            caption: this.ls.l('API_CRM'),
            iconSrc: './assets/common/icons/people.svg'
        },
        {
            caption: this.ls.l('API_CFO'),
            iconSrc: './assets/common/icons/statistics.svg'
        },
        {
            caption: this.ls.l('API_CreditReports'),
            iconSrc: './assets/common/icons/document.svg'
        },
        {
            caption: this.ls.l('API_Tenant'),
            iconSrc: './assets/common/icons/person.svg'
        }
    ];

    constructor(
        public layoutService: LayoutService,
        public ls: AppLocalizationService
    ) {}
}
>>>>>>> f999b481882149d107812286d0979872df712626
