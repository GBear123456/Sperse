import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { CustomerRatingInfoDto } from '@shared/service-proxies/service-proxies';

export const ratingsAdapter: EntityAdapter<
    CustomerRatingInfoDto
> = createEntityAdapter<CustomerRatingInfoDto>({});

export interface State {
    ratings: CustomerRatingInfoDto[];
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
