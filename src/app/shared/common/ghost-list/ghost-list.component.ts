import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { trigger } from '@angular/animations';
import { fadeIn } from '@shared/animations/fade-animations';

@Component({
    selector: 'ghost-list',
    templateUrl: './ghost-list.component.html',
    styleUrls: ['./ghost-list.component.less'],
    animations: [ trigger('fadeIn', fadeIn(':enter')) ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GhostListComponent {
    @Input() itemsCount = 12;
    ghosts = new Array(this.itemsCount);
}
