import { NgModule } from '@angular/core';
import { SourceContactListComponent } from './source-contact-list.component';
import { StaticListModule } from '@app/shared/common/static-list/static-list.module';

@NgModule({
    imports: [ StaticListModule ],
    exports: [ SourceContactListComponent ],
    declarations: [ SourceContactListComponent ]
})
export class SourceContactListModule {}