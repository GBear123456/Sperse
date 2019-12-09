import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { trigger } from '@angular/animations';
import { fadeIn } from '@shared/animations/fade-animations';

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

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.itemsCount) {
            this.ghosts = new Array(changes.itemsCount.currentValue);
            this.changeDetectorRef.detectChanges();
        }
    }
}
