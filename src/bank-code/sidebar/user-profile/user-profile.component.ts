import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'user-profile',
    templateUrl: 'user-profile.component.html',
    styleUrls: ['user-profile.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent {
    constructor() {
    }
}