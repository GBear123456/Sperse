import * as ngCommon from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalModule } from 'ngx-bootstrap';

import { UtilsModule } from '@shared/utils/utils.module';
import { AbpModule } from '@abp/abp.module';
import { CommonModule } from '@shared/common/common.module';

import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { CreditReportsRouteGuard } from './auth/auth-route-guard';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PackagesComponent } from './packages/packages.component';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        ModalModule.forRoot(),
        UtilsModule,
        AbpModule,
        CommonModule
    ],
    declarations: [
        PackagesComponent
    ],
    exports: [
        PackagesComponent
    ],
    providers: [
        AppLocalizationService
    ]
})
export class PersonalFinanceCommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: PersonalFinanceCommonModule,
            providers: [
                AppAuthService,
                CreditReportsRouteGuard
            ]
        };
    }
    constructor(private appLocalizationService: AppLocalizationService) {
        this.appLocalizationService.localizationSourceName = 'PFM';
    }
}
