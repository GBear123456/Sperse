/** Core imports */
import * as ngCommon from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';

/** Third party imports */
import { FormsModule } from '@angular/forms';

/** Application imports */
import { AbpModule } from 'abp-ng2-module';
import { CommonModule } from '@shared/common/common.module';
import { AppAuthService } from '@shared/common/auth/app-auth.service';
import { CreditReportsRouteGuard } from './auth/auth-route-guard';
import { PackagesComponent } from './packages/packages.component';
import { CampaignOffersComponent } from './campaign-offers/campaign-offers.component';
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
        CurrencyPipe
    ]
})
export class PersonalFinanceCommonModule {
    static forRoot(): ModuleWithProviders<PersonalFinanceCommonModule> {
        return {
            ngModule: PersonalFinanceCommonModule,
            providers: [
                AppAuthService,
                OfferServiceProxy,
                CreditReportsRouteGuard
            ]
        };
    }
}
