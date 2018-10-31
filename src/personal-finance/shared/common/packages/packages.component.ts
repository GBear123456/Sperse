import { Component, OnInit, EventEmitter, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PackageServiceProxy, ListResultDtoOfPackageDto } from '@shared/service-proxies/service-proxies';
import { PackageIdService } from './package-id.service';

@Component({
    selector: 'app-packages',
    templateUrl: './packages.component.html',
    styleUrls: ['./packages.component.less'],
    providers: [PackageServiceProxy]
})
export class PackagesComponent extends AppComponentBase implements OnInit {
    packageList: ListResultDtoOfPackageDto;
    constructor(
        injector: Injector,
        private data: PackageIdService,
        private _packageListService: PackageServiceProxy
    ) {
        super(injector);
    }

    ngOnInit() {
        this.getPackageList();
    }

    getPackageList(): void {
        this._packageListService
            .getAll()
            .subscribe(result => {
                this.packageList = result;
            });
    }

    choosePackage(packageVal: number) {
        this.data.packageId = packageVal;
        this._router.navigate(['personal-finance/signup']);
    }
}
