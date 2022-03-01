import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComparisonComponent } from './comparison.component';

@NgModule({
  declarations: [ComparisonComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: ComparisonComponent }]),
  ]
})
export class ComparisonModule { }
