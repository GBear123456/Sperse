/** Core imports */
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

/** Third party imports */

/** Application imports */

@Component({
    selector: 'tracking-tool-section',
    templateUrl: './tracking-tool-section.component.html',
    styleUrls: ['./tracking-tool-section.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: []
})
export class TrackingToolSectionComponent {
    @Input() logoSrc!: string;
    @Input() logoAlt!: string;
    @Input() title!: string;
    @Input() placeholder!: string;
    @Input() trackingValue!: string;
    @Input() helpText?: string;
    @Input() helpLink?: string;
    @Input() helpLinkText?: string;
    @Input() description?: string;

    @Output() trackingValueChange = new EventEmitter<string>();
}