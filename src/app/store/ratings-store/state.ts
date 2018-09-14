import { AppConsts } from 'shared/AppConsts';

class Rating {
    id: number;
    name: string;
    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }
}

export interface State {
    ratings: Rating[];
}

let ratings = [];
for (let i = 1; i <= AppConsts.maxRatingValue; i++) {
    ratings.push(new Rating(i, i.toString()));
}

export const initialState: State = {
    ratings: ratings
};
