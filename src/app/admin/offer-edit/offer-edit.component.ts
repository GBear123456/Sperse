import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { OfferDetailsForEditDto, OfferManagementServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: ['./offer-edit.component.less'],
    providers: [ OfferManagementServiceProxy ]
})
export class OfferEditComponent implements OnInit {
    offerDetails$: Observable<OfferDetailsForEditDto>;
    constructor(
        private route: ActivatedRoute,
        private offerManagementService: OfferManagementServiceProxy
    ) { }

    ngOnInit() {
        this.offerDetails$ = this.route.paramMap.pipe(
            map((paramMap: ParamMap) => +paramMap.get('id')),
            switchMap(offerId => this.offerManagementService.getDetailsForEdit(false, offerId))
        );
    }

}
