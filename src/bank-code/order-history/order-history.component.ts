import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MemberAreaLink } from '@shared/common/area-navigation/member-area-link.enum';

@Component({
    selector: 'order-history',
    templateUrl: 'order-history.component.html',
    styleUrls: ['order-history.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderHistoryComponent {
    sidebarLinks: MemberAreaLink[] = [
        {
            name: this.ls.l('BankCode_Subscriptions'),
            routerUrl: 'subscriptions'
        },
        {
            name: this.ls.l('BankCode_Payments'),
            routerUrl: 'payments'
        }
    ];
    constructor(public ls: AppLocalizationService) {}
}