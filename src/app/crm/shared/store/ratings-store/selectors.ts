import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { FilterRangeModel } from '@shared/filters/range/filter-range.model';

export const getRatingsState = createFeatureSelector<State>('ratings');

export const getRatings = createSelector(
    getRatingsState,
    (state: State) => state.ratings
);

export const getRatingItems = createSelector(
    getRatings,
    ratings => {
        let result = null;
        if (ratings && ratings.length) {
            let minRating = ratings[0].id;
            let maxRating = ratings[ratings.length - 1].id;
            result = {
                from: new FilterItemModel(),
                to: new FilterItemModel(),
                element: new FilterRangeModel({
                    min: minRating,
                    max: maxRating,
                    step: 1
                })
            };
        }
        return result;
    }
);
