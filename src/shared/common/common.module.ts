/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';

/** Application imports */
import { ZipCodeFormatterPipe } from '@shared/common/pipes/zip-code-formatter/zip-code-formatter.pipe';
import { InfoComponent } from '@shared/common/widgets/info/info.component';
import { CalendarComponent } from './widgets/calendar/calendar.component';
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
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';

@NgModule({
    declarations: [
        CalendarComponent,
        CustomNumberPipe,
        NumberToWordsPipe,
        PhoneFormatPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent,
        CountryPhoneNumberComponent,
        TitleCasePipe,
        ModalDialogComponent,
        ConditionsModalComponent
    ],
    exports: [
        CalendarComponent,
        CustomNumberPipe,
        NumberToWordsPipe,
        PhoneFormatPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent,
        CountryPhoneNumberComponent,
        TitleCasePipe,

        ModalDialogComponent,
        ConditionsModalComponent,
        NoDataModule
    ],
    imports: [
        ngCommon.CommonModule,
        NoDataModule,
        RouterModule,
        FormsModule,
        InternationalPhoneNumberModule,
        MatDialogModule
    ],
    entryComponents: [
        ModalDialogComponent,
        ConditionsModalComponent
    ],
    providers: [
        AppUrlService,
        CellsCopyingService
    ]
})
export class CommonModule {
}
