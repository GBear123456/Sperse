/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Input,
    ViewEncapsulation,
    AfterViewInit,
    OnInit,
    ChangeDetectorRef,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';


/** Third party imports */
import { Plus } from 'lucide-angular';
import * as moment from 'moment';
import { findIana } from 'windows-iana';

/** Application imports */
import { CreateProductDialogComponent } from '../create-product-dialog.component';
import { EditAddressDialog } from '@app/crm/contacts/edit-address-dialog/edit-address-dialog.component';
import { DateHelper } from '@shared/helpers/DateHelper';
import { EventDurationTypes, EventDurationHelper } from '@shared/crm/helpers/event-duration-types.enum';
import { LanguageDto } from '@root/shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppConsts } from '@root/shared/AppConsts';

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
    @Input() isReadOnly: boolean;
    @Input() handleChange: (field: string, value: any) => void;

    readonly Plus = Plus;

    eventDurationTypes = EventDurationHelper.eventDurationDataSource;
    languages: LanguageDto[] = [];
    timezones: any[] = [];
    eventAddress: string;
    eventDuration: number;
    eventDurationType: EventDurationTypes;
    eventDate: Date;
    eventTime: Date;

    nameRegexPattern = AppConsts.regexPatterns.linkName;
    urlRegexPattern = AppConsts.regexPatterns.url;
    constructor(
        public dialogRef: MatDialogRef<CreateProductDialogComponent>,
        private changeDetection: ChangeDetectorRef,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
    ) {
        this.initDeliverables();
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

    editAddress() {
        let data = {
            streetAddress: this.data.event_address.streetAddress,
            city: this.data.event_address.city,
            stateId: this.data.event_address.stateId,
            stateName: this.data.event_address.stateName,
            countryId: this.data.event_address.countryId,
            countryName: this.data.event_address.countryName,
            neighborhood: this.data.event_address.neighborhood,
            zip: this.data.event_address.zip,
            isCompany: false,
            isDeleteAllowed: false,
            showType: false,
            showNeighborhood: false,
            editDialogTitle: 'Update address',
            formattedAddress: '',
            isEditAllowed: !this.isReadOnly,
            disableDragging: true,
            hideComment: true,
            hideCheckboxes: true
        };

        this.dialog.open(EditAddressDialog, {
            data: data,
            hasBackdrop: true
        }).afterClosed().subscribe((saved: boolean) => {
            if (saved) {
                this.data.event_address.streetAddress = data.streetAddress;
                this.data.event_address.city = data.city;
                this.data.event_address.stateId = data.stateId;
                this.data.event_address.stateName = data.stateName;
                this.data.event_address.countryId = data.countryId;
                this.data.event_address.countryName = data.countryName;
                this.data.event_address.neighborhood = data.neighborhood;
                this.data.event_address.zip = data.zip;
                this.setEventAddressString();
                this.changeDetection.markForCheck();
            }
        });
    }

    clearAddress(event) {
        event.stopPropagation();
        event.preventDefault();

        this.data.event_address.streetAddress = null;
        this.data.event_address.city = null;
        this.data.event_address.stateId = null;
        this.data.event_address.stateName = null;
        this.data.event_address.countryId = null;
        this.data.event_address.countryName = null;
        this.data.event_address.neighborhood = null;
        this.data.event_address.zip = null;
        this.setEventAddressString();
        this.changeDetection.markForCheck();
    }

    setEventAddressString() {
        if (!this.data || !this.data.event_address)
            return;

        let addr = this.data.event_address;
        this.eventAddress = [addr.streetAddress, addr.city, addr.stateName, addr.countryName, addr.zip].filter(x => !!x).join(', ');
    }

    initDeliverables() {
        if (!this.data)
            return;

        if (this.data.time) {
            let baseDateMomentUtc = this.data.date ? moment(new Date(this.data.date)).utc() : moment().utc();
            let timeArr = this.data.time.split(':');
            baseDateMomentUtc.set({ hour: timeArr[0], minute: timeArr[1] });
            let baseDate = DateHelper.addTimezoneOffset(baseDateMomentUtc.toDate(), false, findIana(this.data.event_timezone)[0]);
            this.eventDate = this.data.date ? DateHelper.removeTimezoneOffset(new Date(baseDate)) : undefined;
            this.eventTime = baseDate;
        } else {
            this.eventDate = this.data.date ? new Date(this.data.date) : undefined;
            this.eventTime = undefined;
        }

        if (this.data.durationMinutes) {
            let durationInfo = EventDurationHelper.ParseDuration(this.data.durationMinutes);
            this.eventDurationType = durationInfo.eventDurationType;
            this.eventDuration = durationInfo.eventDuration;
        }
    }

    checkArray(val: any) {
        return Array.isArray(val)
    }
}