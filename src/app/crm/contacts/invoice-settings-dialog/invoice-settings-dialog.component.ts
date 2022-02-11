/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { filter, finalize, first } from 'rxjs/operators';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { NotifyService } from '@abp/notify/notify.service';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    EmailTemplateType,
    TenantPaymentSettingsServiceProxy,
    InvoiceSettings,
    InvoiceSettingsDto,
    Tier2CommissionSource,
    CommissionAffiliateAssignmentMode
} from '@shared/service-proxies/service-proxies';
import { BankSettingsDialogComponent } from '@app/crm/shared/bank-settings-dialog/bank-settings-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissions } from '@shared/AppPermissions';
import { FeatureCheckerService } from '@abp/features/feature-checker.service';
import { AppFeatures } from '@shared/AppFeatures';
import { IDialogButton } from '@shared/common/dialogs/modal/dialog-button.interface';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';

@Component({
    templateUrl: 'invoice-settings-dialog.component.html',
    styleUrls: ['invoice-settings-dialog.component.less'],
    providers: [DialogService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSettingsDialogComponent implements AfterViewInit {
    @ViewChild(ModalDialogComponent, { static: false }) modalDialog: ModalDialogComponent;
    @ViewChild(SourceContactListComponent, { static: false }) sourceComponent: SourceContactListComponent;

    settings = new InvoiceSettingsDto();
    hasCommissionsFeature: boolean = this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions);
    hasBankCodeFeature: boolean = this.featureCheckerService.isEnabled(AppFeatures.CRMBANKCode);
    isManageUnallowed = !this.permission.isGranted(AppPermissions.CRMSettingsConfigure);
    isRateDisabled = this.isManageUnallowed || !this.permission.isGranted(AppPermissions.CRMAffiliatesCommissionsManage);
    buttons: IDialogButton[] = [
        {
            id: 'cancelTemplateOptions',
            title: this.ls.l('Cancel'),
            class: 'default',
            action: () => this.modalDialog.close()
        },
        {
            id: 'saveTemplateOptions',
            title: this.ls.l('Save'),
            disabled: this.isManageUnallowed,
            class: 'primary',
            action: this.save.bind(this)
        }
    ]
    EmailTemplateType = EmailTemplateType;
    tier2SourceOptions = Object.keys(Tier2CommissionSource).map(item => {
        return {
            id: Tier2CommissionSource[item],
            text: this.ls.l(item)
        };
    });
    commissionAffiliateAssignmentModeOptions = Object.keys(CommissionAffiliateAssignmentMode).map(item => {
        return {
            id: CommissionAffiliateAssignmentMode[item],
            text: this.ls.l('AffiliateAssignmentMode_' + item)
        };
    });

    constructor(
        public dialog: MatDialog,
        private notifyService: NotifyService,
        private invoicesService: InvoicesService,
        private dialogRef: MatDialogRef<InvoiceSettingsDialogComponent>,
        private changeDetectorRef: ChangeDetectorRef,
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private permission: AppPermissionService,
        private featureCheckerService: FeatureCheckerService,
        public ls: AppLocalizationService,
    ) {
        this.invoicesService.invalidateSettings();
    }

    ngAfterViewInit() {
        this.modalDialog.startLoading();
        this.invoicesService.settings$.pipe(filter(Boolean), first(),
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe((res: InvoiceSettingsDto) => {
            this.settings = new InvoiceSettingsDto(res);
            this.settings.defaultAffiliateRate = this.convertFromPercent(this.settings.defaultAffiliateRate);
            this.settings.defaultAffiliateRateTier2 = this.convertFromPercent(this.settings.defaultAffiliateRateTier2);
            this.changeDetectorRef.markForCheck();
        });
        this.changeDetectorRef.detectChanges();
    }

    save() {
        if (this.isManageUnallowed)
            return;

        this.modalDialog.startLoading();
        this.settings.defaultAffiliateRate = this.convertToPercent(this.settings.defaultAffiliateRate);
        this.settings.defaultAffiliateRateTier2 = this.convertToPercent(this.settings.defaultAffiliateRateTier2);
        this.tenantPaymentSettingsProxy.updateInvoiceSettings(new InvoiceSettings(this.settings)).pipe(
            finalize(() => this.modalDialog.finishLoading())
        ).subscribe(() => {
            this.notifyService.info(this.ls.l('SavedSuccessfully'));
            this.invoicesService.invalidateSettings(this.settings);
            this.dialogRef.close(this.settings);
        });
    }

    showBankSettingsDialog() {
        this.dialog.open(BankSettingsDialogComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {
                isManageUnallowed: this.isManageUnallowed
            }
        });
    }

    convertFromPercent(value: number): number {
        if (value !== null)
            return parseFloat((value * 100).toFixed(2));
        return value;
    }

    convertToPercent(value: number): number {
        if (value !== null)
            return parseFloat((value / 100).toFixed(4));
        return value;
    }

    openAdvisorContactList(event) {
        this.sourceComponent.toggle();
        event.stopPropagation();
    }

    onAdvisorContactChanged(contact?) {
        this.settings.defaultAdvisorContactId = contact ? contact.id : null;
        if (contact) {
            this.settings.advisorName = contact.name;
        }
        else {
            this.settings.advisorName = null;
        }
        contact && this.sourceComponent.toggle();
    }

    removeSourceContact(event) {
        event.stopPropagation();
        this.onAdvisorContactChanged();
    }
}