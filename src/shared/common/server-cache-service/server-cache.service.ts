/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, of } from 'rxjs';
import { tap, mapTo, publishReplay, refCount } from 'rxjs/operators';
import * as moment from 'moment';
import { Md5 } from 'ts-md5/dist/md5';
import { v4 as UUID } from 'uuid';

/** Application imports */
import { CachingServiceProxy } from '@shared/service-proxies/service-proxies';
import { ServerCache } from '@shared/common/server-cache-service/server-cache.interface';

@Injectable()
export class ServerCacheService {
    static readonly filterNamesToCacheIdNames = {
        'email': 'EmailAddressesCachedId',
        'xref': 'XRefsCachedId',
        'affiliateCode': 'AffiliateCodesCachedId',
        'phone': 'PhoneNumbersCachedId'
    }
    localCache: ServerCache = {};
    constructor(private cachingServiceProxy: CachingServiceProxy) {}

    getServerCacheId(values: string[]): Observable<string> {
        const valuesHash: string = Md5.hashStr(values.join('')).toString();
        /** If local cache is older then 5 minutes - 30 second (to avoid cases with bad connection) - then load another one */
        if (!this.localCache[valuesHash]
            || (this.localCache[valuesHash].date && moment(this.localCache[valuesHash].date).diff(moment(), 'second') < 30)
        ) {
            const uuid = UUID();
            this.localCache[valuesHash] = {
                uuid$: this.cachingServiceProxy.cacheStrings({
                    [uuid]: values
                }).pipe(
                    tap((cachedString) => {
                        this.localCache[valuesHash].date = cachedString[uuid];
                    }),
                    mapTo(uuid),
                    publishReplay(),
                    refCount()
                ),
                date: null
            }
        }
        return this.localCache[valuesHash].uuid$;
    }
}