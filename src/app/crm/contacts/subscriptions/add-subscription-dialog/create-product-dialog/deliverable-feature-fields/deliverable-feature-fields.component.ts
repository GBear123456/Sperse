/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Input,
    ViewEncapsulation,
    AfterViewInit,
    OnInit,
} from '@angular/core';


/** Third party imports */
import { Plus } from 'lucide-angular';

/** Application imports */


@Component({
    selector: 'deliverable-feature-fields',
    templateUrl: './deliverable-feature-fields.component.html',
    styleUrls: [
        '../../../subscriptions-base.less',
        './deliverable-feature-fields.component.less'
    ],
    providers: [
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliverableFeatureFieldsComponent implements OnInit {
    @Input() fields: any[];
    @Input() prefix: string;
    @Input() data: any;
    @Input() handleChange: (field: string, value: any) => void;

    readonly Plus = Plus;

    constructor() {
    }

    ngOnInit(): void {
    }

    onServiceAdd(id: string, services: any[]) {
        const newServices = [...services, { id: String(services.length + 1), name: "", level: "" }]
        this.handleChange(id, newServices)
    }

    onServiceChange(updatedService, id, services, index) {
        const newServices = [...services]
        newServices[index] = updatedService
        this.handleChange(id, newServices)
    }

    onServiceRemove(id, services, index) {
        if (services.length > 1) {
            const newServices = services.filter((_: any, i: number) => i !== index)
            this.handleChange(id, newServices)
        }
    }
}