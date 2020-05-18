import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'sidebar',
    templateUrl: 'sidebar.component.html',
    styleUrls: ['sidebar.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
    constructor() {}
}