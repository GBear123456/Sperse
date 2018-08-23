import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { CustomerStatusDto } from '@shared/service-proxies/service-proxies';

export const statusesAdapter: EntityAdapter<
    CustomerStatusDto
> = createEntityAdapter<CustomerStatusDto>({});

export interface State {
    statuses: CustomerStatusDto[];
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
