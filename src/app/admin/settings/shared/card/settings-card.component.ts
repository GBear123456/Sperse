/** Core imports */
import { Component, ViewEncapsulation, OnInit, Input } from '@angular/core';

@Component({
    selector: 'settings-card',
    templateUrl: './settings-card.component.html',
    styleUrls: ['./settings-card.component.less'],
    providers: [],
    encapsulation: ViewEncapsulation.None,
})
export class SettingsCardComponent implements OnInit {

    @Input() title: string;
    @Input() description: string;

    constructor(
    ) { }

    ngOnInit(): void {
    }
}