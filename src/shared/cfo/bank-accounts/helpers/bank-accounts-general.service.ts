import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class BankAccountsGeneralService {

    private refresh = new Subject<string>();
    refresh$ = this.refresh.asObservable();

    constructor() { }

    refreshBankAccounts() {
        this.refresh.next();
    }
}
