import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatisticComponent } from './statistic.component';

@NgModule({
  declarations: [StatisticComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: StatisticComponent }]),
  ]
})
export class StatisticModule { }
