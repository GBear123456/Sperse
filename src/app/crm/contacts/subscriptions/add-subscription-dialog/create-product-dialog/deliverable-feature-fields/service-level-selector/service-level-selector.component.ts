/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Input,
    ViewEncapsulation,
    AfterViewInit,
    OnInit,
    Output,
    EventEmitter,
} from '@angular/core';


/** Third party imports */
import { Pencil } from 'lucide-angular';

/** Application imports */


@Component({
    selector: 'service-level-selector',
    templateUrl: './service-level-selector.component.html',
    styleUrls: [
        '../../../../subscriptions-base.less',
        './service-level-selector.component.less'
    ],
    providers: [
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceLevelSelectorComponent implements OnInit {
    readonly Pencil = Pencil;

    @Input() service: any;

    @Output() onChange: EventEmitter<any> = new EventEmitter();
    @Output() onRemove: EventEmitter<void> = new EventEmitter();
    @Output() onEdit?: EventEmitter<any> = new EventEmitter();

    serviceConfig = {
        serviceList: [
            {
                displayName: "Service Plan 1",
                id: "service1"
            },
            {
                displayName: "Service Plan 2",
                id: "service2"
            },
            {
                displayName: "Service Plan 3",
                id: "service3"
            },
            {
                displayName: "+ Add new",
                id: "new"
            },
        ],
        levelList: [
            {
                displayName: "Level 1",
                id: "level1"
            },
            {
                displayName: "Premium Tier",
                id: "premium"
            },
            {
                displayName: "Enterprise",
                id: "enterprise"
            }
        ]
    }

    onServiceChange(event) {
        this.onChange.emit({...this.service, name: event.value});
    }

    onLevelChange(event) {
        this.onChange.emit({...this.service, level: event.value});
    }

    ngOnInit(): void {
    }
}