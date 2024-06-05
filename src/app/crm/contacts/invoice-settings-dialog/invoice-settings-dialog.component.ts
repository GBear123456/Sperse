/** Core imports */
import { Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';

/** Third party imports */
import { filter, finalize, first } from 'rxjs/operators';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { NotifyService } from 'abp-ng2-module';
import Validator from 'devextreme/ui/validator';

/** Application imports */
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    EmailTemplateType,
    TenantPaymentSettingsServiceProxy,
    UpdateInvoiceSettingsDto,
    InvoiceSettingsDto,
    InvoicePaymentMethod
} from '@shared/service-proxies/service-proxies';
import { BankSettingsDialogComponent } from '@app/crm/shared/bank-settings-dialog/bank-settings-dialog.component';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { AppPermissions } from '@shared/AppPermissions';
import { FeatureCheckerService } from 'abp-ng2-module';
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
    @ViewChild(ModalDialogComponent) modalDialog: ModalDialogComponent;
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    @ViewChild('dueGraceValidator') dueGraceValidatorComponent;

    settings = new InvoiceSettingsDto();
    hasBankCodeFeature: boolean = this.featureCheckerService.isEnabled(AppFeatures.CRMBANKCode);
    isManageUnallowed = !this.permission.isGranted(AppPermissions.CRMSettingsConfigure);
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
    paymentMethods = Object.keys(InvoicePaymentMethod).filter(v => typeof InvoicePaymentMethod[v] === "number").map(item => {
        return {
            id: item,
            checked: true,
            visible: false,
            value: InvoicePaymentMethod[item],
            name: this.ls.l(item)
        }
    });
    EmailTemplateType = EmailTemplateType;

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
        this.invoicesService.settings$.pipe(
            filter(Boolean),
            first(),
            finalize(() => {
                this.modalDialog.finishLoading();
            }))
            .subscribe((result: InvoiceSettingsDto) => {
                this.settings = result;
                this.initPaymentMethods();
                this.changeDetectorRef.markForCheck();
            });
        this.changeDetectorRef.detectChanges();
    }

    save() {
        if (this.isManageUnallowed)
            return;

        let dueGraceValidator = this.dueGraceValidatorComponent.instance as Validator;
        if (!dueGraceValidator.validate().isValid)
            return;

        this.modalDialog.startLoading();
        this.tenantPaymentSettingsProxy.updateInvoiceSettings(new UpdateInvoiceSettingsDto(this.settings))
            .pipe(
                finalize(() => {
                    this.modalDialog.finishLoading();
                })
            ).subscribe(() => {
                this.notifyService.info(this.ls.l('SavedSuccessfully'));
                this.invoicesService.invalidateSettings(this.settings);
                this.dialogRef.close(this.settings);
            });
    }

    initPaymentMethods() {
        this.paymentMethods.forEach(v => {
            v.checked = (this.settings.forbiddenPaymentMethods & v.value) != v.value;
        });
        this.paymentMethods.forEach(v => {
            v.visible = (this.settings.unsupportedPaymentMethods & v.value) != v.value && (this.settings.configuredPaymentMethods & v.value) == v.value;
        });
    }

    paymentMethodChanged(event, value) {
        if (event.value) {
            this.settings.forbiddenPaymentMethods ^= value;
        }
        else {
            this.settings.forbiddenPaymentMethods |= value;
        }
    }

    onDueGracePeriodFocusOut() {
        let dueGraceValidator = this.dueGraceValidatorComponent.instance as Validator;
        dueGraceValidator.validate();
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