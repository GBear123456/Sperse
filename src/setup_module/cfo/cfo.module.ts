import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { AccountsComponent } from './accounts/accounts.component';

import { ModalModule } from 'ngx-bootstrap';

import { MdTabsModule } from '@angular/material';
import { MdDialogModule } from '@angular/material';

@NgModule({
    imports: [
        CfoRoutingModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        ModalModule.forRoot(),

        MdTabsModule,
        MdDialogModule
    ],
    declarations: [
        AccountsComponent
    ]
})

export class CfoModule { }
