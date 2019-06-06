import { NgModule } from '@angular/core';
import { DxTextBoxModule } from 'devextreme-angular/ui/text-box';
import { SearchInputComponent } from '@app/shared/common/search-input/search-input.component';

@NgModule({
    imports: [
        DxTextBoxModule
    ],
    declarations: [
        SearchInputComponent
    ],
    exports: [
        SearchInputComponent
    ]
})
export class SearchInputModule {}
