import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import { map, Observable, startWith } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import * as L from 'leaflet'
import * as d3 from 'd3'

import countryJson from '../../assets/json/countries.json';
import { Country, cData } from '../interfaces';
import { StatisticService } from '../service/statistic.service';
@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.sass']
})
export class StatisticComponent implements OnInit {

  constructor(private ds: APIService, private stService: StatisticService) { }

  private navigation!: L.Map;
  countryControl = new FormControl();
  options: Country[] = countryJson;
  filteredOptions!: Observable<Country[]>;
  range1 = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  minDate: Date = new Date('2017-01-01');
  maxDate: Date = new Date('2020-12-31');
  worldChecked = true;
  ngOnInit(): void {
    this.filteredOptions = this.countryControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options.slice())),
    );

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

    this.navigation.on('moveend zoomend', () => {
      // this.stService.setMap(this.navigation);
      const bounds = document.querySelector("#border")!.getBoundingClientRect();
      const bl = this.navigation.layerPointToLatLng(L.point(bounds.left, bounds.bottom));
      const tr = this.navigation.layerPointToLatLng(L.point(bounds.right, bounds.top));
      const navBounds = this.navigation.getBounds();
      bl.lng = navBounds.getWest();
      tr.lng = navBounds.getEast();
      console.log(bl, tr)
      this.stService.setBlTr([bl.lat, bl.lng], [tr.lat, tr.lng]);
    });

    const start = '2020-01-01';
    const end = '2020-12-31';
    this.range1.setValue({ start: start, end: end });
    this.countryControl.setValue('World');
    this.callChart();
  }
  callChart() {
    const country = this.countryControl.value;
    const start = new Date(Date.parse(this.range1.value.start));
    const end = new Date(Date.parse(this.range1.value.end));
    // const navMap = this.stService.getMap();
    // // console.log(navMap.getBounds());
    if (this.worldChecked) {
      this.fillChart(start, end, country);
    } else {
      const bl = this.stService.getBl();
      const tr = this.stService.getTr();
      this.fillChart(start, end, country, bl, tr);
    }
  }

  fillChart(start: Date, end: Date, country: string, bl?: [number, number], tr?: [number, number]) {
    this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), country, bl, tr).subscribe(data => {
      // const startDate = new Date(data[0].date);
      // const endDate = new Date(data[data.length - 1].date);
      //let getValues = data.map(d => d.date);
      let tDomain: [Date, Date] = [start, end]; //d3.extent(data.map(d => d.date));
      console.log()
      //console.log(domain);
      let margin = { top: 30, right: 30, bottom: 30, left: 60 },
        width = 920 - margin.left - margin.right,
        height = 870 - margin.top - margin.bottom
      if (!d3.select('#chart').select('svg').empty()) d3.select('#chart').select('svg').remove(); //removes previous chart if it exists
      const svg = d3.select('#chart')
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

      let xScale = d3.scaleTime()
        .domain([start, end])
        .range([0, width]);
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

      const tfhMax = d3.max(data, function (d: cData) { return +d.tfh; }) ?? 10;
      // Y axis: initialization
      let yScale = d3.scaleLinear()
        .domain([0, tfhMax])
        .range([height, 0]);
      svg.append("g")
        .call(d3.axisLeft(yScale));

      const line: any = d3.line().x((d: any) => xScale(new Date(d.date))).y((d: any) => yScale(+d.tfh))

      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line)
    })
  }
  dateToStr(d: Date) {
    return d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2)
  }


  clickUpdate() {
    //alert("Hi there, we have been trying to reach you about your car's extended warranty. Please call us back at +491723304303")
    this.callChart()
  }
  private _filter(name: string): Country[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => option.viewValue.toLowerCase().includes(filterValue));
  }
}
