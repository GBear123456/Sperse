import { Injectable, Injector  } from '@angular/core';
import { CacheService } from 'ng2-cache-service';
import { CashFlowGridSettingsDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class UserPreferencesService {
    cacheKey = `UserPreferences_${abp.session.userId}`;

    private _cacheService: CacheService;
    constructor(
        injector: Injector
    ) {
        this._cacheService = injector.get(CacheService);
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
        return this._cacheService.exists(this.cacheKey);
    }

    getLocalModel(): CashFlowGridSettingsDto {
        return this._cacheService.get(this.cacheKey);
    }

    saveLocally(model: CashFlowGridSettingsDto) {
        this._cacheService.set(this.cacheKey, model);
    }

    removeLocalModel() {
        this._cacheService.remove(this.cacheKey);
    }
}
