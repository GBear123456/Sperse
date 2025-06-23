<<<<<<< HEAD
import { Observable } from 'rxjs';
import { GetRecentlyCreatedCustomersOutput, GetRecentlySalesOutput } from '@shared/service-proxies/service-proxies';
import { Params } from '@angular/router';

export class IRecentClientsSelectItem {
    name: string;
    message: string;
    dataLink: string;
    allRecordsLink: string;
    dataSource: (contactId: number, orgUnitIds: number[]) => Observable<GetRecentlyCreatedCustomersOutput[] | GetRecentlySalesOutput[]>;
    linkParams?: Params;
    visible?: boolean;
}
=======
import { Observable } from 'rxjs';
import { GetRecentlyCreatedCustomersOutput, GetRecentlySalesOutput } from '@shared/service-proxies/service-proxies';
import { Params } from '@angular/router';

export class IRecentClientsSelectItem {
    name: string;
    message: string;
    dataLink: string;
    allRecordsLink: string;
    dataSource: (contactId: number, orgUnitIds: number[]) => Observable<GetRecentlyCreatedCustomersOutput[] | GetRecentlySalesOutput[]>;
    linkParams?: Params;
    visible?: boolean;
}
>>>>>>> f999b481882149d107812286d0979872df712626
