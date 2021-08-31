import { MemberServiceDto } from 'shared/service-proxies/service-proxies';

export interface State {
    items: MemberServiceDto[];
    error: string;
    loading: boolean;
    loadedTime: number;
}

export const initialState: State = {
    items: null,
    error: null,
    loading: false,
    loadedTime: null
};