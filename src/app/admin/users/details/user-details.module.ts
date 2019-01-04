/** Core imports */
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
    DxSelectBoxModule, DxCheckBoxModule, DxNumberBoxModule, DxScrollViewModule, DxTreeViewModule,
    DxListModule, DxButtonModule, DxDataGridModule, DxDateBoxModule, DxTooltipModule, DxTextBoxModule,
    DxValidatorModule, DxValidationGroupModule, DxToolbarModule, DxTextAreaModule, DxSliderModule, DxRadioGroupModule
} from 'devextreme-angular';
import { ImageCropperModule } from 'ng2-img-cropper';
import { FileDropModule } from 'ngx-file-drop';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { UserDetailsComponent } from './user-details.component';
import { DetailsHeaderComponent } from './details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component';
import { UserAccountComponent } from './user-account/user-account.component';
import { UserInformationComponent } from './user-information/user-information.component';
import { LoginAttempsComponent } from './login-attemps/login-attemps.component';
import { PermissionTreeComponent } from './permission-tree/permission-tree.component';
import { OrganizationUnitsTreeComponent } from './organization-units-tree/organization-units-tree.component';
import { UserDetailsRoutingModule } from './user-details-routing.module';
import { UtilsModule } from '@shared/utils/utils.module';

import {
    UserServiceProxy
} from '@shared/service-proxies/service-proxies';

@NgModule({
    declarations: [
        UserDetailsComponent,
        DetailsHeaderComponent,
        UserInformationComponent,
        LoginAttempsComponent,
        UserAccountComponent,
        OperationsWidgetComponent,
        PermissionTreeComponent,
        OrganizationUnitsTreeComponent
    ],
    imports: [
        FormsModule,
        CommonModule,
        ngCommon.CommonModule,
        AppCommonModule,
        UtilsModule,
        MatSidenavModule,
        MatProgressBarModule,
        MatTabsModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        UserDetailsRoutingModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        DxButtonModule,
        DxTextBoxModule,
        DxValidatorModule,
        DxNumberBoxModule,
        DxScrollViewModule,
        DxToolbarModule,
        DxDataGridModule,
        DxTextAreaModule,
        DxDateBoxModule,
        DxTooltipModule,
        DxListModule,
        DxSliderModule,
        DxTreeViewModule,
        DxValidationGroupModule,
        ImageCropperModule,
        DxRadioGroupModule,
        FileDropModule
    ],
    exports: [
        UserDetailsComponent,
        UserInformationComponent,
    ],
    entryComponents: [
    ],
    bootstrap: [
        UserDetailsComponent
    ],
    providers: [
        UserServiceProxy
    ]
})
export class UserDetailsModule { }
