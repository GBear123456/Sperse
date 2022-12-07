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
    InvoiceSettings,
    InvoiceSettingsDto,
    EmailTemplateType
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

    constructor(
        private tenantPaymentSettingsProxy: TenantPaymentSettingsServiceProxy,
        private changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.tenantPaymentSettingsProxy.getInvoiceSettings(true).subscribe((invoiceSettings) => {
            this.settings = invoiceSettings;
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

    removeSourceContact(event) {
        event.stopPropagation();
        this.onAdvisorContactChanged();
    }

    save(): Observable<any> {
        let dueGraceValidator = this.dueGraceValidatorComponent.instance as Validator;
        if (!dueGraceValidator.validate().isValid)
            return throwError('');

        return this.tenantPaymentSettingsProxy.updateInvoiceSettings(new InvoiceSettings(this.settings));
    }
}