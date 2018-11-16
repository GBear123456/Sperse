import { NgModule } from '@angular/core';
import { NoDataComponent } from '@shared/common/widgets/no-data/no-data.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
    imports: [
        CommonModule,
        RouterModule
    ],
    declarations: [
        NoDataComponent
    ],
    exports: [
        NoDataComponent
    ]
})
export class NoDataModule {}
