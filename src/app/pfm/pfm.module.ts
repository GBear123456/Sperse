/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxTooltipModule } from 'devextreme-angular/ui/tooltip';
import { DxSelectBoxModule } from 'devextreme-angular/ui/select-box';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { DxCheckBoxModule } from 'devextreme-angular/ui/check-box';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

/** Application imports */
import { AppCommonModule } from '../shared/common/app-common.module';
import { CommonModule } from '@shared/common/common.module';
import { OffersComponent } from '@app/pfm/offers/offers.component';
import { PfmRoutingModule } from '@app/pfm/pfm-routing.module';
import { OfferEditComponent } from '@app/pfm/offer-edit/offer-edit.component';
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';
import { StarsRatingModule } from '@shared/common/stars-rating/stars-rating.module';

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
        DxContextMenuModule,
        DxSelectBoxModule,
        DxCheckBoxModule,
        MatCheckboxModule,
        MatInputModule,
        MatSelectModule,
        ItemDetailsLayoutModule,
        StarsRatingModule
    ],
    declarations: [
        OffersComponent,
        OfferEditComponent
    ],
    entryComponents: [],
    providers: []
})

export class PfmModule { }
