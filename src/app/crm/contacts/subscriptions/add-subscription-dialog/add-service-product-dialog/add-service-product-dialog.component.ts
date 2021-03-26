/** Core imports */
import {
    AfterViewInit,
    Component,
    ElementRef,
    Inject,
    OnInit,
    ViewChild,
    ChangeDetectionStrategy,
    ChangeDetectorRef
} from '@angular/core';
import { getCurrencySymbol } from '@angular/common';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

/** Application imports */
import {
    InvoiceSettings,
    ServiceProductServiceProxy,
    ServiceProductDto,
    ServiceProductLevelDto,
    LayoutType
} from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';
import { UserManagementService } from '@shared/common/layout/user-management-list/user-management.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { NotifyService } from '@abp/notify/notify.service';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';

@Component({
    selector: 'add-service-product-dialog',
    templateUrl: './add-service-product-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/common/styles/close-button.less',
        '../../../../../shared/common/styles/form.less',
        './add-service-product-dialog.component.less'
    ],
    providers: [ServiceProductServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddServiceProductDialogComponent implements AfterViewInit, OnInit {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent;
    today = new Date();
    private slider: any;
    serviceProduct: ServiceProductDto;
    amountFormat$: Observable<string> = this.invoicesService.settings$.pipe(
        filter(Boolean), map((settings: InvoiceSettings) => getCurrencySymbol(settings.currency, 'narrow') + ' #,##0.##')
    );

    constructor(
        private elementRef: ElementRef,
        private serviceProductProxy: ServiceProductServiceProxy,
        private notify: NotifyService,
        private invoicesService: InvoicesService,
        private changeDetection: ChangeDetectorRef,
        private userManagementService: UserManagementService,
        public dialogRef: MatDialogRef<AddServiceProductDialogComponent>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.dialogRef.beforeClose().subscribe(() => {
            this.dialogRef.updatePosition({
                top: '75px',
                right: '-100vw'
            });
        });

        this.serviceProduct = new ServiceProductDto();
        this.serviceProduct.systemType = this.userManagementService.isLayout(LayoutType.BankCode) ? 'BANKCODE' : 'General';
        this.serviceProduct.serviceProductLevels = [];
    }

    ngOnInit() {
        this.slider = this.elementRef.nativeElement.closest('.slider');
        this.slider.classList.add('hide', 'min-width-0');
        this.dialogRef.updateSize('0px', '0px');
        this.dialogRef.updatePosition({
            top: '75px',
            right: '-100vw'
        });
    }

    ngAfterViewInit() {
        this.slider.classList.remove('hide');
        this.dialogRef.updateSize(undefined, '100vh');
            this.dialogRef.updatePosition({
                top: '75px',
                right: '0px'
            });
    }

    saveService() {
        if (this.validationGroup.instance.validate().isValid) {
            if (this.serviceProduct.activationTime)
                this.serviceProduct.activationTime = DateHelper.removeTimezoneOffset(new Date(this.serviceProduct.activationTime), true, 'from');
            if (this.serviceProduct.deactivationTime)
                this.serviceProduct.deactivationTime = DateHelper.removeTimezoneOffset(new Date(this.serviceProduct.deactivationTime), true, 'to');
            this.serviceProduct.serviceProductLevels.map(level => {
                if (level.activationTime)
                    level.activationTime = DateHelper.removeTimezoneOffset(new Date(level.activationTime), true, 'from');
                if (level.deactivationTime)
                    level.deactivationTime = DateHelper.removeTimezoneOffset(new Date(level.deactivationTime), true, 'to');
            });

            this.serviceProductProxy.createOrUpdate(this.serviceProduct).subscribe((res: any) => {
                if (!this.serviceProduct.id)
                    this.serviceProduct.id = res.id;
                this.serviceProduct.serviceProductLevels.forEach(level => {
                    res.serviceProductLevels.some(item => {
                        if (level.code == item.code) {
                            level.id = item.id;
                            return true;
                        }
                    });
                });
                this.dialogRef.close(this.serviceProduct);
                this.notify.info(this.ls.l('SavedSuccessfully'));
            });
        }
    }

    close() {
        this.dialogRef.close();
    }

    addNewLevelFields() {
        this.serviceProduct.serviceProductLevels.push(
            new ServiceProductLevelDto()
        );
    }

    removeLevelFields(index) {
        this.serviceProduct.serviceProductLevels.splice(index, 1);
    }

    detectChanges() {
        this.changeDetection.detectChanges();
    }
}
