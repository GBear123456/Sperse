/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { DxDataGridModule, DxTooltipModule, DxListModule, DxTextBoxModule } from '../../node_modules/devextreme-angular';

/** Application imports */
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { OffersComponent } from '@app/pfm/offers/offers.component';
import { PfmRoutingModule } from '@app/pfm/pfm-routing.module';
import { OfferCategoriesComponent } from '@app/pfm/shared/offer-categories/offer-categories.component';
import { OffersService } from 'personal-finance/shared/offers/offers.service';
import { OfferServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    imports: [
        PfmRoutingModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        DxDataGridModule,
        DxTooltipModule,
        DxListModule,
        DxTextBoxModule
    ],
    declarations: [
        OfferCategoriesComponent,
        OffersComponent
    ],
    entryComponents: [
    ],
    providers: [
    ]
})

export class PfmModule { }
