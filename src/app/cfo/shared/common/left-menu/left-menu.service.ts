/** Cor imports */
import { Injectable, Inject, Optional } from '@angular/core';

/** Third party imports */
import { BehaviorSubject, Observable } from 'rxjs';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { CFOService } from '@shared/cfo/cfo.service';
import { CacheHelper } from '@shared/common/cache-helper/cache-helper';
import { AppService } from '@app/app.service';

@Injectable()
export class LeftMenuService {
    private collapsed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
        this.collapsedByDefault !== null ? this.collapsedByDefault : true
    );
    collapsed$: Observable<boolean> = this.collapsed.asObservable();
    private readonly CACHE_KEY_COLLAPSED = 'Collapsed';
    private readonly CACHE_PREFIX = 'LeftMenu';
    constructor(
        private appService: AppService,
        private cfoService: CFOService,
        private cacheService: CacheService,
        private cacheHelper: CacheHelper,
        @Inject('leftMenuCollapsed') @Optional() private collapsedByDefault
    ) {
        let collapsed = this.cacheService.get(this.getCacheKey());
        if (collapsed && !isNaN(collapsed))
            this.collapsed.next(Boolean(parseInt(collapsed)));
    }

    private getCacheKey() {
        return this.cacheHelper.getCacheKey([
            this.CACHE_KEY_COLLAPSED,
            this.appService.getModule(),
            this.cfoService.instanceId ||
            this.cfoService.instanceType
        ].join('_'), this.CACHE_PREFIX);
    }

    toggle() {
        let collapsed = !this.collapsed.getValue();
        this.cacheService.set(this.getCacheKey(), Number(collapsed));
        this.collapsed.next(collapsed);
    }
}
