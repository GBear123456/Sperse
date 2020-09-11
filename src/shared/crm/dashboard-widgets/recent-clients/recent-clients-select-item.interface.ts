import { Observable } from 'rxjs';
import { GetRecentlyCreatedCustomersOutput } from '@shared/service-proxies/service-proxies';
import { Params } from '@angular/router';

export class IRecentClientsSelectItem {
    name: string;
    message: string;
    dataLink: string;
    allRecordsLink: string;
    linkParams?: Params;
    dataSource: (contactId: number) => Observable<GetRecentlyCreatedCustomersOutput[]>;
}
