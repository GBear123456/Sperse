/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxValidatorModule } from 'devextreme-angular/ui/validator';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxValidationSummaryModule } from 'devextreme-angular/ui/validation-summary';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';

/** Application imports */
import { AccountConnectorDialogComponent } from './account-connector-dialog';
import { AccountConnectorChooserComponent } from './account-connector-chooser/account-connector-chooser.component';
import { PlaidLoginDirective } from './plaid-login/plaid-login.directive';
import { SyncDatePickerService } from './sync-date-picker/sync-date-picker.service';
import { SyncDatePickerComponent } from './sync-date-picker/sync-date-picker.component';
import { QuickBookLoginComponent } from './quick-book-login/quick-book-login.component';
import { XeroOauth2LoginComponent } from './xero-oauth2-login/xero-oauth2-login.component';
import { SaltEdgeComponent } from '@shared/common/account-connector-dialog/salt-edge/salt-edge.component';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        MatDialogModule,
        MatSlideToggleModule,
        DxValidatorModule,
        DxTextBoxModule,
        DxValidationSummaryModule,
        DxButtonModule,
        DxCheckBoxModule,
        DxDateBoxModule,
        DxScrollViewModule
    ],
    declarations: [
        SyncDatePickerComponent,
        AccountConnectorDialogComponent,
        AccountConnectorChooserComponent,
        PlaidLoginDirective,
        QuickBookLoginComponent,
        XeroOauth2LoginComponent,
        SaltEdgeComponent
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
