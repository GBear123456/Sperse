import { TestBed, inject } from '@angular/core/testing';

import { OffersWizardService } from './offers-wizard.service';

describe('OffersWizardService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OffersWizardService]
    });
  });

  it('should be created', inject([OffersWizardService], (service: OffersWizardService) => {
    expect(service).toBeTruthy();
  }));
});
