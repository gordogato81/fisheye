import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'exploration'},
  { path: 'exploration', loadChildren: () => import('./exploration/exploration.module').then((m) => m.ExplorationModule) },
  { path: 'comparison', loadChildren: () => import('./comparison/comparison.module').then((m) => m.ComparisonModule) },
  { path: 'statistic', loadChildren: () => import('./statistic/statistic.module').then((m) => m.StatisticModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
