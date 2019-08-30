/** Core imports */
import { Injectable } from '@angular/core';

/** Application imports */
import { OrganizationUnitDto } from '@shared/service-proxies/service-proxies';

@Injectable()
export class DataGridHelper {

    static getOrganizationUnitName(organizationUnitId: number, organizationUnits: OrganizationUnitDto[]): string {
        let organizationUnitName = '';
        if (organizationUnits && organizationUnits.length) {
            const organizationUnit = organizationUnits.find((organizationUnit: OrganizationUnitDto) => {
                return organizationUnit.id === organizationUnitId;
            });
            if (organizationUnit) {
                organizationUnitName = organizationUnit.displayName;
            }
        }
        return organizationUnitName;
    }
}
