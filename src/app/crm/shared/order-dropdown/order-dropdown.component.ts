/** Core imports */
import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OrderDto } from '@app/crm/shared/order-dropdown/order-dto.type';
import { OrderFields } from '@app/crm/shared/order-dropdown/order-fields.enum';

@Component({
    selector: 'order-dropdown',
    templateUrl: './order-dropdown.component.html',
    styleUrls: ['./order-dropdown.component.less']
})
export class OrderDropdownComponent {
    @Input() orderId: number;
    @Input() orderNumber: string;
    @Input() disabled;
    @Input() contactId: number;
    @Input() width = '250px';
    @Input() placeholder: string = this.ls.l('Invoice_PurchaseOrderNumber');
    @Output() orderIdChange: EventEmitter<number> = new EventEmitter<number>();
    @Output() orderNumberChange: EventEmitter<string> = new EventEmitter<string>();
    @Output() onValueChange: EventEmitter<any> = new EventEmitter<any>();
    constructor(
        private oDataService: ODataService,
        public ls: AppLocalizationService
    ) {}
    ordersDataSource;
    orderFields: KeysEnum<OrderDto> = OrderFields;

    orderFocusIn(event) {
        if (event.event.target.tagName == 'INPUT')
            setTimeout(() => event.event.target.focus(), 150);
    }

    initOrderDataSource() {
        this.ordersDataSource = new DataSource({
            requireTotalCount: true,
            select: Object.keys(this.orderFields),
            store: new ODataStore({
                key: this.orderFields.Id,
                url: this.oDataService.getODataUrl('order'),
                version: AppConsts.ODataVersion,
                deserializeDates: false,
                beforeSend: (request) => {
                    let contactFilter = '(ContactId eq ' + this.contactId + ')';
                    if (request.params.$filter)
                        request.params.$filter += ' and ' + contactFilter;
                    else
                        request.params.$filter = contactFilter;
                    request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                }
            })
        });
    }

    onOrderNumberValueChanged(event) {
        if (event.event)
            this.orderId = undefined;
        this.orderNumberChange.emit(this.orderNumber);
    }


    onOrderSelected(event, dropBox) {
        let order: OrderDto = event.data;
        if (order) {
            this.orderId = order.Id;
            this.orderNumber = order.Number;
            this.orderIdChange.emit(this.orderId);
            this.orderNumberChange.emit(this.orderNumber);
            dropBox.instance.option('opened', false);
        }
    }

}
