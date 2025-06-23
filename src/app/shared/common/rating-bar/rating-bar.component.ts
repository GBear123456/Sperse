import { Component, Input } from '@angular/core';

@Component({
    selector: 'rating-bar',
    templateUrl: './rating-bar.component.html',
    styleUrls: ['./rating-bar.component.less']
})
export class RatingBarComponent {
    @Input() rating = 0;
}
