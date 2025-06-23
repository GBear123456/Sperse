import { CommunicationDeliverableInfo } from '@shared/service-proxies/service-proxies';

export type ItemOptions = {
    serversList?: ServerRoleData[];
    serversListInitialized?: boolean;
    rolesList?: ServerRoleData[];
    rolesListIds?: string[];
    rolesListInitialized?: boolean;
    isConnected?: boolean;
};

export type ServerRoleData = { id: string; name: string };

export type CommunicationDeliverableInfoWithOptions = CommunicationDeliverableInfo & {
    uiOptions?: ItemOptions;
};