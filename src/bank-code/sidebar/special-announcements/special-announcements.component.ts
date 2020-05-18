import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'special-announcements',
    templateUrl: 'special-announcements.component.html',
    styleUrls: ['special-announcements.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpecialAnnouncementsComponent {
    announcements = [
        {
            title: 'Lorem ipsum dolor sit amet',
            text: 'Lorem ipsum dolor sit amet, consectetur elit, eiusmod tempor incididunt. Lorem ipsum dolor sit amet, consectetur elit, eiusmod tempor incididunt.',
            imageSrc: './assets/common/images/bank-code/announcement.png'
        }
    ];
}