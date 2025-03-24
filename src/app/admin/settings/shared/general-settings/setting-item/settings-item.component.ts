/** Core imports */
import { Component, ViewEncapsulation, OnInit, Input } from '@angular/core';
import { Info } from 'lucide-angular'
@Component({
    selector: 'settings-item',
    templateUrl: './settings-item.component.html',
    styleUrls: ['./settings-item.component.less'],
    providers: [],
    encapsulation: ViewEncapsulation.None,
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