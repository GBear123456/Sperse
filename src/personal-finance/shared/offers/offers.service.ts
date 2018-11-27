/** Core imports */
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Params } from '@angular/router/src/shared';

/** Third party imports */
import { camelCase, lowerCase, upperFirst } from 'lodash';
import { Observable } from 'rxjs';
import { first, map, pluck } from 'rxjs/operators';

/** Application imports */
import { CampaignDto, Category } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Injectable()
export class OffersService {

    displayedCards: CampaignDto[];
    defaultCategoryDisplayName: string = this.ls.l('Offers_Offers');

    constructor(private route: ActivatedRoute, private ls: AppLocalizationService) {}

    getCategoryFromRoute(routeParams: Observable<Params>): Observable<Category> {
        return routeParams.pipe(
            pluck('category'),
            map((category: string) => Category[upperFirst(camelCase(category))])
        );
    }

    getCategoryDisplayName(category: Category): string {
        return category ? lowerCase(category) : this.defaultCategoryDisplayName;
    }
}
