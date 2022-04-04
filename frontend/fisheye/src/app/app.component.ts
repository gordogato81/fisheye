import { Component, OnInit } from '@angular/core';
// import { MatToolbarModule } from '@angular/material/toolbar';
// import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'FishingEye';
  navLinks: any[] = [
    {
      label: 'Exploration',
      route: 'exploration'
    }, {
      label: 'Statistic',
      route: 'statistic'
    }, {
      label: 'Comparison',
      route: 'comparison'
    },
  ];
  // activeLink = this.navLinks[0];
  // activeLinkIndex = -1;
  // constructor(private router: Router) {}

  // ngOnInit(): void {
  //   this.router.events.subscribe((res) => {
  //     this.activeLinkIndex = this.navLinks.indexOf(this.navLinks.find(tab => tab.link === '.' + this.router.url));
  // });
  // }

}
