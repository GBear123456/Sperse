import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { CfoRoutingModule } from './cfo-routing.module';
import { AccountsComponent } from './accounts/accounts.component';

import { ModalModule } from 'ngx-bootstrap';

import { InstanceServiceProxy } from '@shared/service-proxies/service-proxies';

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
    ],
    providers: [InstanceServiceProxy]
})

export class CfoModule { }
