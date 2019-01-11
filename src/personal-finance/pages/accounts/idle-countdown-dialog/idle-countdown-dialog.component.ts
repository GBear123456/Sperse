/** Core imports */
import { Component, Injector, OnDestroy } from '@angular/core';

/** Third party imports */
import { MatDialogRef } from '@angular/material/dialog';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppAuthService } from '@shared/common/auth/app-auth.service';

@Component({
    templateUrl: 'idle-countdown-dialog.component.html',
    styleUrls: ['idle-countdown-dialog.component.less']
})
export class IdleCountdownDialog extends AppComponentBase implements OnDestroy {
    waitTimeSeconds: number = 60; 
    countdownTimeout;
    step: number;
    progressValue: number;

    constructor(injector: Injector,
        public dialogRef: MatDialogRef<IdleCountdownDialog>,
        private _authService: AppAuthService) {
        super(injector);

        this.step = 100 / this.waitTimeSeconds;
        this.progressValue = -this.step;
        this.waitTimeSeconds += 1;
        this.countDown();
    }

    countDown() {
        this.progressValue += this.step;
        this.waitTimeSeconds--;

        if (this.progressValue < 100)
            this.countdownTimeout = setTimeout(() => this.countDown(), 1000);
        else
            this.logOut();
    }

    logOut() {
        this._authService.logout(true, location.origin + '/personal-finance');
    }

    continue() {
        clearTimeout(this.countdownTimeout);
        this.dialogRef.close({ continue: true });
    }

    ngOnDestroy() {
        clearTimeout(this.countdownTimeout);
    }
}
