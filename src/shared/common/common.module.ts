import * as ngCommon from '@angular/common';
import {NgModule, ModuleWithProviders} from '@angular/core';
import {AbpModule} from '@abp/abp.module';
import {RouterModule} from '@angular/router';

import {MatDialogModule} from '@angular/material';

import {AppSessionService} from './session/app-session.service';
import {AppUrlService} from './nav/app-url.service';

import {ExportService} from './export/export.service';
import {ExportGoogleSheetService} from './export/export-google-sheets/export-google-sheets';

import {ModalDialogComponent} from './dialogs/modal/modal-dialog.component';
import {ConfirmDialogComponent} from './dialogs/confirm/confirm-dialog.component';
import {CalendarComponent} from './widgets/calendar/calendar.component';
import {NoDataComponent} from './no-data/no-data.component';

import {DxCheckBoxModule, DxTextBoxModule, DxScrollViewModule, DxTabsModule, DxDataGridModule} from 'devextreme-angular';

import {AppUiCustomizationService} from './ui/app-ui-customization.service';
import {AppAuthService} from './auth/app-auth.service';
import {AppRouteGuard} from './auth/auth-route-guard';
import { BankAccountsWidgetComponent } from 'shared/cfo/bank-accounts-widget/bank-accounts-widget.component';
import { CellsCopyingService } from '@shared/common/xls-mode/cells-copying/cells-copying.service';
import { PhoneFormatPipe } from './pipes/phone-format.pipe';

@NgModule({
    declarations: [
        CalendarComponent,
        ConfirmDialogComponent,
        ModalDialogComponent,
        NoDataComponent,
        BankAccountsWidgetComponent,
        PhoneFormatPipe
    ],
    exports: [
        CalendarComponent,
        ConfirmDialogComponent,
        ModalDialogComponent,
        NoDataComponent,
        BankAccountsWidgetComponent,
        PhoneFormatPipe
    ],
    entryComponents: [
        ConfirmDialogComponent,
        ModalDialogComponent
    ],
    imports: [
        DxCheckBoxModule,
        DxTextBoxModule,
        DxScrollViewModule,
        DxDataGridModule,
        MatDialogModule,
        DxTabsModule,
        ngCommon.CommonModule,
        AbpModule,
        RouterModule
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
