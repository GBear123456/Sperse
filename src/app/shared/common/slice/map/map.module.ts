/** Core imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Third party imports */
import { DxVectorMapModule } from 'devextreme-angular/ui/vector-map';

/** Application imports */
import { MapComponent } from '@app/shared/common/slice/map/map.component';
import { LoadingSpinnerModule } from '@app/shared/common/loading-spinner/loading-spinner.module';

@NgModule({
    imports: [
        CommonModule,
        DxVectorMapModule,
        LoadingSpinnerModule
    ],
    declarations: [
        MapComponent
    ],
    exports: [
        MapComponent
    ],
    providers: [],
})
export class MapModule {}
