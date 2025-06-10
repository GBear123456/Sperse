/** Core imports */
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

/** Thirds party imports */
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';
import { DxTreeViewModule } from 'devextreme-angular/ui/tree-view';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';

/** Application imports */
import { AppCommonModule } from '@app/shared/common/app-common.module';
import { OrganizationUnitsTreeComponent } from './organization-units-tree.component';
import { OrganizationUnitsDialogComponent } from './organization-units-dialog/organization-units-dialog.component';

@NgModule({
    imports: [
        AppCommonModule,
        MatDialogModule,
        DxTreeViewModule,
        DxScrollViewModule,
        DxToolbarModule
    ],
    exports: [ 
        OrganizationUnitsTreeComponent,
        OrganizationUnitsDialogComponent
    ],
    declarations: [ 
        OrganizationUnitsTreeComponent,
        OrganizationUnitsDialogComponent
    ],
    entryComponents: [
        OrganizationUnitsDialogComponent
    ]
})
export class OrgUnitsTreeModule {}