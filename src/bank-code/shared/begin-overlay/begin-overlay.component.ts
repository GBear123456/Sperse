import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'begin-overlay',
    templateUrl: 'begin-overlay.component.html',
    styleUrls: ['begin-overlay.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BeginOverlayComponent {
    @Input() text: string;
    @Input() buttonText: string;
    @Output() onButtonClick: EventEmitter<any> = new EventEmitter();

    constructor() {}
}