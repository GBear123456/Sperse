import { Injectable } from '@angular/core';

@Injectable()
export class LoadingService {
    loading = false;
    startLoading(element: any = null) {
        this.loading = true;
        abp.ui.setBusy(element);
    }

    finishLoading(element: any = null) {
        abp.ui.clearBusy(element);
        this.loading = false;
    }
}
