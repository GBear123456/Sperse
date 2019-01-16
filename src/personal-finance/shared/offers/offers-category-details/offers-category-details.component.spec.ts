import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OffersCategoryDetailsComponent } from './offers-category-details.component';

describe('OffersCategoryDetailsComponent', () => {
  let component: OffersCategoryDetailsComponent;
  let fixture: ComponentFixture<OffersCategoryDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OffersCategoryDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OffersCategoryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
