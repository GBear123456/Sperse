import { Injectable } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';

@Injectable()
export class CacheHelper {
    constructor(private appSession: AppSessionService) {}
    getCacheKey(key: string, prefix: string): string {
        return prefix + '_' + this.appSession.tenantId + '_' + this.appSession.userId + '_' + key;
    }
}
