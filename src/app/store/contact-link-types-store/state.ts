import { ContactLinkTypeDto } from 'shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

export interface State {
    contactLinkTypes: ContactLinkTypeDto[];
    isLoading: boolean;
    error: string;
    loadedTime: number;
}

export const initialState: State = {
    contactLinkTypes: [
        ContactLinkTypeDto.fromJS({
            id: AppConsts.otherLinkTypeId,
            name: 'Other Link'
        })
    ],
    isLoading: false,
    error: null,
    loadedTime: null
};
