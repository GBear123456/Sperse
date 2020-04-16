import { ICountryStateDto } from '../../service-proxies/service-proxies';

export interface ICountryState extends ICountryStateDto {
    hasItems: boolean;
    parentId: string;
    selected: boolean;
    expanded: boolean;
}