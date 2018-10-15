import { Injectable } from '@angular/core';
import {
    CommonLookupServiceProxy,
    SubscribableEditionComboboxItemDto,
    TenantServiceProxy,
    TenantEditEditionDto, TenantEditDto
} from '@shared/service-proxies/service-proxies';
import { Observable } from 'rxjs';
import { groupBy, concatAll, toArray, map, mergeMap, filter, switchMap, publishReplay, refCount } from 'rxjs/operators';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class TenantsService {
    editionsModels: { [name: string]: TenantEditEditionDto } = {};

    constructor(
        private _tenantService: TenantServiceProxy,
        private _commonLookupService: CommonLookupServiceProxy,
        private _appLocalizationService: AppLocalizationService
    ) {}

    getEditionsGroupsWithDefaultEdition(): Observable<SubscribableEditionComboboxItemDto[][]> {
        return this.getDefaultEditionName().pipe(
            switchMap(defaultEditionName => {
                return this.getEditionsGroups(defaultEditionName);
            })
        );
    }

    getDefaultEditionName(): Observable<string> {
        return this._commonLookupService.getDefaultEditionName().pipe(
            publishReplay(),
            refCount(),
            map(res => res.name)
        );
    }

    getEditionsGroups(defaultEditionName = null): Observable<SubscribableEditionComboboxItemDto[][]>  {
        return this._commonLookupService.getEditionsForCombobox(false).pipe(
            map(res => res.items),
            concatAll(),
            filter(edition => !!edition.moduleId),
            groupBy(edition => edition.moduleId),
            mergeMap(group$ => group$.pipe(
                toArray(),
                map((editions: SubscribableEditionComboboxItemDto[]) => {
                    const edition = new TenantEditEditionDto();
                    if (defaultEditionName) {
                        const defaultId = editions.find(edition => edition.displayText === defaultEditionName).value;
                        if (defaultId) {
                            edition.editionId = +defaultId;
                        }
                    }
                    this.editionsModels[editions[0].moduleId] = edition;
                    return this.concatEditionsWithDefault(editions);
                })
            )),
            toArray()
        );
    }

    concatEditionsWithDefault(editions: SubscribableEditionComboboxItemDto[]): SubscribableEditionComboboxItemDto[] {
        let notAssignedItem = new SubscribableEditionComboboxItemDto();
        notAssignedItem.value = '0';
        notAssignedItem.displayText = this._appLocalizationService.l('NotAssigned');
        editions.unshift(notAssignedItem);
        return editions;
    }

    getEditionsModels(editionsGroups, tenant: TenantEditDto) {
        tenant.editions.forEach(tenantEdition => {
            const moduleId = this.getModuleIdByEditionId(tenantEdition.editionId, editionsGroups);
            this.editionsModels[moduleId] = tenantEdition;
        });
        return this.editionsModels;
    }

    getModuleIdByEditionId(editionId: number, editionsGroups): string {
        let moduleId: string;
        editionsGroups.some(group => {
            return group.some(editionInGroup => {
                if (editionInGroup.value == editionId) {
                    moduleId = editionInGroup.moduleId;
                    return true;
                }
            });
        });
        return moduleId;
    }
}
