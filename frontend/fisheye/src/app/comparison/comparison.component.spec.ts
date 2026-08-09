import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonComponent } from './comparison.component';
import { ComparisonModule } from './comparison.module';

describe('ComparisonComponent', () => {
  let component: ComparisonComponent;
  let fixture: ComponentFixture<ComparisonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparisonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
