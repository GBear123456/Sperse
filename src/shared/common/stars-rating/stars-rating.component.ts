import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output
} from '@angular/core';
import range from 'lodash/range';

@Component({
    selector: 'stars-rating',
    templateUrl: './stars-rating.component.html',
    styleUrls: [ './stars-rating.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StarsRatingComponent implements OnInit {
    @Input() maxRating = 5;
    @Input() set currentRating(value: number) {
        this.cachedRating = this._currentRating = value;
    }
    @Output() currentRatingChange = new EventEmitter<number>();
    @Input() color = '#6D97F2';
    @Input() isEditable = false;
    _currentRating = 0;
    cachedRating = this._currentRating;
    ratings: number[];

    ngOnInit() {
        this.ratings = range(this.maxRating);
    }

    starClick(i: number) {
        if (this.isEditable) {
            this._currentRating = this.cachedRating = i + 1;
            this.currentRatingChange.emit(this._currentRating);
        }
    }

    onHover(i: number) {
        if (this.isEditable) {
            this._currentRating = i + 1;
        }
    }

    onLeave() {
        if (this.isEditable) {
            this._currentRating = this.cachedRating;
        }
    }
}
