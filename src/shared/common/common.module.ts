import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { AbpModule } from '@abp/abp.module';

import { MdDialogModule } from '@angular/material';

import { AppSessionService } from './session/app-session.service';
import { AppUrlService } from './nav/app-url.service';
import { ExportService } from './export/export.service';
import { ExportGoogleSheetService } from './export/export-google-sheets/export-google-sheets';

import { ModalDialogComponent } from './dialogs/modal/modal-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm/confirm-dialog.component';
import { CalendarComponent } from './widgets/calendar/calendar.component';

import { DxCheckBoxModule } from 'devextreme-angular';

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
      MdDialogModule,
      ngCommon.CommonModule,
      AbpModule
    ]
})
export class CommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: CommonModule,
            providers: [
                AppSessionService,
                AppUrlService,
                ExportService,
                ExportGoogleSheetService
            ]
        }
    }
}