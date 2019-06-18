import { Observable } from '@node_modules/rxjs';

export class IRecentClientsSelectItem {
    name: string;
    message: string;
    dataLink: string;
    allRecordsLink: string;
    dataSource: Observable<any>;
}
