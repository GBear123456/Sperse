import { NgModule } from '@angular/core';
import { SourceContactListComponent } from './source-contact-list.component';
import { StaticListModule } from '@app/shared/common/static-list/static-list.module';
import { OrgUnitsTreeModule } from '@shared/common/organization-units-tree/organization-units-tree.module';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';
import { DxSwitchModule } from 'devextreme-angular';

@NgModule({
    imports: [
        StaticListModule,
        OrgUnitsTreeModule,
        DxSwitchModule
    ],
    exports: [ SourceContactListComponent ],
    declarations: [ SourceContactListComponent ],
    providers: [ DialogService ]
})
export class SourceContactListModule {}