/** Core imports */
import { NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { AngularSvgIconModule } from 'angular-svg-icon';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';

/** Application imports */
import { ItemDetailsLayoutComponent } from '@shared/common/item-details-layout/item-details-layout.component';

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
        MatTabsModule,
        AngularSvgIconModule.forRoot()
    ],
    exports: [
        MatSidenavModule,
        ItemDetailsLayoutComponent
    ]
})
export class ItemDetailsLayoutModule {}
