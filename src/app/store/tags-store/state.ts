import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ContactTagInfoDto } from 'shared/service-proxies/service-proxies';

export const tagsAdapter: EntityAdapter<
    ContactTagInfoDto
> = createEntityAdapter<ContactTagInfoDto>({});

export interface State {
    tags: ContactTagInfoDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    tags: null,
    isLoading: false,
    error: null,
    loadedTime: null
};
