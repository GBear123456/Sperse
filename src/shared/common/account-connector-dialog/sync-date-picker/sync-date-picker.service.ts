/** Cor imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable, ReplaySubject } from 'rxjs';
import * as moment from 'moment-timezone';

/** Application imports */
import { CFOService } from '@shared/cfo/cfo.service';
import { InstanceServiceProxy, InstanceType74, InstanceType75 } from '@shared/service-proxies/service-proxies';

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

    setMaxVisibleDate(date: moment) { 
        if (this._cfoService.initialized)
            this._instanceService.setMaxVisibleDate(this._cfoService.instanceType as InstanceType75, 
                this._cfoService.instanceId, date).subscribe(() => this._maxSyncDate.next(date));
    }

    invalidate() {  
        if (this._cfoService.initialized)
            this._instanceService.getMaxVisibleDate(this._cfoService.instanceType as InstanceType74, this._cfoService.instanceId)
                .subscribe(date => this._maxSyncDate.next(date.isValid() ? date : moment()));
        else 
            this._maxSyncDate.next(moment());
    }
}