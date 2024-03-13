/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    EventEmitter,
    Output,
    OnInit,
    ViewChild,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import {
    CreateTenantInput,
    TenantProductInfo,
    PaymentPeriodType,
    PasswordComplexitySetting,
    ProfileServiceProxy,
    TenantServiceProxy,
    TenantEditEditionDto,
    SubscribableEditionComboboxItemDto,
    GetPasswordComplexitySettingOutput,
    ProductServiceProxy,
    ProductDto,
    ProductType,
    RecurringPaymentFrequency
} from '@shared/service-proxies/service-proxies';
import { TenantsService } from '@admin/tenants/tenants.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from 'abp-ng2-module';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

//!!VP should be reimplemnted to use Dx text box instead of inputs
@Component({
    selector: 'createTenantModal',
    templateUrl: './create-tenant-modal.component.html',
    styleUrls: [
        '../modal.less',
        './create-tenant-modal.component.less'
    ],
    providers: [TenantsService, ProductServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTenantModalComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    setRandomPassword = true;
    tenant: CreateTenantInput;
    passwordComplexitySetting: PasswordComplexitySetting = new PasswordComplexitySetting();
    editionsGroups$: Observable<SubscribableEditionComboboxItemDto[][]>;
    editionsModels: { [value: string]: TenantEditEditionDto } = {};
    productId: number;
    products: ProductDto[];
    paymentPeriodType: RecurringPaymentFrequency;
    paymentPeriodTypes: RecurringPaymentFrequency[];
    nameRegEx = AppConsts.regexPatterns.fullName;
    emailRegEx = AppConsts.regexPatterns.email;
    title = this.ls.l('CreateNewTenant');
    buttons: IDialogButton[] = [
        {
            title: this.ls.l('Save'),
            class: 'primary',
            action: this.save.bind(this)
        }
    ];

    constructor(
        private tenantService: TenantServiceProxy,
        private profileService: ProfileServiceProxy,
        private productService: ProductServiceProxy,
        private notifyService: NotifyService,
        private dialogRef: MatDialogRef<CreateTenantModalComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        public tenantsService: TenantsService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.init();
        this.profileService.getPasswordComplexitySetting()
            .pipe(finalize(() => {
                this.modalDialog.finishLoading();
                this.changeDetectorRef.detectChanges();
            }))
            .subscribe((result: GetPasswordComplexitySettingOutput) => {
                this.passwordComplexitySetting = result.setting;
            });
        this.productService.getProducts(ProductType.Subscription, undefined, true).subscribe(response => {
            this.products = response;
        })
    }

    init(): void {
        this.tenant = new CreateTenantInput();
        this.tenant.isActive = true;
        this.tenant.shouldChangePasswordOnNextLogin = true;
        this.tenant.sendActivationEmail = true;
        this.editionsGroups$ = this.tenantsService.getEditionsGroups();
        this.editionsModels = this.tenantsService.editionsModels;
    }

    save(): void {
        if (!this.tenant.tenancyName)
            return this.notifyService.error(this.ls.l('TenancyNameRequired'));

        if (!this.tenant.name)
            return this.notifyService.error(this.ls.l('TenantNameCanNotBeEmpty'));

        if (!this.tenant.adminEmailAddress)
            return this.notifyService.error(this.ls.l('RequiredField', this.ls.l('AdminEmailAddress')));

        if (!this.productId)
            return this.notifyService.error(this.ls.l('TenantEditionIsNotAssigned'));

        if (!this.paymentPeriodType)
            return this.notifyService.error(this.ls.l('RequiredField', this.ls.l('PaymentPeriodType')));

        this.modalDialog.startLoading();
        if (this.setRandomPassword) {
            this.tenant.adminPassword = null;
        }
        this.tenant.editions = this.tenantsService.getTenantEditions();
        this.tenant.products = this.productId == undefined ? undefined : [ 
            new TenantProductInfo({ 
                productId: this.productId,
                paymentPeriodType: this.mapRecurringPaymentFrequencyToPaymentPeriodType(this.paymentPeriodType),
                quantity: 1
            }) 
        ];
        this.tenantService.createTenant(this.tenant)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(() => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.dialogRef.close(true);
                this.modalSave.emit(null);
            });
    }

    onProductChanged(event) {
        if (!event.value) {
            this.paymentPeriodTypes = [];
            return;
        }

        let selectedItem: ProductDto = event.component.option('selectedItem');
        this.productId = selectedItem.id;
        this.paymentPeriodTypes = selectedItem.paymentPeriodTypes;
        this.paymentPeriodType = undefined;
    }

    mapRecurringPaymentFrequencyToPaymentPeriodType(recurringPaymentFrequency: RecurringPaymentFrequency): PaymentPeriodType {
        switch (recurringPaymentFrequency)
        {
            case RecurringPaymentFrequency.Monthly:
                return PaymentPeriodType.Monthly;
            case RecurringPaymentFrequency.Annual:
                return PaymentPeriodType.Annual;
            case RecurringPaymentFrequency.LifeTime:
                return PaymentPeriodType.LifeTime;
            case RecurringPaymentFrequency.OneTime:
                return PaymentPeriodType.OneTime;
            default:
                return undefined;
        }
    }
}
