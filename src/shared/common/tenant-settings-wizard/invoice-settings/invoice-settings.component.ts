<<<<<<< HEAD
/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { Observable, throwError } from 'rxjs';
import Validator from 'devextreme/ui/validator';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantPaymentSettingsServiceProxy,
    UpdateInvoiceSettingsDto,
    InvoiceSettingsDto,
    EmailTemplateType,
    InvoicePaymentMethod
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';

@Component({
    selector: 'invoice-settings',
    templateUrl: 'invoice-settings.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'invoice-settings.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSettingsComponent implements ITenantSettingsStepComponent {
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    @ViewChild('dueGraceValidator') dueGraceValidatorComponent;

    settings: InvoiceSettingsDto;

    EmailTemplateType = EmailTemplateType;
    paymentMethods = Object.keys(InvoicePaymentMethod).filter(v => typeof InvoicePaymentMethod[v] === "number").map(item => {
        return {
            id: item,
            checked: true,
            visible: false,
            value: InvoicePaymentMethod[item],
            name: this.ls.l(item)
        }
    });

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getInvoiceSettings(true).subscribe((invoiceSettings) => {
            this.settings = invoiceSettings;
            this.initPaymentMethods();
            this.changeDetectorRef.detectChanges();
        });
    }

    onDueGracePeriodFocusOut() {
        let dueGraceValidator = this.dueGraceValidatorComponent.instance as Validator;
        dueGraceValidator.validate();
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

    removeSourceContact(event) {
        event.stopPropagation();
        this.onAdvisorContactChanged();
    }

    save(): Observable<any> {
        let dueGraceValidator = this.dueGraceValidatorComponent.instance as Validator;
        if (!dueGraceValidator.validate().isValid)
            return throwError('');

        return this.tenantPaymentSettingsProxy.updateInvoiceSettings(new UpdateInvoiceSettingsDto(this.settings));
    }
=======
/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild
} from '@angular/core';

/** Third party imports */
import { Observable, throwError } from 'rxjs';
import Validator from 'devextreme/ui/validator';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    TenantPaymentSettingsServiceProxy,
    UpdateInvoiceSettingsDto,
    InvoiceSettingsDto,
    EmailTemplateType,
    InvoicePaymentMethod
} from '@shared/service-proxies/service-proxies';
import { ITenantSettingsStepComponent } from '@shared/common/tenant-settings-wizard/tenant-settings-step-component.interface';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';

@Component({
    selector: 'invoice-settings',
    templateUrl: 'invoice-settings.component.html',
    styleUrls: [
        '../shared/styles/common.less',
        'invoice-settings.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceSettingsComponent implements ITenantSettingsStepComponent {
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    @ViewChild('dueGraceValidator') dueGraceValidatorComponent;

    settings: InvoiceSettingsDto;

    EmailTemplateType = EmailTemplateType;
    paymentMethods = Object.keys(InvoicePaymentMethod).filter(v => typeof InvoicePaymentMethod[v] === "number").map(item => {
        return {
            id: item,
            checked: true,
            visible: false,
            value: InvoicePaymentMethod[item],
            name: this.ls.l(item)
        }
    });

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getInvoiceSettings(true).subscribe((invoiceSettings) => {
            this.settings = invoiceSettings;
            this.initPaymentMethods();
            this.changeDetectorRef.detectChanges();
        });
    }

    onDueGracePeriodFocusOut() {
        let dueGraceValidator = this.dueGraceValidatorComponent.instance as Validator;
        dueGraceValidator.validate();
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

    removeSourceContact(event) {
        event.stopPropagation();
        this.onAdvisorContactChanged();
    }

    save(): Observable<any> {
        let dueGraceValidator = this.dueGraceValidatorComponent.instance as Validator;
        if (!dueGraceValidator.validate().isValid)
            return throwError('');

        return this.tenantPaymentSettingsProxy.updateInvoiceSettings(new UpdateInvoiceSettingsDto(this.settings));
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}