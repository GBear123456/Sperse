import { Injectable } from '@angular/core';

@Injectable()
export class LoadingService {
    loading = false;
    startLoading(globally = false, element: any = null) {
        this.loading = true;
        abp.ui.setBusy(globally ? undefined : element);
    }

    finishLoading(globally = false, element: any = null) {
        abp.ui.clearBusy(globally ? undefined : element);
        this.loading = false;
    }
}
