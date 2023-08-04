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

import { SingleProductComponent } from './single-product/single-product.component';

import { PublicProductServiceProxy } from '@root/shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        CommonModule,
        PublicProductsRoutingModule,
        CountryPhoneNumberModule,
        UtilsModule,
        MatSliderModule
    ],
    exports: [],
    declarations: [
        SingleProductComponent
    ],
    providers: [
        PublicProductServiceProxy
    ]
})
export class PublicProductsModule { }
