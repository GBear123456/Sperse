import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'special-announcements',
    templateUrl: 'special-announcements.component.html',
    styleUrls: ['special-announcements.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpecialAnnouncementsComponent {
    constructor() {}
}