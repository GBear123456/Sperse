import { NgModule } from '@angular/core';
import { DateTimePipe } from '@shared/common/pipes/datetime/datetime.pipe';

@NgModule({
    imports: [],
    exports: [ DateTimePipe ],
    declarations: [ DateTimePipe ],
    providers: [ DateTimePipe ],
})
export class DateTimeModule {}
