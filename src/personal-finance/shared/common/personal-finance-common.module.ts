import * as ngCommon from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbpModule } from '@abp/abp.module';
import { CommonModule } from '@shared/common/common.module';

import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { CreditReportsRouteGuard } from './auth/auth-route-guard';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { PackagesComponent } from './packages/packages.component';
import { CampaignOffersComponent } from './campaign-offers/campaign-offers.component';
import { OffersService } from '../offers/offers.service';
import { OfferServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        AbpModule,
        CommonModule
    ],
    declarations: [
        PackagesComponent,
        CampaignOffersComponent
    ],
    exports: [
        PackagesComponent,
        CampaignOffersComponent
    ],
    providers: [
        CurrencyPipe,
        OffersService,
        AppLocalizationService
    ]
})
export class PersonalFinanceCommonModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: PersonalFinanceCommonModule,
            providers: [
                AppAuthService,
                OfferServiceProxy,
                CreditReportsRouteGuard
            ]
        };
    }
    constructor(private appLocalizationService: AppLocalizationService) {
        this.appLocalizationService.localizationSourceName = 'PFM';
    }
}