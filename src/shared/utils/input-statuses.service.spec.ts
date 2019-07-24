import { TestBed, inject } from '@angular/core/testing';

import { InputStatusesService } from './input-statuses.service';

describe('InputStatusesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InputStatusesService]
    });
  });

  it('should be created', inject([InputStatusesService], (service: InputStatusesService) => {
    expect(service).toBeTruthy();
  }));
});
