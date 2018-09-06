import { AccountConnectors } from '@shared/AppEnums';
export interface AccountConnector {
    name: AccountConnectors;
    title: string;
    description: string;
    iconName: string;
    disabled: boolean;
}
