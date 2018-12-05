import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

import { AccountConnectorDialogComponent } from './account-connector-dialog';
import { AccountConnectorChooserComponent } from './account-connector-chooser/account-connector-chooser.component';
import { QuovoLoginComponent } from './quovo-login/quovo-login.component';
import { XeroLoginComponent } from './xero-login/xero-login.component';

import { MatDialogModule } from '@angular/material';
import { DxButtonModule, DxValidatorModule, DxTextBoxModule, DxValidationSummaryModule } from 'devextreme-angular';

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