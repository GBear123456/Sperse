import { Component, Input, Injector, OnInit, OnDestroy } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    CustomersServiceProxy,
    CustomerInfoDto,
    PersonContactInfoDto,
    UpdateCustomerStatusInput
} from '@shared/service-proxies/service-proxies';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material';
import { VerificationChecklistItemType, VerificationChecklistItem, VerificationChecklistItemStatus } from '@app/crm/clients/details/verification-checklist/verification-checklist.model';

@Component({
    selector: 'client-details',
    templateUrl: './client-details.component.html',
    styleUrls: ['./client-details.component.less'],
    host: {
        '(document:click)': 'closeEditDialogs($event)'
    }
})
export class ClientDetailsComponent extends AppComponentBase implements OnInit, OnDestroy {
    customerId: number;
    customerInfo: CustomerInfoDto;
    primaryContact: PersonContactInfoDto;
    verificationChecklist: VerificationChecklistItem[];

    person: any = {
        id: 1,
        first_name: 'Matthew',
        second_name: 'Robertson',
        rating: 7,
        person_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        approved_sum: '45000',
        requested_sum_min: '100000',
        requested_sum_max: '245000',
        profile_created: '6/6/2016',
        lead_owner_photo_url: 'http://absorbmarketing.com/wp-content/uploads/2015/01/Picture-of-person.png',
        lead_owner_name: 'R.Hibbert'
    };

    navLinks = [
        {'label': 'Contact Information', 'route': 'contact-information', active: true},
        {'label': 'Lead Information', 'route': 'lead-information', active: true},
        {'label': 'Questionnaire', 'route': 'questionnaire', active: true},
        {'label': 'Documents', 'route': 'required-documents', active: true},
        {'label': 'Application Status', 'route': 'application-status', active: true},
        {'label': 'Referral History', 'route': 'referal-history', active: true},
        {'label': 'Payment Information', 'route': 'payment-information', active: true},
        {'label': 'Activity Logs', 'route': 'activity-logs', active: true},
        {'label': 'Notes', 'route': 'notes', active: true}
    ];

    private rootComponent: any;
    private paramsSubscribe: any = [];
    private referrerURI: string;

    constructor(injector: Injector,
                private _router: Router,
                private _dialog: MatDialog,
                private _route: ActivatedRoute,
                private _customerService: CustomersServiceProxy) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        _customerService['data'] = {customerInfo: null};
        this.rootComponent = this.getRootComponent();

        
        this.paramsSubscribe.push(this._route.params
            .subscribe(params => {
                this.fillCustomerDetails(params['clientId']);
        }));

        this.paramsSubscribe.push(this._route.queryParams
            .subscribe(params => {
                this.referrerURI = params['referrer'];
        }));
    }

    private fillCustomerDetails(customerId) {
        this.startLoading(true);
        this.customerId = customerId;
        this._customerService.getCustomerInfo(this.customerId).subscribe(responce => {
            this._customerService['data'].customerInfo = responce;
            this.primaryContact = responce.primaryContactInfo;
            this.customerInfo = responce;
            this.initVerificationChecklist();
            this.finishLoading(true);
        });
    }

    private getCustomerName() {
        return this.customerInfo.primaryContactInfo.fullName;
    }

    private showConfirmationDialog(statusId: string) {
        this.message.confirm(
            this.l('ClientUpdateStatusWarningMessage'),
            this.l('ClientStatusUpdateConfirmationTitle'),
            isConfirmed => {
                if (isConfirmed)
                    this.updateStatusInternal(statusId);
            }
        );
    }

    private updateStatusInternal(statusId: string) {
        this._customerService.updateCustomerStatus(new UpdateCustomerStatusInput({
            customerId: this.customerId,
            statusId: statusId
        })).subscribe(() => {
            this.notify.success(this.l('StatusSuccessfullyUpdated'));
        });
    }

    private getVerificationChecklistItem(type: VerificationChecklistItemType, 
        status?: VerificationChecklistItemStatus, confirmedCount?, totalCount?): VerificationChecklistItem {
        return {
            type: type,
            status: status,
            confirmedCount: confirmedCount,
            totalCount: totalCount
        } as VerificationChecklistItem;
    }

    private getVerificationChecklistItemByMultipleValues(items: any[], 
        type: VerificationChecklistItemType
    ): VerificationChecklistItem {
        let confirmedCount = 0;
        items.forEach(i => {
            if (i.isConfirmed)
                confirmedCount++;
        });
        return this.getVerificationChecklistItem(
            type,
            confirmedCount > 0 ? VerificationChecklistItemStatus.success : VerificationChecklistItemStatus.unsuccess,
            confirmedCount,
            items.length
        );
    }

    close() {
        this._dialog.closeAll();
        this._router.navigate([this.referrerURI || 'app/crm/clients']);
    }

    closeEditDialogs(event) {
        if (document.body.contains(event.target) &&
            !event.target.closest('.mat-dialog-container, .dx-popup-wrapper')
        )
            this._dialog.closeAll();
    }

    printMainArea() {
        let elm = this.getElementRef(),
            handel = window.open();
        handel.document.open();
        handel.document.write('<h1>' + this.getCustomerName() + '</h1>' +
            elm.nativeElement.getElementsByClassName('main-content')[0].innerHTML);
        handel.document.close();
        handel.print();
        handel.close();
    }

    ngOnInit() {
        this.rootComponent.overflowHidden(true);
        this.rootComponent.pageHeaderFixed();
    }

    ngOnDestroy() {
        this._dialog.closeAll();
        this.paramsSubscribe.forEach((sub) => sub.unsubscribe());
        this.rootComponent.overflowHidden();
        this.rootComponent.pageHeaderFixed(true);
    }

    delete() {
        this.message.confirm(
            this.l('ClientDeleteWarningMessage', this.getCustomerName()),
            isConfirmed => {
                if (isConfirmed) {
                    this._customerService.deleteCustomer(this.customerId).subscribe(() => {
                        this.notify.success(this.l('SuccessfullyDeleted'));
                        this.close();
                    });
                }
            }
        );
    }

    updateStatus(statusId: string) {
        this.showConfirmationDialog(statusId);
    }

    initVerificationChecklist(): void {
        let contactDetails = this.primaryContact.details;
        this.verificationChecklist = [
            this.getVerificationChecklistItem(
                VerificationChecklistItemType.Identity, 
                this.primaryContact.person.identityConfirmationDate 
                    ? VerificationChecklistItemStatus.success 
                    : VerificationChecklistItemStatus.unsuccess
            ),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.emails, VerificationChecklistItemType.Email),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.phones, VerificationChecklistItemType.Phone),
            this.getVerificationChecklistItemByMultipleValues(contactDetails.addresses, VerificationChecklistItemType.Address),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Employment),
            this.getVerificationChecklistItem(VerificationChecklistItemType.Income)
        ];
    }
}
