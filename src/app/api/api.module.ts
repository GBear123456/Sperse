import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { ApiRoutingModule } from './api-routing.module';
import { SwaggerComponent } from './swagger/swagger.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { SetupStepComponent } from './shared/setup-steps/setup-steps.component';
import { EditKeyDialog } from '@app/api/introduction/add-key-dialog/add-key-dialog.component';
import {
    DxDataGridModule,
    DxTextBoxModule,
    DxDateBoxModule,
    DxValidatorModule,
    DxValidationGroupModule
} from 'devextreme-angular';

import {
    MatDialogModule
} from '@angular/material';
import { ClipboardModule } from 'ngx-clipboard';

@NgModule({
    imports: [
        ApiRoutingModule,
        CommonModule,
        AppCommonModule,
        DxDataGridModule,
        DxTextBoxModule,
        DxDateBoxModule,
        DxValidatorModule,
        DxValidationGroupModule,
        MatDialogModule,
        ClipboardModule
    ],
    declarations: [
        SwaggerComponent,
        IntroductionComponent,
        SetupStepComponent,
        EditKeyDialog
    ],
    entryComponents: [
        EditKeyDialog
    ]
})

export class ApiModule { }
