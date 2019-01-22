import { NgModule } from '@angular/core';
import { OfferEditComponent } from '@admin/offer-edit/offer-edit.component';
import { ItemDetailsLayoutModule } from '@shared/common/item-details-layout/item-details-layout.module';

@NgModule({
    declarations: [ OfferEditComponent ],
    imports: [ ItemDetailsLayoutModule ]
})
export class OfferEditModule {}
