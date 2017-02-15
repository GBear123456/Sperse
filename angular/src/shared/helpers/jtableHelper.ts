import { Observable } from 'rxjs/Observable';
export class JTableHelper {
    static toJTableListAction(observable: Observable<any>): JQueryDeferred<any> {
        return $.Deferred($dfd => {
            observable.subscribe(result => {
                $dfd.resolve({
                    "Result": "OK",
                    "Records": result.items,
                    "TotalRecordCount": result.totalCount,
                    originalResult: result
                });
            });
        });
    }
}