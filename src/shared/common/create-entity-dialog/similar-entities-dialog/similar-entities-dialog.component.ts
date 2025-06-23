/** Core imports */
import { Component, Inject } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

/** Third party imports */
import { BehaviorSubject } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { SimilarContactOutput } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { ItemDetailsService } from '@shared/common/item-details-layout/item-details.service';

@Component({
    selector: 'similar-entities-dialog',
    templateUrl: './similar-entities-dialog.component.html',
    styleUrls: ['./similar-entities-dialog.component.less'],
})
export class SimilarEntitiesDialogComponent {
    private readonly SUB_CONTACTS_TAB_INDEX = 2;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private itemDetailsService: ItemDetailsService,
        public dialogRef: MatDialogRef<SimilarEntitiesDialogComponent>,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {}

    selectSimilarEntity(similarEntity: SimilarContactOutput): void {
        let queryParams = (this.activatedRoute.queryParams as BehaviorSubject<Params>).getValue();
        this.itemDetailsService.clearItemsSource();
        this.data.componentRef.close();
        this.dialogRef.close();
        if (similarEntity.parentId)
            queryParams = {...queryParams, tab: this.SUB_CONTACTS_TAB_INDEX};
        this.router.navigate(
            ['app/crm/contact/' + (similarEntity.parentId || similarEntity.id) + '/' + 
                (similarEntity.parentId ? 'lead-related-contacts' : 'contact-information')
            ], { 
                queryParams: queryParams.referrer ? queryParams : 
                    { ...queryParams, referrer: this.router.url.split('?').shift() }
            }
        );
    }

    closeSimilarCustomersDialog() {
        this.dialogRef.close();
    }
}