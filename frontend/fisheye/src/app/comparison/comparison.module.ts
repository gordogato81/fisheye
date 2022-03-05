import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComparisonComponent } from './comparison.component';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
@NgModule({
  declarations: [ComparisonComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: ComparisonComponent }]),
    MatCardModule,
    MatFormFieldModule,
    MatNativeDateModule,
    MatSliderModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatButtonModule
  ]
})
export class ComparisonModule { }
