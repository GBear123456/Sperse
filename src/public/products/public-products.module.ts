<<<<<<< HEAD
/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatSliderModule } from '@angular/material/slider';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { PublicProductsRoutingModule } from './public-products-routing.module';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { PaypalModule } from '@shared/common/paypal/paypal.module';

import { SingleProductComponent } from './single-product/single-product.component';

import {
    LeadServiceProxy,
    PublicProductServiceProxy,
    TenantSubscriptionServiceProxy
} from '@root/shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        CommonModule,
        PublicProductsRoutingModule,
        CountryPhoneNumberModule,
        UtilsModule,
        MatSliderModule,
        PaypalModule
    ],
    exports: [],
    declarations: [
        SingleProductComponent
    ],
    providers: [
        PublicProductServiceProxy,
        LeadServiceProxy,
        TenantSubscriptionServiceProxy
    ]
})
export class PublicProductsModule { }
=======
/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Third party imports */
import { MatSliderModule } from '@angular/material/slider';

/** Application imports */
import { CommonModule } from '@shared/common/common.module';
import { PublicProductsRoutingModule } from './public-products-routing.module';
import { CountryPhoneNumberModule } from '@shared/common/phone-numbers/country-phone-number.module';
import { UtilsModule } from '@shared/utils/utils.module';
import { PaypalModule } from '@shared/common/paypal/paypal.module';

import { SingleProductComponent } from './single-product/single-product.component';

import {
    LeadServiceProxy,
    PublicProductServiceProxy,
    TenantSubscriptionServiceProxy
} from '@root/shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        CommonModule,
        PublicProductsRoutingModule,
        CountryPhoneNumberModule,
        UtilsModule,
        MatSliderModule,
        PaypalModule
    ],
    exports: [],
    declarations: [
        SingleProductComponent
    ],
    providers: [
        PublicProductServiceProxy,
        LeadServiceProxy,
        TenantSubscriptionServiceProxy
    ]
})
export class PublicProductsModule { }
>>>>>>> f999b481882149d107812286d0979872df712626
