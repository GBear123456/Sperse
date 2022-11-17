/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxTextAreaModule } from 'devextreme-angular/ui/text-area';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { NgxFileDropModule } from 'ngx-file-drop';

/** Application imports */
import { TenantSettingsWizardComponent } from './tenant-settings-wizard.component';
import { AppearanceComponent } from '@shared/common/tenant-settings-wizard/appearance/appearance.component';
import { GeneralSettingsComponent } from '@shared/common/tenant-settings-wizard/general-settings/general-settings.component';
import { TimeZoneComboModule } from '@app/shared/common/timing/timezone-combo.module';
import { UploaderComponent } from '@shared/common/tenant-settings-wizard/general-settings/uploader/uploader.component';
import { EmailComponent } from '@shared/common/tenant-settings-wizard/email/email.component';
import { SecurityComponent } from '@shared/common/tenant-settings-wizard/security/security.component';
import { TenantManagementComponent } from '@shared/common/tenant-settings-wizard/tenant-management/tenant-management.component';
import { UserManagementComponent } from '@shared/common/tenant-settings-wizard/user-management/user-management.component';
import { MemberPortalComponent } from '@shared/common/tenant-settings-wizard/member-portal/member-portal.component';
import { ContactsModule } from '@app/crm/contacts/contacts.module';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { InvoiceSettingsComponent } from './invoice-settings/invoice-settings.component';
import { CommissionsComponent } from './commissions/commissions.component';
import { BankTransferComponent } from './bank-transfer/bank-transfer.component';
import { OtherSettingsComponent } from './other-settings/other-settings.component';
import { SourceContactListModule } from '@shared/common/source-contact-list/source-contact-list.module';

@NgModule({
    imports: [
        CommonModule,
        DxScrollViewModule,
        MatStepperModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatSelectModule,
        DxCheckBoxModule,
        DxSelectBoxModule,
        DxNumberBoxModule,
        DxTextBoxModule,
        DxTextAreaModule,
        DxValidatorModule,
        MatInputModule,
        FormsModule,
        TimeZoneComboModule,
        NgxFileDropModule,
        ContactsModule,
        CountryPhoneNumberModule,
        SourceContactListModule
    ],
    exports: [TenantSettingsWizardComponent],
    declarations: [
        TenantSettingsWizardComponent,
        AppearanceComponent,
        GeneralSettingsComponent,
        UploaderComponent,
        EmailComponent,
        SecurityComponent,
        TenantManagementComponent,
        MemberPortalComponent,
        UserManagementComponent,
        InvoiceSettingsComponent,
        CommissionsComponent,
        BankTransferComponent,
        OtherSettingsComponent
    ],
    entryComponents: [
        TenantSettingsWizardComponent
    ]
})
export class TenantSettingsWizardModule { }
