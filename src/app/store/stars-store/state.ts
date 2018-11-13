import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ContactStarInfoDto } from 'shared/service-proxies/service-proxies';

export const starsAdapter: EntityAdapter<
    ContactStarInfoDto
> = createEntityAdapter<ContactStarInfoDto>({});

export interface State {
    stars: ContactStarInfoDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    stars: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
