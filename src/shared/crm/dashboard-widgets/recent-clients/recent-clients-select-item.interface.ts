import { Observable } from '@node_modules/rxjs';
import { GetRecentlyCreatedCustomersOutput } from '@shared/service-proxies/service-proxies';

export class IRecentClientsSelectItem {
    name: string;
    message: string;
    dataLink: string;
    allRecordsLink: string;
    dataSource: (contactId: number, orgUnitIds: number[]) => Observable<GetRecentlyCreatedCustomersOutput[]>;
}
