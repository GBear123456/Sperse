/** Core imports */
import {NgModule, ModuleWithProviders} from '@angular/core';
import * as ngCommon from '@angular/common';
import {RouterModule} from '@angular/router';

/** Third party imports */

/** Application imports */
import { AppSessionService } from './session/app-session.service';
import { AppUrlService } from './nav/app-url.service';
import { ExportService } from './export/export.service';
import { ExportGoogleSheetService } from './export/export-google-sheets/export-google-sheets';
import { CalendarComponent } from './widgets/calendar/calendar.component';
import { NoDataComponent } from './widgets/no-data/no-data.component';
import { AppUiCustomizationService } from './ui/app-ui-customization.service';
import { AppAuthService } from './auth/app-auth.service';
import { AppRouteGuard } from './auth/auth-route-guard';
import { InfoComponent } from '@shared/common/widgets/info/info.component';
import { CellsCopyingService } from '@shared/common/xls-mode/cells-copying/cells-copying.service';
import { PhoneFormatPipe } from './pipes/phone-format/phone-format.pipe';
import { AddressFormatPipe } from './pipes/address-format.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { ZipCodeFormatterPipe } from '@shared/common/pipes/zip-code-formatter/zip-code-formatter.pipe';

@NgModule({
    declarations: [
        CalendarComponent,
        NoDataComponent,
        PhoneFormatPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent
    ],
    exports: [
        CalendarComponent,
        NoDataComponent,
        PhoneFormatPipe,
        AddressFormatPipe,
        FileSizePipe,
        ZipCodeFormatterPipe,
        InfoComponent,
    ],
    imports: [
        ngCommon.CommonModule,
        RouterModule,
    ]
})
export class CommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: CommonModule,
            providers: [
                AppAuthService,
                AppRouteGuard,
                AppSessionService,
                AppUrlService,
                ExportService,
                ExportGoogleSheetService,
                AppUiCustomizationService,
                CellsCopyingService
            ]
        };
    }
}
