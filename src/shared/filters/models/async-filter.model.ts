import { Observable } from 'rxjs';

export class AsyncFilter {
    cacheId$: Observable<string>;
    itemsCount: number;
    constructor(cacheId$: Observable<string>, itemsCount: number) {
        this.cacheId$ = cacheId$;
        this.itemsCount = itemsCount;
    }
}