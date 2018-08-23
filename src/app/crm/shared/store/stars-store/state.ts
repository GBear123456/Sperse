import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { CustomerStarInfoDto } from '@shared/service-proxies/service-proxies';

export const starsAdapter: EntityAdapter<
    CustomerStarInfoDto
> = createEntityAdapter<CustomerStarInfoDto>({});

export interface State {
    stars: CustomerStarInfoDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    stars: null,
    isLoading: false,
    error: null,
    loaded: false
};
