import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { CustomerTagInfoDto } from '@shared/service-proxies/service-proxies';

export const tagsAdapter: EntityAdapter<
    CustomerTagInfoDto
> = createEntityAdapter<CustomerTagInfoDto>({});

export interface State {
    tags: CustomerTagInfoDto[];
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
