import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@shared/AppConsts';
import { ODataService } from '@shared/common/odata/odata.service';

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

    orderFocusIn(event) {
        if (event.event.target.tagName == 'INPUT')
            setTimeout(() => event.event.target.focus(), 150);
    }

    initOrderDataSource() {
        this.ordersDataSource = {
            uri: 'order',
            requireTotalCount: true,
            store: {
                key: 'Id',
                type: 'odata',
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
                },
                paginate: true
            }
        };
    }

    onOrderNumberValueChanged(event) {
        if (event.event)
            this.orderId = undefined;
    }


    onOrderSelected(event, dropBox) {
        let data = event.data;
        if (data) {
            this.orderId = data.Id;
            this.orderNumber = data.Number;
            this.orderIdChange.emit(this.orderId);
            this.orderNumberChange.emit(this.orderNumber);
            dropBox.instance.option('opened', false);
        }
    }

}
