import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ContactGroupStarInfoDto } from '@shared/service-proxies/service-proxies';

export const starsAdapter: EntityAdapter<
    ContactGroupStarInfoDto
> = createEntityAdapter<ContactGroupStarInfoDto>({});

export interface State {
    stars: ContactGroupStarInfoDto[];
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
