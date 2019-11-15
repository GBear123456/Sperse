import { Injectable } from '@angular/core';

@Injectable()
export class LoadingService {
    loading = false;
    showInitialSpinner = false;
    startLoading(element?: any) {
        this.loading = true;
        abp.ui.setBusy(element);
    }

    finishLoading(element?: any) {
        abp.ui.clearBusy(element);
        this.loading = false;
    }
}
