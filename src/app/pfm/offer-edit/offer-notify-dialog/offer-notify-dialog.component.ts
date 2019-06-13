/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, Inject, OnInit } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    ContactListInfoDto,
    OfferAnnouncementServiceProxy,
    SendAnnouncementRequest,
    SendAnnouncementRequestServiceName
} from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { AppStore, ListsStoreSelectors, ListsStoreActions } from '@app/store';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
    templateUrl: './offer-notify-dialog.component.html',
    styleUrls: [
        '../../../shared/common/styles/sperse-toggle.less',
        './offer-notify-dialog.component.less'
    ],
    providers: [ OfferAnnouncementServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferNotifyDialogComponent implements OnInit {
    offerPublicLink: string = this.data.offerPublicLink;
    offerId: number = this.data.offerId;
    services = SendAnnouncementRequestServiceName;
    selectedService: SendAnnouncementRequestServiceName = SendAnnouncementRequestServiceName.IAge;
    currentStage = 0;
    lists$: Observable<ContactListInfoDto[]> = this.store$.pipe(select(ListsStoreSelectors.getLists));
    selectedListId: number;
    selectedListName: string;

    constructor(
        private dialogRef: MatDialogRef<OfferNotifyDialogComponent>,
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private offerAnnouncementService: OfferAnnouncementServiceProxy,
        private notifyService: NotifyService,
        private store$: Store<AppStore.State>,
        public ls: AppLocalizationService,
        @Inject(MAT_DIALOG_DATA) private data: any
    ) {}

    ngOnInit() {
        this.store$.dispatch(new ListsStoreActions.LoadRequestAction(false));
        this.lists$.pipe(
            map((lists: ContactListInfoDto[]) => {
                return this.selectedListId ? lists.find(list => list.id === this.selectedListId).name : '';
            })
        ).subscribe((listName: string) => {
            this.selectedListName = listName;
        });
    }

    changeService() {
        this.selectedService = this.selectedService === SendAnnouncementRequestServiceName.IAge
                ? SendAnnouncementRequestServiceName.Ongage
                : SendAnnouncementRequestServiceName.IAge;
    }

    sendAnnouncement() {
        this.loadingService.startLoading(this.elementRef.nativeElement.parentElement);
        this.offerAnnouncementService.sendAnnouncement(
            new SendAnnouncementRequest({
                campaignId: this.offerId,
                offerDetailsLink: this.offerPublicLink,
                serviceName: this.selectedService,
                contactListName: this.selectedListName,
                emailAddresses: []
            })
        ).pipe(
            finalize(() => {
                this.loadingService.finishLoading(this.elementRef.nativeElement.parentElement);
                this.close();
            })
        ).subscribe(() => {
            this.notifyService.success(this.ls.ls('PFM', 'AnnouncementsHaveBeenSent'));
        });
    }

    close() {
        this.dialogRef.close();
    }
}
