import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '@app/shared/common/loading-spinner/loading-spinner.component';

@NgModule({
    imports: [ CommonModule ],
    declarations: [ LoadingSpinnerComponent ],
    exports: [ LoadingSpinnerComponent ]
})
export class LoadingSpinnerModule {}
