import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'start-widget',
    templateUrl: 'start-widget.component.html',
    styleUrls: ['start-widget.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartWidgetComponent {
    @Input() title: string;
    @Input() subtitle: string;
    @Input() color: string;
    @Input() iconSrc: string;
    @Input() iconAlt: string = '';
    @Input() link: string;
    constructor() {}
}