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
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';

import {
    ExternalUserDataServiceProxy,
    LeadServiceProxy,
    PublicProductServiceProxy,
    TenantSubscriptionServiceProxy
} from '@root/shared/service-proxies/service-proxies';
import { ProductOptionSelectorModule } from '@app/crm/shared/product-option-selector/product-option-selector.module';

@NgModule({
    imports: [
        ngCommon.CommonModule,
        FormsModule,
        CommonModule,
        PublicProductsRoutingModule,
        CountryPhoneNumberModule,
        ProductOptionSelectorModule,
        UtilsModule,
        MatSliderModule,
        PaypalModule,
        GooglePlaceModule,
        DxSelectBoxModule,
        DxTextBoxModule,
        DxTabsModule
    ],
    exports: [],
    declarations: [
        SingleProductComponent
    ],
    providers: [
        PublicProductServiceProxy,
        LeadServiceProxy,
        TenantSubscriptionServiceProxy,
        ExternalUserDataServiceProxy
    ]
})
export class PublicProductsModule { }
