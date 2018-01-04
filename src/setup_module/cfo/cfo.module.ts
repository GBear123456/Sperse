import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { AccountsComponent } from './accounts/accounts.component';

import { ModalModule } from 'ngx-bootstrap';

import { MatTabsModule, MatDialogModule } from '@angular/material';

@NgModule({
    imports: [
        CfoRoutingModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        ModalModule.forRoot(),

        MatTabsModule,
        MatDialogModule
    ],
    declarations: [
        AccountsComponent
    ]
})

export class CfoModule { }
