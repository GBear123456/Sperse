import { NgModule } from '@angular/core';
import { SourceContactListComponent } from './source-contact-list.component';
import { StaticListModule } from '@app/shared/common/static-list/static-list.module';
import { OrgUnitsTreeModule } from '@shared/common/organization-units-tree/organization-units-tree.module';
import { DialogService } from '@app/shared/common/dialogs/dialog.service';

@NgModule({
    imports: [
        StaticListModule,
        OrgUnitsTreeModule
    ],
    exports: [ SourceContactListComponent ],
    declarations: [ SourceContactListComponent ],
    providers: [ DialogService ]
})
export class SourceContactListModule {}