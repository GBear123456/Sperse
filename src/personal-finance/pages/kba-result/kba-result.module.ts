import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KbaResultComponent } from './kba-result.component';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: '',
                component: KbaResultComponent
            }
        ])
    ],
    declarations: [ KbaResultComponent ]
})
export class KbaResultModule {}
