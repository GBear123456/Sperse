import { Injectable } from '@angular/core';
import { FiltersService } from '@shared/filters/filters.service';
import { AppService } from '@app/app.service';
import { Observable, combineLatest, fromEvent} from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FullScreenService } from '@shared/common/fullscreen/fullscreen.service';

@Injectable()
export class CrmService {
    windowResize$: Observable<Event> = fromEvent(window, 'resize').pipe(startWith(window.innerWidth));
    contentWidth$: Observable<number> = combineLatest(
        this.filtersService.filterFixed$,
        this.windowResize$
    ).pipe(map(([filterFixed]) => filterFixed ? window.innerWidth - 341 : window.innerWidth));
    contentHeight$: Observable<number> = combineLatest(
        this.appService.toolbarIsHidden$,
        this.fullScreenService.isFullScreenMode$,
        this.windowResize$
    ).pipe(map(([toolbarIsHidden, isFullScreenMode]: [boolean, boolean]) => {
        let height: number;
        if (isFullScreenMode) {
            height = window.innerHeight - 60;
        } else if (toolbarIsHidden) {
            height = window.innerHeight - 150;
        } else {
            height = window.innerHeight - 210;
        }
        return height;
    }));

    constructor(
        private filtersService: FiltersService,
        private appService: AppService,
        private fullScreenService: FullScreenService
    ) { }
}
