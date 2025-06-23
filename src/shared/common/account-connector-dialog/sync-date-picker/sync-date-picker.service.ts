/** Cor imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import * as moment from 'moment-timezone';

/** Application imports */
import { CFOService } from '@shared/cfo/cfo.service';
import { InstanceServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { DateHelper } from '@shared/helpers/DateHelper';

@Injectable()
export class SyncDatePickerService {
    private _maxSyncDate = new ReplaySubject<moment.Moment>(1);
    maxSyncDate$: Observable<moment.Moment> = this._maxSyncDate.asObservable();

    constructor(
        private _cfoService: CFOService,
        private _instanceService: InstanceServiceProxy
    ) {
        this.invalidate();
    }

    setMaxVisibleDate(date?: moment) {
        if (this._cfoService.initialized) {
            if (date)
                date = DateHelper.getDateWithoutTime(date);
            this._instanceService.setMaxVisibleDate(this._cfoService.instanceType as InstanceType,
                this._cfoService.instanceId, date).subscribe(() => this._maxSyncDate.next(date));
        }
    }

    getMaxVisibleDate() {
        return this._instanceService.getMaxVisibleDate(
            this._cfoService.instanceType as InstanceType, this._cfoService.instanceId);
    }

    invalidate() {
        (this._cfoService.initialized ?
            this.getMaxVisibleDate() :
            this._cfoService.instanceChangeProcess().pipe(switchMap(() => this.getMaxVisibleDate()))
        ).subscribe(date => this._maxSyncDate.next(date));
    }
}
