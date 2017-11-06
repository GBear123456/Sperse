import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { AbpModule } from '@abp/abp.module';

import { MdDialogModule } from '@angular/material';

import { AppSessionService } from './session/app-session.service';
import { AppUrlService } from './nav/app-url.service';

import { ConfirmDialog } from './dialogs/confirm/confirm-dialog.component';
import { CalendarComponent } from './widgets/calendar/calendar.component';

@NgModule({
    declarations: [
      CalendarComponent,
      ConfirmDialog
    ],
    exports: [
      CalendarComponent,
      ConfirmDialog
    ],
    entryComponents: [
      ConfirmDialog
    ],
    imports: [
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
                AppUrlService
            ]
        }
    }
}