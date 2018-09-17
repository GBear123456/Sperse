/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatDialogModule } from '@angular/material';
import { DxButtonModule, DxCheckBoxModule, DxValidatorModule, DxTextBoxModule, DxValidationSummaryModule,
    DxScrollViewModule,  } from 'devextreme-angular';

/** Application imports */
import { AccountConnectorDialogComponent } from '@shared/common/account-connector-dialog/account-connector-dialog';
import { AccountConnectorChooserComponent } from '@shared/common/account-connector-dialog/account-connector-chooser/account-connector-chooser.component';
import { QuovoLoginComponent } from '@shared/common/account-connector-dialog/quovo-login/quovo-login.component';
import { XeroLoginComponent } from '@shared/common/account-connector-dialog/xero-login/xero-login.component';
import { ZipCodeFormatterPipe } from '@shared/common/pipes/zip-code-formatter/zip-code-formatter.pipe';
import { InfoComponent } from '@shared/common/widgets/info/info.component';
import { ExportService } from './export/export.service';
import { ExportGoogleSheetService } from './export/export-google-sheets/export-google-sheets';
import { CalendarComponent } from './widgets/calendar/calendar.component';
import { NoDataComponent } from './widgets/no-data/no-data.component';
import { CellsCopyingService } from '@shared/common/xls-mode/cells-copying/cells-copying.service';
import { PhoneFormatPipe } from './pipes/phone-format/phone-format.pipe';
import { CustomNumberPipe } from './pipes/custom-number/custom-number.pipe';
import { NumberToWordsPipe } from './pipes/number-to-words/number-to-words.pipe';
import { AddressFormatPipe } from './pipes/address-format.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { CountryPhoneNumberComponent } from '@shared/common/phone-numbers/country-phone-number.component';
import { InternationalPhoneNumberModule } from '../../node_modules/ngx-international-phone-number/src';
import { TitleCasePipe } from './pipes/title-case/title-case.pipe';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';

@NgModule({
    declarations: [
        CalendarComponent,
        NoDataComponent,
        CustomNumberPipe,
        NumberToWordsPipe,
        PhoneFormatPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent,
        CountryPhoneNumberComponent,
        TitleCasePipe,
        AccountConnectorDialogComponent,
        AccountConnectorChooserComponent,
        XeroLoginComponent,
        QuovoLoginComponent,
        ModalDialogComponent,
        ConditionsModalComponent
    ],
    exports: [
        CalendarComponent,
        NoDataComponent,
        CustomNumberPipe,
        NumberToWordsPipe,
        PhoneFormatPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent,
        CountryPhoneNumberComponent,
        TitleCasePipe,
        AccountConnectorDialogComponent,
        ModalDialogComponent,
        ConditionsModalComponent,
        DxCheckBoxModule
    ],
    imports: [
        ngCommon.CommonModule,
        RouterModule,
        FormsModule,
        InternationalPhoneNumberModule,
        MatDialogModule,
        DxValidatorModule,
        DxTextBoxModule,
        DxValidationSummaryModule,
        DxCheckBoxModule,
        DxScrollViewModule,
        DxButtonModule
    ],
    entryComponents: [
        AccountConnectorDialogComponent,
        ModalDialogComponent,
        ConditionsModalComponent
    ],
    providers: [
        AppUrlService,
        CellsCopyingService,
        ExportService,
        ExportGoogleSheetService
    ]
})
export class CommonModule {
}
