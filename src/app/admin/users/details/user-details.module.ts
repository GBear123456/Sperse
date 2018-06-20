import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ngCommon from '@angular/common';
import { CommonModule } from '@shared/common/common.module';
import { AppCommonModule } from '@app/shared/common/app-common.module';

import {
    MatSidenavModule, MatProgressBarModule, MatTabsModule, MatDialogModule,
    MatDialogRef, MatProgressSpinnerModule, MatSelectModule
} from '@angular/material';

import {
    DxSelectBoxModule, DxCheckBoxModule, DxNumberBoxModule, DxScrollViewModule, DxTreeListModule,
    DxListModule, DxButtonModule, DxDataGridModule, DxDateBoxModule, DxTooltipModule, DxTextBoxModule,
    DxValidatorModule, DxValidationGroupModule, DxToolbarModule, DxTextAreaModule, DxSliderModule, DxRadioGroupModule
} from 'devextreme-angular';

import { RouterModule, Routes } from '@angular/router';

import { UserDetailsComponent } from './user-details.component';
import { DetailsHeaderComponent } from './details-header.component';
import { OperationsWidgetComponent } from './operations-widget.component';

import { UserAccountComponent } from './user-account/user-account.component';
import { UserInformationComponent } from './user-information/user-information.component';
import { LoginAttempsComponent } from './login-attemps/login-attemps.component';
import { ImageCropperModule } from 'ng2-img-cropper';

import { UserDetailsRoutingModule } from './user-details-routing.module';
import { FileDropModule } from 'ngx-file-drop';
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
        DxTreeListModule,
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
