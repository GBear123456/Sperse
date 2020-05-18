import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'upcoming-events',
    templateUrl: 'upcoming-events.component.html',
    styleUrls: ['upcoming-events.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpcomingEventsComponent {
    constructor() {
    }
}