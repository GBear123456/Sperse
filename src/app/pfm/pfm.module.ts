/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

/** Third party imports */
import { DxDataGridModule, DxTooltipModule, DxListModule, DxTextBoxModule } from '../../node_modules/devextreme-angular';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';

/** Application imports */
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { OffersComponent } from '@app/pfm/offers/offers.component';
import { PfmRoutingModule } from '@app/pfm/pfm-routing.module';
import { OfferEditComponent } from '@app/pfm/offer-edit/offer-edit.component';
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';

@NgModule({
    imports: [
        PfmRoutingModule,
        ngCommon.CommonModule,
        CommonModule,
        AppCommonModule,
        DxDataGridModule,
        DxTooltipModule,
        DxListModule,
        DxTextBoxModule,
        MatCheckboxModule,
        MatInputModule,
        ReactiveFormsModule,
        ItemDetailsLayoutModule
    ],
    declarations: [
        OffersComponent,
        OfferEditComponent
    ],
    entryComponents: [
    ],
    providers: [
    ]
})

export class PfmModule { }
