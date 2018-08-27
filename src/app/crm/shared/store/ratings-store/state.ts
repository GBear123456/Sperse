import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ContactGroupRatingInfoDto } from '@shared/service-proxies/service-proxies';

export const ratingsAdapter: EntityAdapter<
    ContactGroupRatingInfoDto
> = createEntityAdapter<ContactGroupRatingInfoDto>({});

export interface State {
    ratings: ContactGroupRatingInfoDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    ratings: null,
    isLoading: false,
    error: null,
    loaded: false
};
