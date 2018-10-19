import {
    Component,
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
    Injector,
    Input,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AccountConnector } from '@shared/common/account-connector-dialog/models/account-connector.model';
import { AccountConnectors } from '@shared/AppEnums';
import { MatDialogRef } from '@angular/material';
import { CFOService } from '@shared/cfo/cfo.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'account-connector-chooser',
    styleUrls: [ './account-connector-chooser.less' ],
    templateUrl: './account-connector-chooser.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountConnectorChooserComponent extends AppComponentBase implements OnInit {
    @Input() disabledConnectors: AccountConnectors[];
    @Output() onConnectorChosen: EventEmitter<AccountConnectors> = new EventEmitter<AccountConnectors>();
    selectedConnector: BehaviorSubject<AccountConnector> = new BehaviorSubject(null);
    connectors: AccountConnector[];
    nextButtonIsHidden$: Observable<boolean>;
    constructor(
        injector: Injector,
        private dialogRef: MatDialogRef<AccountConnectorChooserComponent>,
        private cfoService: CFOService,
        private changeDetectionRef: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit() {
        this.connectors = [
            {
                name: AccountConnectors.Quovo,
                iconName: 'quovo-connector',
                title: this.l('QuovoConnectorTitle'),
                description: this.l('QuovoConnectorDescription'),
                disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Quovo))
            },
            {
                name: AccountConnectors.Xero,
                iconName: 'xero-connector',
                title: this.l('XeroConnectorTitle'),
                description: this.l('XeroConnectorDescription'),
                disabled: !!(this.disabledConnectors && ~this.disabledConnectors.indexOf(AccountConnectors.Xero))
            }
        ];
        /** Select quovo by default */
        this.selectConnector(this.connectors[0]);
        this.nextButtonIsHidden$ = combineLatest(
            this.selectedConnector,
            this.cfoService.statusActive,
            (selectedConnector, statusActive) => {
                return !selectedConnector || (selectedConnector.name === AccountConnectors.Quovo && !statusActive);
            }
        /** Update ui if something changed (without timeout doesn't work) */
        ).pipe( tap(() => setTimeout(() => this.changeDetectionRef.detectChanges()) ));
    }

    selectConnector(connector: AccountConnector) {
        if (!connector.disabled) {
            this.selectedConnector.next(connector);
        }
    }

    next() {
        if (this.selectedConnector) {
            this.onConnectorChosen.emit(this.selectedConnector.value.name);
        }
    }

    close() {
        this.dialogRef.close();
    }
}
