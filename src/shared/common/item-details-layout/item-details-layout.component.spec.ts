import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ItemDetailsLayoutComponent } from './item-details-layout.component';

describe('ItemDetailsLayoutComponent', () => {
  let component: ItemDetailsLayoutComponent;
  let fixture: ComponentFixture<ItemDetailsLayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemDetailsLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemDetailsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
