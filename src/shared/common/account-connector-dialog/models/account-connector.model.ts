import { AccountConnectors } from '@shared/AppEnums';
export interface AccountConnector {
    getName: () => AccountConnectors;
    title: string;
    description: string;
    iconName: string;
    disabled: boolean;
    switcher?: boolean;
    checked?: boolean;
}
