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

    static toJTableListActionWithData(records, totalRecordCount, originalResult): JQueryDeferred<any> {
        return $.Deferred($dfd => {
            $dfd.resolve({
                "Result": "OK",
                "Records": records,
                "TotalRecordCount": totalRecordCount,
                originalResult: originalResult
            });
        });
    }
}