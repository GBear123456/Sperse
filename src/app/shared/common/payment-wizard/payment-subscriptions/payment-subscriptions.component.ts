/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    EventEmitter,
    Injector,
    Output,
    ViewChild,
    OnInit
} from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { CreditCard } from 'angular-cc-library';

/** Application imports */
import * as moment from 'moment-timezone';
import {
    PaymentPeriodType,
    CancelSubscriptionInput,
    TenantSubscriptionServiceProxy,
    ModuleSubscriptionInfoDto,
    PaymentMethodInfo,
    PaymentInfoType,
    BankCardShortInfo
} from '@shared/service-proxies/service-proxies';
import { PaymentService } from '@app/shared/common/payment-wizard/payment.service';
import { CancelSubscriptionDialogComponent } from '@app/crm/contacts/subscriptions/cancel-subscription-dialog/cancel-subscription-dialog.component';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppService } from '@app/app.service';
import { AppConsts } from '@shared/AppConsts';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';
import { ActionMenuComponent } from '@app/shared/common/action-menu/action-menu.component';
import { AppPermissions } from '@root/shared/AppPermissions';
import { PaymentsInfoService } from '../../payments-info/payments-info.service';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';

@Component({
    selector: 'payment-subscriptions',
    templateUrl: './payment-subscriptions.component.html',
    styleUrls: ['./payment-subscriptions.component.less'],
    providers: [TenantSubscriptionServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSubscriptionsComponent extends AppComponentBase implements OnInit {
    @ViewChild(DxDataGridComponent) dataGrid: DxDataGridComponent;
    @ViewChild(ActionMenuComponent) actionMenu: ActionMenuComponent;
    @Output() onShowProducts: EventEmitter<any> = new EventEmitter<any>();
    
    formatting = AppConsts.formatting;
    paymentMethodsTypes = PaymentInfoType;
    moduleSubscriptions: ModuleSubscriptionInfoDto[];
    subscriptionLastPaymentInfos: {[id: number]: PaymentMethodInfo} = {};

    hasManagePaymentsPermission = this.permission.isGranted(AppPermissions.AdministrationTenantSubscriptionManagementPayments);

    actionMenuItems: ActionMenuItem[] = [
        {
            text: this.l('Upgrade'),
            class: 'notes',
            checkVisible: () => this.showOneTimeActivate(this.actionRecordData) || this.showUpgradeButton(this.actionRecordData),
            action: this.upgradeSubscription.bind(this)
        },
        {
            text: this.l('PaymentMethod'),
            class: 'edit',
            checkVisible: () => this.showPaymentMethodMenuOption(this.actionRecordData),
            action: this.redirectToPortal.bind(this),
        },
        {
            text: this.l('Cancel'),
            class: 'delete',
            action: this.cancelSubscription.bind(this),
        }
    ];
    actionRecordData: ModuleSubscriptionInfoDto;

    constructor(
        injector: Injector,
        public appService: AppService,
        public paymentService: PaymentService,
        private dialog: MatDialog,
        private subscriptionProxy: TenantSubscriptionServiceProxy,
        private paymentInfoService: PaymentsInfoService,
        private changeDetectionRef: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit() {
        let subscriptions = this.getDistinctList(this.appService.moduleSubscriptions).filter(item => item.statusId != 'D');
        let subscriptionIds = subscriptions.map(v => v.id);

        if (this.hasManagePaymentsPermission)
        {
            this.startLoading();
            forkJoin([
                this.paymentInfoService.getPaymentMethodsObserverable(),
                this.subscriptionProxy.getSubscriptionsLastPaymentInfo(subscriptionIds)
            ]).subscribe(([allPaymentMethods, lastPayments]) => {
                subscriptionIds.forEach(v => {
                    let paymentInfo = lastPayments.subscriptionsLastPayment[v];
                    if (paymentInfo){
                        let paymentMethod = allPaymentMethods.find(v => v.id == paymentInfo.paymentInfoId);
                        if (paymentMethod) {
                            paymentMethod['gateway'] = paymentInfo.gateway;
                            this.subscriptionLastPaymentInfos[v] = paymentMethod;
                        }
                    }
                });
                this.moduleSubscriptions = subscriptions;
                this.finishLoading();
                this.changeDetectionRef.detectChanges();
                this.repaintGrid();
            });
        } else {
            this.moduleSubscriptions = subscriptions;
            this.changeDetectionRef.detectChanges();
            this.repaintGrid();
        }
    }

    repaintGrid() {
        setTimeout(() => this.dataGrid.instance.repaint(), 100);
    }

    getDistinctList(list): ModuleSubscriptionInfoDto[] {
        let flags = [], output = [];
        for (let i = 0; i < list.length; i++)
            if (!flags[list[i].id]) {
                flags[list[i].id] = true;
                output.push(list[i]);
            }
        return output;
    }

    isExpired(cell) {
        return (cell.data.paymentPeriodType != PaymentPeriodType.LifeTime || cell.data.isTrial == 'true') &&
            cell.data.endDate && moment(cell.data.endDate).diff(moment(), 'minutes') <= 0;
    }

    toggleActionsMenu(event, data) {
        this.actionRecordData = data;
        this.actionMenu.toggle(event.target);
    }

    onMenuItemClick(event) {
        event.itemData.action.call(this);
        this.actionRecordData = null;
        this.actionMenu.hide();
    }

    showOneTimeActivate(data: ModuleSubscriptionInfoDto) {
        return data.statusId == 'A' && data.paymentPeriodType == PaymentPeriodType.OneTime &&
            !this.moduleSubscriptions.some(sub => sub.productGroup && sub.productGroup.toLowerCase() == AppConsts.PRODUCT_GROUP_MAIN && sub.statusId == 'A');
    }

    showUpgradeButton(data: ModuleSubscriptionInfoDto) {
        return data.statusId == 'A' && data.isUpgradable;
    }

    showPaymentMethodMenuOption(actionRecordData: ModuleSubscriptionInfoDto): boolean {
        return this.hasManagePaymentsPermission && 
               [PaymentPeriodType.OneTime, PaymentPeriodType.LifeTime].indexOf(actionRecordData.paymentPeriodType) < 0 && 
               this.subscriptionLastPaymentInfos[actionRecordData.id] && this.subscriptionLastPaymentInfos[actionRecordData.id]['gateway'];
    }

    upgradeSubscription() {
        let productId = this.actionRecordData.productId;
        this.onShowProducts.emit({ upgrade: true, productId: productId });
    }

    cancelSubscription() {
        let capturedData = this.actionRecordData;
        this.dialog.open(CancelSubscriptionDialogComponent, {
            width: '400px',
            data: {
                title: this.l('CancelBillingConfirm')
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.startLoading();
                this.subscriptionProxy
                    .cancelSubscription(new CancelSubscriptionInput({
                        id: capturedData.id,
                        cancellationReason: result.cancellationReason
                    })).pipe(finalize(() => this.finishLoading())).subscribe(() => {
                        capturedData.statusId = 'C';
                        abp.notify.success(this.l('Cancelled'));
                        this.changeDetectionRef.detectChanges();
                        setTimeout(() => location.reload(), 1000);
                    });
            }
        });
    }

    redirectToPortal() {
        this.subscriptionProxy.getUpdatePaymentLink(this.actionRecordData.id)
            .subscribe(res => {
                if (!window.open(res, '_blank')){
                    this.notify.info(this.l('TurnOffPopupBlockerMessage'));
                }
            });
    }

    showAddOnProducts() {
        this.onShowProducts.emit({ productsGroupName: AppConsts.PRODUCT_GROUP_ADD_ON });
    }

    getCardType(cardInfo: BankCardShortInfo): string {
        if (cardInfo.network)
            return cardInfo.network;

        let numberInfo = CreditCard.cardFromNumber(cardInfo.cardNumber);
        return numberInfo && numberInfo.type || 'credit-card';
    }
}