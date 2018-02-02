import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { AbpModule } from '@abp/abp.module';

import { MatDialogModule } from '@angular/material';

import { AppSessionService } from './session/app-session.service';
import { AppUrlService } from './nav/app-url.service';

import { ExportService } from './export/export.service';
import { ExportGoogleSheetService } from './export/export-google-sheets/export-google-sheets';

import { ModalDialogComponent } from './dialogs/modal/modal-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm/confirm-dialog.component';
import { CalendarComponent } from './widgets/calendar/calendar.component';

import { DxCheckBoxModule, DxTextBoxModule, DxScrollViewModule } from 'devextreme-angular';

import { AppUiCustomizationService } from './ui/app-ui-customization.service';
import { AppAuthService } from './auth/app-auth.service';
import { AppRouteGuard } from './auth/auth-route-guard';

@NgModule({
    declarations: [
      CalendarComponent,
      ConfirmDialogComponent,
      ModalDialogComponent
    ],
    exports: [
      CalendarComponent,
      ConfirmDialogComponent,
      ModalDialogComponent
    ],
    entryComponents: [
      ConfirmDialogComponent,
      ModalDialogComponent
    ],
    imports: [
      DxCheckBoxModule,
      DxTextBoxModule,
      DxScrollViewModule,
      MatDialogModule,
      ngCommon.CommonModule,
      AbpModule
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
                AppUiCustomizationService
            ]
        };
    }
}