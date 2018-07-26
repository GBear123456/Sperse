import { Injectable } from '@angular/core';

@Injectable()
export class PackageIdService {
  packageId: number;

  constructor() { }

  choosePackage(packageId: number) {
      this.packageId = packageId;
  }
}
