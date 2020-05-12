import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'upcoming-events',
    templateUrl: 'upcoming-events.component.html',
    styleUrls: ['upcoming-events.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpcomingEventsComponent {
    events = [
        {
            title: 'Level 1 & 2 Trainer Certification',
            date: 'Mon and Fri, June 15-19 8:00 AM',
            text: 'Massive Momentum awaits you as you embrace this Challenge',
            iconSrc: './assets/common/images/bank-code/event-logo.png'
        },
        {
            title: 'Power Scripting',
            date: 'Wed, June 20 8:00 AM',
            text: 'Massive Momentum awaits you as you embrace this Challenge',
            iconSrc: './assets/common/images/bank-code/event-logo-1.png'
        },
        {
            title: 'Communication Mastery',
            date: 'Mon and Fri, June 15-19 8:00 AM',
            text: 'Massive Momentum awaits you as you embrace this Challenge',
            iconSrc: './assets/common/images/bank-code/event-logo-2.png'
        },
        {
            title: 'Bankicon',
            date: 'Mon and Fri, June 15-19 8:00 AM',
            text: 'Massive Momentum awaits you as you embrace this Challenge',
            iconSrc: './assets/common/images/bank-code/event-logo-3.png'
        },
    ];
    constructor() {}
}