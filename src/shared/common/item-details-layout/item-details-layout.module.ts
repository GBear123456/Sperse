import { NgModule } from '@angular/core';
import { ItemDetailsLayoutComponent } from '@shared/common/item-details-layout/item-details-layout.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { DxScrollViewModule } from '@root/node_modules/devextreme-angular/ui/scroll-view';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';

@NgModule({
    declarations: [
        ItemDetailsLayoutComponent
    ],
    imports: [
        MatSidenavModule,
        RouterModule,
        CommonModule,
        DxScrollViewModule,
        FormsModule,
        MatTabsModule
    ],
    exports: [
        MatSidenavModule,
        ItemDetailsLayoutComponent
    ]
})
export class ItemDetailsLayoutModule {}
