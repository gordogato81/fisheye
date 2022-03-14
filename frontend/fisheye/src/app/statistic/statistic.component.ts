import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import * as L from 'leaflet'
import * as d3 from 'd3'

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.sass']
})
export class StatisticComponent implements OnInit {

  constructor(private ds: APIService) { }

  private navigation!: L.Map;

  ngOnInit(): void {
    this.navigation = L.map('navigation2').setView([18, 0], 2.5);
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   minZoom: 2,
    //   maxZoom: 10,
    //   attribution:
    //     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    // })
    L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    }).addTo(this.navigation);


    var svg = d3.select('#chart')
        .append('svg')
        .attr('width', '95%')
        .attr('height', '95%')
        .append('g')
        .attr('transform', 'translate(' + 60 + ',' + 10 + ')');

    
  }
  fillChart() {

  }
}
