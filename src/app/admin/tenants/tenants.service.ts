/** Core imports */
import { Injectable } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { groupBy, concatAll, toArray, map, mergeMap, filter, switchMap, publishReplay, refCount } from 'rxjs/operators';
import values from 'lodash/values';

/** Application imports */
import {
    CommonLookupServiceProxy,
    SubscribableEditionComboboxItemDto,
    TenantServiceProxy,
    TenantEditEditionDto,
    TenantEditDto,
    ModuleType
} from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class TenantsService {
    editionsModels: { [name: string]: TenantEditEditionDto } = {};
    private defaultEditionId = '0';

    constructor(
        private tenantService: TenantServiceProxy,
        private commonLookupService: CommonLookupServiceProxy,
        private appLocalizationService: AppLocalizationService
    ) {}

    getEditionsGroupsWithDefaultEdition(): Observable<SubscribableEditionComboboxItemDto[][]> {
        return this.getDefaultEditionName().pipe(
            switchMap(defaultEditionName => {
                return this.getEditionsGroups(defaultEditionName);
            })
        );
    }

    getDefaultEditionName(): Observable<string> {
        return this.commonLookupService.getDefaultEditionName().pipe(
            publishReplay(),
            refCount(),
            map(res => res.name)
        );
    }

    getEditionsGroups(defaultEditionName = null): Observable<SubscribableEditionComboboxItemDto[][]>  {
        return this.commonLookupService.getEditionsForCombobox(false).pipe(
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
                    } else {
                        edition.editionId = +this.defaultEditionId;
                    }

                    this.editionsModels[editions[0].moduleId] = edition;
                    return this.concatEditionsWithDefault(editions);
                })
            )),
            toArray(),
            map((items: SubscribableEditionComboboxItemDto[]) => items.sort((itemA, itemB) => {
                return itemA[1].moduleId === ModuleType.CFO_Partner ? 1 : (itemB[1].moduleId === ModuleType.CFO_Partner ? -1 : 0);
            }))
        );
    }

    concatEditionsWithDefault(editions: SubscribableEditionComboboxItemDto[]): SubscribableEditionComboboxItemDto[] {
        let notAssignedItem = new SubscribableEditionComboboxItemDto();
        notAssignedItem.value = this.defaultEditionId;
        notAssignedItem.displayText = this.appLocalizationService.l('NotAssigned');
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

    getTenantEditions() {
        return values(this.editionsModels).filter(editionModel => editionModel.editionId.toString() !== this.defaultEditionId);
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
