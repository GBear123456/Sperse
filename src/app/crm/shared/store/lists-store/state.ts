import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { CustomerListInfoDto } from '@shared/service-proxies/service-proxies';

export const listsAdapter: EntityAdapter<
    CustomerListInfoDto
> = createEntityAdapter<CustomerListInfoDto>({});

export interface State {
    lists: CustomerListInfoDto[];
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
