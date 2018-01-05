import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { AccountsComponent } from './accounts/accounts.component';

import { ModalModule } from 'ngx-bootstrap';

@NgModule({
    imports: [
        CfoRoutingModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        ModalModule.forRoot()
    ],
    declarations: [
        AccountsComponent
    ]
})

export class CfoModule { }
