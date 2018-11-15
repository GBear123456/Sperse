import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { range } from 'lodash';

@Component({
    selector: 'stars-rating',
    templateUrl: './stars-rating.component.html',
    styleUrls: [ './stars-rating.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StarsRatingComponent implements OnInit {
    @Input() maxRating = 5;
    @Input() currentRating = 0;
    ratings: number[];
    ngOnInit() {
        this.ratings = range(this.maxRating);
    }
}
