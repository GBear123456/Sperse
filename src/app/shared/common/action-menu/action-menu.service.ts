import { Observable, of, merge } from 'rxjs';
import { delay } from 'rxjs/operators';

export class ActionMenuService {
    static toggleActionMenu(event, actionRecord: any): Observable<any> {
        event.cancel = true;
        const actionRecordId = actionRecord && (actionRecord.id || actionRecord.Id);
        return merge(
            of(null),
            of(actionRecordId && (event.data.id === actionRecordId || event.data.Id === actionRecordId) ? null : event.data).pipe(
                delay(actionRecord ? 500 : 0)
            )
        );
    }
}