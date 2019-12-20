/** Core imports */
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import values from 'lodash/values';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import {
    InvoiceSettings,
    OrderSubscriptionServiceProxy,
    SubscriptionInput,
    UpdateOrderSubscriptionInput
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';
import { OrderDropdownComponent } from '@app/crm/shared/order-dropdown/order-dropdown.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { getCurrencySymbol } from '@angular/common';

@Component({
    selector: 'add-subscription-dialog',
    templateUrl: './add-subscription-dialog.component.html',
    styleUrls: [
        '../../../../../shared/common/styles/close-button.less',
        '../../../../shared/common/styles/form.less',
        './add-subscription-dialog.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSubscriptionDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent) validationGroup: DxValidationGroupComponent;
    @ViewChild(OrderDropdownComponent) orderDropdownComponent: OrderDropdownComponent;
    private slider: any;
    isBankCodeLayout: boolean = this.userManagementService.checkBankCodeFeature();
    bankCodeServiceTypes = values(BankCodeServiceType);
    subscription: UpdateOrderSubscriptionInput = new UpdateOrderSubscriptionInput({
        contactId: this.data.contactId,
        orderNumber: this.data.orderNumber,
        systemType: this.data.systemType || (this.isBankCodeLayout ? 'BANKCODE' : undefined),
        subscriptions: [
            new SubscriptionInput({
                name: this.data.name,
                code: this.data.code,
                endDate: this.data.endDate,
                amount: this.data.amount
            })
        ]
    });
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(
        map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );

    constructor(
        private elementRef: ElementRef,
        private orderSubscriptionService: OrderSubscriptionServiceProxy,
        private notify: NotifyService,
        private contactsService: ContactsService,
        private userManagementService: UserManagementService,
        private invoicesService: InvoicesService,
        public dialogRef: MatDialogRef<AddSubscriptionDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });
    }

    ngOnInit() {
        this.dialogRef.disableClose = true;
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
        this.orderDropdownComponent.initOrderDataSource();
    }

    ngAfterViewInit() {
        this.slider.classList.remove('hide');
        this.dialogRef.updateSize(undefined, '100vh');
            this.dialogRef.updatePosition({
                top: '75px',
                right: '0px'
            });
    }

    saveSubscription() {
        if (this.validationGroup.instance.validate().isValid) {
            const subscription = new UpdateOrderSubscriptionInput(this.subscription);
            subscription.subscriptions.forEach((subscription: SubscriptionInput) => {
                subscription.endDate = DateHelper.removeTimezoneOffset(
                    new Date(subscription.endDate),
                    false,
                    'from'
                );
            });
            this.orderSubscriptionService.update(subscription).subscribe(() => {
                this.notify.info(this.ls.l('SavedSuccessfully'));
                this.contactsService.invalidate('subscriptions');
                this.dialogRef.close();
            });
        }
    }

    close() {
        this.dialogRef.close();
    }

    addNewSubscriptionFields() {
        this.subscription.subscriptions.push(
            new SubscriptionInput()
        );
    }

    removeSubscriptionFields(index) {
        this.subscription.subscriptions.splice(index, 1);
    }

}
