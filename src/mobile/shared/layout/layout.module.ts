import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { AppCommonModule } from '../common/app-common.module'
import { UtilsModule } from '@shared/utils/utils.module';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        RouterModule,
        AppCommonModule,
        ModalModule.forRoot(),
        TooltipModule.forRoot(),
        UtilsModule
    ]
})
export class LayoutModule {}