/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';

/** Application imports */
import { AccountConnectorDialogComponent } from './account-connector-dialog';
import { AccountConnectorChooserComponent } from './account-connector-chooser/account-connector-chooser.component';
import { QuovoLoginComponent } from './quovo-login/quovo-login.component';
import { XeroLoginComponent } from './xero-login/xero-login.component';
import { SyncDatePickerService } from './sync-date-picker/sync-date-picker.service';
import { SyncDatePickerComponent } from './sync-date-picker/sync-date-picker.component';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        MatDialogModule,
        DxValidatorModule,
        DxTextBoxModule,
        DxValidationSummaryModule,
        DxButtonModule,
        DxCheckBoxModule,
        DxDateBoxModule
    ],
    declarations: [
        SyncDatePickerComponent,
        AccountConnectorDialogComponent,
        AccountConnectorChooserComponent,
        XeroLoginComponent,
        QuovoLoginComponent
    ],
    exports: [
        SyncDatePickerComponent,
        AccountConnectorDialogComponent
    ],
    entryComponents: [
        AccountConnectorDialogComponent
    ],
    providers: [
        SyncDatePickerService
    ]
})
export class AccountConnectorDialogModule {
}
