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
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

/** Application imports */
import { fadeIn } from '@shared/animations/fade-animations';
import { AppService } from '@app/app.service';

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
    height$: Observable<string> = this.appService.toolbarIsHidden$.pipe(
        startWith(true),
        map((toolbarIsHidden: boolean) => {
            return `calc(100vh - ${toolbarIsHidden ? '150' : '212'}px)`;
        })
    );

    constructor(
        private changeDetectorRef: ChangeDetectorRef,
        private appService: AppService
    ) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.itemsCount) {
            this.ghosts = new Array(changes.itemsCount.currentValue);
            this.changeDetectorRef.detectChanges();
        }
    }
}
