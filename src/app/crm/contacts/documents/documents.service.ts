import { Injectable } from '@angular/core';
import { DocumentServiceProxy, GetUrlOutput } from '@shared/service-proxies/service-proxies';
import { Observable, of } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { CacheService } from '@node_modules/ng2-cache-service';

@Injectable()
export class DocumentsService {
    readonly RESERVED_TIME_SECONDS = 30;
    public documentsUrls = {};

    constructor(
        private documentServiceProxy: DocumentServiceProxy,
        private cacheService: CacheService
    ) {}
    downloadDocument(documentId: string) {
        if (this.documentsUrls[documentId])
            window.open(this.documentsUrls[documentId], '_self');
        else {
            this.getDocumentUrlInfoObservable(documentId).subscribe((urlInfo) => {
                this.documentsUrls[documentId] = urlInfo.url;
                window.open(urlInfo.url, '_self');
            });
        }
    }

    getDocumentUrlInfoObservable(documentId: string): Observable<GetUrlOutput> {
        if (this.cacheService.exists(documentId)) {
            let urlInfo = this.cacheService.get(documentId) as GetUrlOutput;
            return of(urlInfo);
        }

        return this.documentServiceProxy.getUrl(documentId).pipe(
            flatMap((urlInfo) => {
                this.storeUrlToCache(documentId, urlInfo);
                this.documentsUrls[documentId] = urlInfo.url;
                return of(urlInfo);
            }));
    }

    private storeUrlToCache(id: string, urlInfo: GetUrlOutput) {
        this.cacheService.set(id, urlInfo,
            { maxAge: urlInfo.validityPeriodSeconds - this.RESERVED_TIME_SECONDS });
    }
}
