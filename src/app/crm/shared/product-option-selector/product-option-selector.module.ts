/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */

/** Application imports */
import { ProductOptionSelectorComponent } from './product-option-selector.component';
import { LayoutModule } from '@app/shared/layout/layout.module';
import { DxTabsModule } from 'devextreme-angular/ui/tabs';

@NgModule({
    imports: [
        LayoutModule,
        CommonModule,
        DxTabsModule
    ],
    exports: [
        ProductOptionSelectorComponent
    ],
    declarations: [ProductOptionSelectorComponent],
    providers: [],
})
export class ProductOptionSelectorModule {}
