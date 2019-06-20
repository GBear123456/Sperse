import { NgModule } from '@angular/core';
import { LoadingSpinnerComponent } from '@app/shared/common/loading-spinner/loading-spinner.component';

@NgModule({
    declarations: [ LoadingSpinnerComponent ],
    exports: [ LoadingSpinnerComponent ]
})
export class LoadingSpinnerModule {}
