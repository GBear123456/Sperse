/** Core imports */
import { ChangeDetectionStrategy, Component, ElementRef, Inject, ViewChild } from '@angular/core';

/** Third party imports */
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, finalize, switchMap, tap } from 'rxjs/operators';

/** Application imports */
import { ContactListDialogComponent } from '@app/crm/contacts/contact-list-dialog/contact-list-dialog.component';
import { ContactServiceProxy, EntityContactInfo } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';

@Component({
    selector: 'customer-list-dialog',
    templateUrl: 'customer-list-dialog.component.html',
    styleUrls: [ 'customer-list-dialog.component.less' ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerListDialogComponent {
    @ViewChild(ContactListDialogComponent, { static: true }) contactList: ContactListDialogComponent;
    private _search: BehaviorSubject<string> = new BehaviorSubject<string>('');
    search$: Observable<string> = this._search.asObservable();
    displayItems$: Observable<EntityContactInfo[]> = this.search$.pipe(
        debounceTime(500),
        tap(() => this.loadingService.startLoading(this.elementRef.nativeElement)),
        switchMap((search?: string) => {
            return this.contactProxy.getAllByPhrase(search, 10, undefined, undefined, true, true).pipe(
                finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
            )
        })
    );

    constructor(
        private elementRef: ElementRef,
        private loadingService: LoadingService,
        private contactProxy: ContactServiceProxy,
        @Inject(MAT_DIALOG_DATA) public data: { contactList: EntityContactInfo[] }
    ) {}

    search(search?: string) {
        this._search.next(search);
    }
}