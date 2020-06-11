import { Observable } from 'rxjs';

export interface ServerCache {
    [hash: string]: {
        uuid$: Observable<string>;
        date: string;
    };
}