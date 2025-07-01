/** Core imports */
import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'settings-card',
    templateUrl: './settings-card.component.html',
    styleUrls: ['./settings-card.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsCardComponent implements OnInit {

    @Input() title: string;
    @Input() description: string;

    constructor(
    ) { }

    ngOnInit(): void {
    }
}