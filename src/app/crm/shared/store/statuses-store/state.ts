import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { ContactGroupStatusDto } from '@shared/service-proxies/service-proxies';

export const statusesAdapter: EntityAdapter<
    ContactGroupStatusDto
> = createEntityAdapter<ContactGroupStatusDto>({});

export interface State {
    statuses: ContactGroupStatusDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    statuses: null,
    isLoading: false,
    error: null,
    loaded: false
};
