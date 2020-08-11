import { NgModule } from '@angular/core';
import { SourceContactListComponent } from './source-contact-list.component';
import { StaticListModule } from '@app/shared/common/static-list/static-list.module';
import { OrgUnitsTreeModule } from '@shared/common/organization-units-tree/organization-units-tree.module';

@NgModule({
    imports: [
        StaticListModule,
        OrgUnitsTreeModule
    ],
    exports: [ SourceContactListComponent ],
    declarations: [ SourceContactListComponent ]
})
export class SourceContactListModule {}