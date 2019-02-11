import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { map, publishReplay, switchMap, refCount } from 'rxjs/operators';
import { startCase } from 'lodash';
import { OfferDetailsForEditDto, OfferManagementServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'offer-edit',
    templateUrl: './offer-edit.component.html',
    styleUrls: ['./offer-edit.component.less'],
    providers: [ OfferManagementServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfferEditComponent implements OnInit {
    offerDetails$: Observable<OfferDetailsForEditDto>;
    offerEditForm: FormGroup = new FormGroup({});
    details$: Observable<string[]>;
    startCase = startCase;
    constructor(
        private route: ActivatedRoute,
        private offerManagementService: OfferManagementServiceProxy
    ) { }

    ngOnInit() {
        this.offerDetails$ = this.route.paramMap.pipe(
            map((paramMap: ParamMap) => +paramMap.get('id')),
            switchMap(offerId => this.offerManagementService.getDetailsForEdit(false, offerId).pipe(publishReplay(), refCount()))
        );
        this.details$ = this.offerDetails$.pipe(
            map((offerDetails: OfferDetailsForEditDto) => {
                let group: any = {};
                /** Build dynamically form for all offer details properties */
                for (let detailName in offerDetails) {
                    let detailValue = offerDetails[detailName];
                    if (this.isArray(detailValue)) {
                        group[detailName] = new FormArray([]);
                        detailValue.forEach(value => {
                            group[detailName].push(new FormControl(value));
                        });
                    } else {
                        group[detailName] = new FormControl(detailValue);
                    }
                }
                this.offerEditForm = new FormGroup(group);
                return Object.keys(offerDetails);
            })
        );
    }

    isArray(item: any): boolean {
        return Array.isArray(item);
    }

    controlIsFormArray(control: FormControl | FormArray): boolean {
        return control instanceof FormArray;
    }

    addNew(control: FormArray) {
        control.push(new FormControl(''));
    }

    onSubmit() {
        console.log(this.offerEditForm.value);
    }

}
