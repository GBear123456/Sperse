import { Component, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'rating-bar',
    templateUrl: './rating-bar.component.html',
    styleUrls: ['./rating-bar.component.less']
})
export class RatingBarComponent extends AppComponentBase {
    @Input()
    rating: number = 0;

    constructor(
        injector: Injector
    ) {
        super(injector);
    }
}
