import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GhostListComponent } from './ghost-list.component';

@NgModule({
    imports: [ CommonModule ],
    exports: [ GhostListComponent ],
    declarations: [ GhostListComponent ],
    providers: [],
})
export class GhostListModule {}
