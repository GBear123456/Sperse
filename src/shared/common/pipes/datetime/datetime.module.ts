import { NgModule, ModuleWithProviders } from '@angular/core';
import { DateTimePipe } from '@shared/common/pipes/datetime/datetime.pipe';

@NgModule({
    imports: [],
    exports: [ DateTimePipe ],
    declarations: [ DateTimePipe ],
    providers: [ DateTimePipe ],
})
export class DateTimeModule {
    static forRoot(): ModuleWithProviders<DateTimeModule> {
        return {
            ngModule: DateTimeModule,
            providers: [ DateTimePipe ]
        };
    }
}