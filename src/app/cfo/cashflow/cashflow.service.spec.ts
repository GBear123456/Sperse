import { TestBed, inject } from '@angular/core/testing';

import { CashflowService } from './cashflow.service';

describe('CashflowService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashflowService]
    });
  });

  it('should be created', inject([CashflowService], (service: CashflowService) => {
    expect(service).toBeTruthy();
  }));
});
