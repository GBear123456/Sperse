/** Core imports */
import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { Info } from 'lucide-angular'
@Component({
    selector: 'settings-item',
    templateUrl: './settings-item.component.html',
    styleUrls: ['./settings-item.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsItemComponent implements OnInit {
    readonly InfoIcon = Info;

    @Input() label: string;
    @Input() icon: any;
    @Input() tooltipDescription: string;
    @Input() color: string;

    constructor(
    ) { }

    ngOnInit(): void {
    }
}