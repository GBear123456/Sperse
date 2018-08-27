import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ContactGroupListInfoDto } from '@shared/service-proxies/service-proxies';

export const listsAdapter: EntityAdapter<
    ContactGroupListInfoDto
> = createEntityAdapter<ContactGroupListInfoDto>({});

export interface State {
    lists: ContactGroupListInfoDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    lists: null,
    isLoading: false,
    error: null,
    loaded: false
};
