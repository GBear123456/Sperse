import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { ApiRoutingModule } from './api-routing.module';
import { SwaggerComponent } from './swagger/swagger.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { SetupStepComponent } from './shared/setup-steps/setup-steps.component';
import { EditKeyDialog } from '@app/api/introduction/add-key-dialog/add-key-dialog.component';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxValidationGroupModule } from 'devextreme-angular/ui/validation-group';

import { MatDialogModule } from '@angular/material/dialog';
import { ClipboardModule } from 'ngx-clipboard';
import { ApiWelcomeComponent } from './introduction/api-welcome/api-welcome.component';

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
        EditKeyDialog,
        ApiWelcomeComponent
    ],
    entryComponents: [
        EditKeyDialog
    ]
})

export class ApiModule { }
