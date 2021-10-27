/** Core imports */
import { Component, EventEmitter, Input, Output } from '@angular/core';

import invert from 'lodash/invert';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { OrderType } from '@app/crm/orders/order-type.enum';
import { ContactGroup } from '@shared/AppEnums';

@Component({
    selector: 'orders-header-dropdown',
    templateUrl: 'orders-header-dropdown.component.html',
    styleUrls: ['./orders-header-dropdown.component.less']
})
export class OrdersHeaderDropdownComponent {
    @Input() totalCount: number;
    @Input() totalErrorMsg: string;
    @Input() orderType: OrderType;
    @Input() contactGroup: ContactGroup;
    @Output() onOrderTypeChanged: EventEmitter<OrderType> = new EventEmitter<OrderType>();
    @Output() onContactGroupChanged: EventEmitter<ContactGroup> = new EventEmitter<ContactGroup>();

    orderTypes = [
        {
            text: this.ls.l('Orders'),
            value: OrderType.Order
        },
        {
            text: this.ls.l('Subscriptions'),
            value: OrderType.Subscription
        }
    ];

    contactGroupKeys = invert(ContactGroup);
    contactGroups = ['All'].concat(Object.keys(ContactGroup))
        .filter((group: string) => !ContactGroup[group] ||
            this.permission.checkCGPermission([ContactGroup[group]], '')
        ).map((group: string) => ({
            text: this.ls.l('ContactGroup_' + group),
            value: ContactGroup[group]
        }));

    constructor(
        public ls: AppLocalizationService,
        private permission: AppPermissionService
    ) {}

    isTotalCountValid() {
        return Number.isInteger(this.totalCount);
    }
}