/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { MatSliderModule } from '@angular/material/slider';

/** Application imports */
import { ProductOptionSelectorComponent } from './product-option-selector.component';
import { LayoutModule } from '@app/shared/layout/layout.module';

@NgModule({
    imports: [
        LayoutModule,
        CommonModule,
        MatSliderModule
    ],
    exports: [
        ProductOptionSelectorComponent
    ],
    declarations: [ProductOptionSelectorComponent ],
    providers: [],
})
export class ProductOptionSelectorModule {}
