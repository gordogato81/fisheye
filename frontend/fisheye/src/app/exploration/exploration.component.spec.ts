import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplorationComponent } from './exploration.component';
import { ExplorationModule } from './exploration.module';

describe('ExplorationComponent', () => {
  let component: ExplorationComponent;
  let fixture: ComponentFixture<ExplorationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorationModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
