import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ContactGroupTagInfoDto } from '@shared/service-proxies/service-proxies';

export const tagsAdapter: EntityAdapter<
    ContactGroupTagInfoDto
> = createEntityAdapter<ContactGroupTagInfoDto>({});

export interface State {
    tags: ContactGroupTagInfoDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    tags: null,
    isLoading: false,
    error: null,
    loaded: false
};
