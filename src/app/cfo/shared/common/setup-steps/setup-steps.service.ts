/** Cor imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import { CacheService } from '@node_modules/ng2-cache-service';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { CFOService } from '@shared/cfo/cfo.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';

@Injectable()
export class SetupStepsService {
    private collapsedSubject = new BehaviorSubject<boolean>(
        AppConsts.isMobile || this.cfoService.hasStaticInstance || !!this.cfoService.instanceId);
    private readonly CACHE_KEY_COLLAPSED = 'Collapsed';

    collapsed$: Observable<boolean> = this.collapsedSubject.asObservable();

    constructor(
        private cfoService: CFOService,
        private cacheService: CacheService,
        private cacheHelper: CacheHelper
    ) {
        let collapsed = this.cacheService.get(this.getCacheKey());
        if (collapsed && !isNaN(collapsed))
            this.collapsedSubject.next(Boolean(parseInt(collapsed)));
    }

    private getCacheKey() {
        return this.cacheHelper.getCacheKey([
            this.CACHE_KEY_COLLAPSED,
            this.cfoService.instanceId ||
            this.cfoService.instanceType
        ].join('_'), this.constructor.name);
    }

    toggle() {
        let collapsed = !this.collapsedSubject.getValue();
        this.cacheService.set(this.getCacheKey(), Number(collapsed));
        this.collapsedSubject.next(collapsed);
    }
}
