import { Observable, of, merge } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ActionMenuGroup } from '@app/shared/common/action-menu/action-menu-group.interface';
import { ActionMenuItem } from '@app/shared/common/action-menu/action-menu-item.interface';

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

    static prepareActionMenuGroups(actionMenuGroups: ActionMenuGroup[], entity: any) {
        actionMenuGroups.forEach((actionMenuGroup: ActionMenuGroup) => {
            ActionMenuService.prepareActionMenuItems(actionMenuGroup.items, entity);
        });
    }

    static prepareActionMenuItems(actionMenuItems: ActionMenuItem[], entity: any) {
        actionMenuItems.forEach((item: ActionMenuItem) => {
            item.visible = item.checkVisible ? item.checkVisible(entity) : item.visible === undefined || item.visible;
            if (item.visible) {
                item.text = item.getText ? item.getText(entity) : item.text;
            }
        });
    }
}