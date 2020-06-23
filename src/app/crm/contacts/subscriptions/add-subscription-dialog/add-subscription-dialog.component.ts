/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild
} from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import values from 'lodash/values';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import {
    InvoiceSettings,
    LayoutType,
    OrderSubscriptionServiceProxy,
    SubscriptionInput,
    UpdateOrderSubscriptionInput
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { DxDropDownBoxComponent, DxValidationGroupComponent } from '@root/node_modules/devextreme-angular';
import { OrderDropdownComponent } from '@app/crm/shared/order-dropdown/order-dropdown.component';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { BankCodeServiceType } from '@root/bank-code/products/bank-code-service-type.enum';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { DateHelper } from '@shared/helpers/DateHelper';
import { AppSessionService } from "@shared/common/session/app-session.service";
import { ServiceType } from '@app/crm/contacts/subscriptions/add-subscription-dialog/service-type.interface';

@Component({
    selector: 'add-subscription-dialog',
    templateUrl: './add-subscription-dialog.component.html',
    styleUrls: [
        '../../../../../shared/common/styles/close-button.less',
        '../../../../shared/common/styles/form.less',
        './add-subscription-dialog.component.less'
    ]
})
export class AddSubscriptionDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent;
    @ViewChild(OrderDropdownComponent, { static: true }) orderDropdownComponent: OrderDropdownComponent;
    @ViewChild(DxDropDownBoxComponent, { static: false }) servicesDropDown: DxDropDownBoxComponent;
    private slider: any;
    isBankCodeLayout: boolean = this.userManagementService.isLayout(LayoutType.BankCode);
    hasBankCodeFeature: boolean = this.userManagementService.checkBankCodeFeature();
    isPerformancePartnersTenant: boolean = this.appSession.tenancyName === 'performancepartners';
    servicesTypesGroupsNumber: number = (+this.isPerformancePartnersTenant) + (+this.hasBankCodeFeature);
    private readonly performancePartnersServiceTypes: ServiceType[] = [
        { id: '1', name: this.ls.l('Performance Partners Services'), expanded: true },
        { id: '1_1', name: 'EDAG', groupId: '1' },
        { id: '1_2', name: 'Call Rollover', groupId: '1' },
        { id: '1_4', name: 'Appointment Setting', groupId: '1' },
        { id: '1_5', name: 'List Generation', groupId: '1' },
        { id: '1_6', name: 'Insurance Billing', groupId: '1' },
        { id: '1_7', name: 'Misc Services', groupId: '1' },
        { id: '1_8', name: 'Collections', groupId: '1' }
    ]
    private readonly bankCodeServiceTypes: ServiceType[] = [
            {
                id: '2',
                name: this.ls.l('Codebreaker Subscriptions'),
                expanded: this.servicesTypesGroupsNumber === 1
            }
        ].concat(
            values(BankCodeServiceType).map((serviceType: string, index: number) => {
                return {
                    name: serviceType,
                    groupId: '2',
                    id: '2_' + index,
                    expanded: false
                };
            })
        );
    serviceTypes: ServiceType[] = (
        this.isPerformancePartnersTenant ? this.performancePartnersServiceTypes : []
    ).concat(
        this.hasBankCodeFeature ? this.bankCodeServiceTypes : []
    );
    subscription: UpdateOrderSubscriptionInput = new UpdateOrderSubscriptionInput({
        contactId: this.data.contactId,
        leadId: this.data.leadId,
        orderNumber: this.data.orderNumber,
        systemType: this.data.systemType || (this.isBankCodeLayout ? 'BANKCODE' : undefined),
        subscriptions: [
            new SubscriptionInput({
                name: this.data.name,
                code: this.data.code,
                level: this.data.level,
                endDate: this.data.endDate,
                amount: this.data.amount
            })
        ],
        updateThirdParty: false
    });
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(
        map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );

    constructor(
        private elementRef: ElementRef,
        private orderSubscriptionProxy: OrderSubscriptionServiceProxy,
        private notify: NotifyService,
        private contactsService: ContactsService,
        private userManagementService: UserManagementService,
        private invoicesService: InvoicesService,
        private appSession: AppSessionService,
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
            const subscriptionInput = new UpdateOrderSubscriptionInput(this.subscription);
            subscriptionInput.updateThirdParty = false;
            subscriptionInput.subscriptions = subscriptionInput.subscriptions.map((subscription: SubscriptionInput) => {
                let sub = new SubscriptionInput(subscription);
                if (sub.endDate)
                    sub.endDate = DateHelper.removeTimezoneOffset(new Date(sub.endDate), true, 'to');
                if (this.isBankCodeLayout && sub.code === BankCodeServiceType.BANKVault)
                    subscriptionInput.updateThirdParty = true;
                return sub;
            });
            this.orderSubscriptionProxy.update(subscriptionInput).subscribe(() => {
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

    onServiceTypeChanged(event, subscription: SubscriptionInput) {
        if (event.value)
            subscription.name = event.value;
    }

    onItemClick(event, subscription: SubscriptionInput) {
        /** Allow choosing only children of groups */
        if (event.itemData.groupId) {
            subscription.name = subscription.code = event.itemData.name;
            /** Change system type for codebreaker services */
            if (event.itemData.groupId === '2') {
                this.subscription.systemType = 'BANKCODE';
            }
            if (this.servicesDropDown && this.servicesDropDown.instance) {
                this.servicesDropDown.instance.close();
            }
        }
    }

    removeSubscriptionFields(index) {
        this.subscription.subscriptions.splice(index, 1);
    }
}
