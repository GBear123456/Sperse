/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { CacheService } from 'ng2-cache-service';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

/** Application imports */
import { CashFlowGridSettingsDto, CashflowServiceProxy, InstanceType } from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';

@Injectable()
export class UserPreferencesService {
    cacheKey = `UserPreferences_${abp.session.userId}`;
    private _userPreferences: ReplaySubject<CashFlowGridSettingsDto> = new ReplaySubject(1);
    userPreferences$: Observable<CashFlowGridSettingsDto> = this._userPreferences.asObservable();
    constructor(
        private cacheService: CacheService,
        private cfoService: CFOService,
        private cashflowService: CashflowServiceProxy
    ) {
        if (this.checkExistsLocally()) {
            const data = this.getLocalModel();
            let model = new CashFlowGridSettingsDto();
            model.init(data);
            this._userPreferences.next(model);
        } else {
            this.load();
        }
    }

    load() {
        this.cfoService.statusActive.pipe(
            filter(Boolean),
            switchMap(() => this.cashflowService.getCashFlowGridSettings(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId))
        ).subscribe((userPreferences: CashFlowGridSettingsDto) => {
            this._userPreferences.next(userPreferences);
        });
    }

    checkFlag(value, flag): boolean {
        return (value & flag) != 0;
    }

    checkBoxValueChanged(event, obj, prop, flag) {
        event.value ? obj[prop] |= flag : obj[prop] &= ~flag;
    }

    isCellMarked(generalValue, flag) {
        return !!(generalValue & flag);
    }

    checkExistsLocally(): boolean {
        return this.cacheService.exists(this.cacheKey);
    }

    getLocalModel(): CashFlowGridSettingsDto {
        return this.cacheService.get(this.cacheKey);
    }

    saveRemotely(model: CashFlowGridSettingsDto): Observable<any> {
        return this.cashflowService.saveCashFlowGridSettings(InstanceType[this.cfoService.instanceType], this.cfoService.instanceId, model);
    }

    saveLocally(model: CashFlowGridSettingsDto) {
        this.cacheService.set(this.cacheKey, model);
    }

    removeLocalModel() {
        this.cacheService.remove(this.cacheKey);
    }

    getClassNameFromPreference(preference: {sourceName: string, sourceValue: string}) {
        return preference['sourceName'] + preference['sourceValue'].replace(/ /g, '');
    }
}
