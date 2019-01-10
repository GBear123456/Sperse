import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

import { AccountConnectorDialogComponent } from './account-connector-dialog';
import { AccountConnectorChooserComponent } from './account-connector-chooser/account-connector-chooser.component';
import { QuovoLoginComponent } from './quovo-login/quovo-login.component';
import { XeroLoginComponent } from './xero-login/xero-login.component';

import { MatDialogModule } from '@angular/material/dialog';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        MatDialogModule,
        DxValidatorModule,
        DxTextBoxModule,
        DxValidationSummaryModule,
        DxButtonModule
    ],
    declarations: [
        AccountConnectorDialogComponent,
        AccountConnectorChooserComponent,
        XeroLoginComponent,
        QuovoLoginComponent
    ],
    exports: [
        AccountConnectorDialogComponent
    ],
    entryComponents: [
        AccountConnectorDialogComponent
    ]
})
export class AccountConnectorDialogModule {
}
