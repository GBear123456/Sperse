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
                    } else if (this.isObject(detailValue)) {
                        let detailGroup: any = {};
                        for (let value in detailValue) {
                            if (detailValue.hasOwnProperty(value)) {
                                detailGroup[value] = new FormControl(detailValue[value]);
                            }
                        }
                        group[detailName] = new FormGroup(detailGroup);
                    } else {
                        group[detailName] = this.isBool(detailValue) ? new FormControl(!!detailValue) : new FormControl(detailValue);
                    }
                }
                this.offerEditForm = new FormGroup(group);
                return Object.keys(offerDetails);
            })
        );
    }

    isPrimitive(item: any): boolean {
        return item !== Object(item);
    }

    isBool(value: any): boolean {
        return value === 'true' || value === 'false' || typeof value === 'boolean';
    }

    isObject(item: any): boolean {
        return item === Object(item);
    }

    isArray(item: any): boolean {
        return Array.isArray(item);
    }

    isFormArray(control: FormControl | FormArray): boolean {
        return control instanceof FormArray;
    }

    isFormGroup(control: FormControl | FormGroup): boolean {
        return control instanceof FormGroup;
    }

    addNew(control: FormArray) {
        control.push(new FormControl(''));
    }

    getKeys(object: Object) {
        return Object.keys(object);
    }

    onSubmit() {
        this.offerManagementService.extend(this.offerEditForm.value).subscribe();
    }

}
