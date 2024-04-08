/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    SimpleChanges
} from '@angular/core';

/** Third party imports */
import { trigger } from '@angular/animations';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/** Application imports */
import { fadeIn } from '@shared/animations/fade-animations';
import { AppService } from '@app/app.service';
import { FullScreenService } from '../../../../shared/common/fullscreen/fullscreen.service';
import { LayoutService } from '@app/shared/layout/layout.service';

@Component({
    selector: 'ghost-list',
    templateUrl: './ghost-list.component.html',
    styleUrls: ['./ghost-list.component.less'],
    animations: [ trigger('fadeIn', fadeIn(':enter')) ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GhostListComponent implements OnChanges {
    @Input() itemsCount = 12;
    ghosts: number[] = new Array(this.itemsCount);
    height$: Observable<string> = combineLatest(
        this.appService.toolbarIsHidden$,
        this.fullscreenService.isFullScreenMode$
    ).pipe(
        startWith(true),
        map(([toolbarIsHidden, isFullScreenMode]: [boolean, boolean]) => {
            return `calc(100vh - ${(toolbarIsHidden ? 150 : 212) - (isFullScreenMode ? 151 : 0) - (this.layoutService.showLeftBar ? 75 : 0)}px)`;
        })
    );

    constructor(
        private appService: AppService,
        private layoutService: LayoutService,
        private changeDetectorRef: ChangeDetectorRef,
        private fullscreenService: FullScreenService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.itemsCount) {
            this.ghosts = new Array(changes.itemsCount.currentValue);
            this.changeDetectorRef.detectChanges();
        }
    }
}
