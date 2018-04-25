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
import { NoDataComponent } from './widgets/no-data/no-data.component';

import { DxCheckBoxModule, DxTextBoxModule, DxScrollViewModule, DxTabsModule, DxDataGridModule, DxTagBoxModule } from 'devextreme-angular';

import { AppUiCustomizationService } from './ui/app-ui-customization.service';
import { AppAuthService } from './auth/app-auth.service';
import { AppRouteGuard } from './auth/auth-route-guard';
import { BankAccountsWidgetComponent } from 'shared/cfo/bank-accounts-widget/bank-accounts-widget.component';
import { SelectionFilterComponent } from '@shared/common/widgets/selection-filter/selection-filter.component';
import { InfoComponent } from '@shared/common/widgets/info/info.component';
import { CellsCopyingService } from '@shared/common/xls-mode/cells-copying/cells-copying.service';

@NgModule({
    declarations: [
        CalendarComponent,
        ConfirmDialogComponent,
        ModalDialogComponent,
        NoDataComponent,
        BankAccountsWidgetComponent,
        SelectionFilterComponent,
        InfoComponent
    ],
    exports: [
        CalendarComponent,
        ConfirmDialogComponent,
        ModalDialogComponent,
        NoDataComponent,
        BankAccountsWidgetComponent,
        SelectionFilterComponent,
        InfoComponent
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
        DxTagBoxModule,
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
