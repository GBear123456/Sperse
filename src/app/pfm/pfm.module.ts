/** Core imports */
import { NgModule } from '@angular/core';
import * as ngCommon from '@angular/common';

/** Third party imports */
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxListModule } from 'devextreme-angular/ui/list';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { DxNumberBoxModule } from 'devextreme-angular/ui/number-box';
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
import { TextFieldComponent } from './offer-edit/text-field/text-field.component';
import { DropdownFieldComponent } from './offer-edit/dropdown-field/dropdown-field.component';
import { NumberFieldComponent } from './offer-edit/number-field/number-field.component';
import { TagFieldComponent } from './offer-edit/tag-field/tag-field.component';
import { CheckboxFieldComponent } from './offer-edit/checkbox-field/checkbox-field.component';
import { TextMultipleFieldComponent } from './offer-edit/text-multiple-field/text-multiple-field.component';
import { RatingFieldComponent } from './offer-edit/rating-field/rating-field.component';
import { FromToFieldComponent } from './offer-edit/from-to-field/from-to-field.component';
import { GroupFieldComponent } from './offer-edit/group-field/group-field.component';

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
        DxNumberBoxModule,
        DxTagBoxModule,
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
        OfferEditComponent,
        TextFieldComponent,
        DropdownFieldComponent,
        NumberFieldComponent,
        TagFieldComponent,
        CheckboxFieldComponent,
        TextMultipleFieldComponent,
        RatingFieldComponent,
        FromToFieldComponent,
        GroupFieldComponent
    ],
    entryComponents: [],
    providers: []
})

export class PfmModule { }
