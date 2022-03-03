import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PackageServiceProxy, ListResultDtoOfPackageDto } from '@shared/service-proxies/service-proxies';
import { PackageIdService } from './package-id.service';

@Component({
    selector: 'app-packages',
    templateUrl: './packages.component.html',
    styleUrls: ['./packages.component.less'],
    providers: [PackageServiceProxy]
})
export class PackagesComponent implements OnInit {
    packageList: ListResultDtoOfPackageDto;
    constructor(
        private data: PackageIdService,
        private packageListService: PackageServiceProxy,
        private router: Router
    ) {}

    ngOnInit() {
        this.getPackageList();
    }

    getPackageList(): void {
        this.packageListService
            .getAll()
            .subscribe(result => {
                this.packageList = result;
            });
    }

    choosePackage(packageVal: number) {
        this.data.packageId = packageVal;
        this.router.navigate(['personal-finance/signup']);
    }
}
