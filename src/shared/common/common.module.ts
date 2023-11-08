/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';

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
import { TitleCasePipe } from './pipes/title-case/title-case.pipe';
import { AppUrlService } from '@shared/common/nav/app-url.service';
import { BulkProgressDialogComponent } from '@shared/common/dialogs/bulk-progress/bulk-progress-dialog.component';
import { RegisterConfirmComponent } from '@shared/common/dialogs/register-confirm/register-confirm.component';
import { ConditionsModalComponent } from '@shared/common/conditions-modal/conditions-modal.component';
import { ConditionsModalService } from '@shared/common/conditions-modal/conditions-modal.service';
import { DxDataGridDirective } from '@shared/common/dx-data-grid/dx-data-grid.directive';
import { NoDataModule } from '@shared/common/widgets/no-data/no-data.module';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { PrimengTableHelper } from '@shared/helpers/PrimengTableHelper';
import { PhoneFormatModule } from '@shared/common/pipes/phone-format/phone-format.module';
import { GhostListModule } from '@app/shared/common/ghost-list/ghost-list.module';
import { ModalDialogModule } from './dialogs/modal/modal-dialog.module';
import { CountryPhoneNumberModule } from './phone-numbers/country-phone-number.module';
import { DateTimeModule } from '@shared/common/pipes/datetime/datetime.module';
import { DateTimePipe } from '@shared/common/pipes/datetime/datetime.pipe';
import { UploaderComponent } from './uploader/uploader.component';
import { NgxFileDropModule } from 'ngx-file-drop';

@NgModule({
    declarations: [
        CalendarComponent,
        CustomNumberPipe,
        NumberToWordsPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent,
        TitleCasePipe,
        RegisterConfirmComponent,
        ConditionsModalComponent,
        BulkProgressDialogComponent,
        DxDataGridDirective,
        UploaderComponent
    ],
    exports: [
        CalendarComponent,
        UploaderComponent,
        CustomNumberPipe,
        NumberToWordsPipe,
        PhoneFormatPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent,
        TitleCasePipe,
        DxDataGridDirective,
        NoDataModule,
        GhostListModule,
        DateTimePipe,
        CountryPhoneNumberModule
    ],
    imports: [
        ngCommon.CommonModule,
        ModalDialogModule,
        NoDataModule,
        RouterModule,
        FormsModule,
        CountryPhoneNumberModule,
        MatProgressBarModule,
        MatDialogModule,
        DxTextBoxModule,
        DxCheckBoxModule,
        PhoneFormatModule,
        DateTimeModule,
        NgxFileDropModule
    ],
    entryComponents: [
        RegisterConfirmComponent,
        BulkProgressDialogComponent
    ],
    providers: [
        AppUrlService,
        CellsCopyingService,
        CacheHelper,
        PrimengTableHelper,
        ConditionsModalService
    ]
})
export class CommonModule {}