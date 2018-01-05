import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap';

import { UtilsModule } from '@shared/utils/utils.module';
import { AbpModule } from '@abp/abp.module';
import { CommonModule } from '@shared/common/common.module';

import { AppAuthService } from '@app/shared/common/auth/app-auth.service';
import { SetupRouteGuard } from './auth/auth-route-guard';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service'

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        ModalModule.forRoot(),
        UtilsModule,
        AbpModule,
        CommonModule
    ],
    providers: [
        AppLocalizationService
    ]
})
export class SetupCommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: SetupCommonModule,
            providers: [
                AppAuthService,
                SetupRouteGuard
            ]
        };
    }
}
