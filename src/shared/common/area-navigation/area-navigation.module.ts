import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreaNavigationComponent } from './area-navigation.component';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        RouterModule
    ],
    declarations: [ AreaNavigationComponent ],
    exports: [ AreaNavigationComponent ],
    providers: [],
})
export class AreaNavigationModule {}
