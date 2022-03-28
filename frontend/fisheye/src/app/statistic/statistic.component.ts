import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import { forkJoin, map, observable, Observable, startWith } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import * as L from 'leaflet'
import * as d3 from 'd3'

import countryJson from '../../assets/json/countries.json';
import { Country, cData, bin } from '../interfaces';
import { StatisticService } from '../service/statistic.service';
import { HistogramGeneratorDate, PieArcDatum } from 'd3';
@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.sass']
})
export class StatisticComponent implements OnInit {

  constructor(private ds: APIService, private stService: StatisticService) { }

  private navigation!: L.Map;
  private margin = { top: 30, right: 30, bottom: 30, left: 60 };
  private width = 920 - this.margin.left - this.margin.right;
  private height = 870 - this.margin.top - this.margin.bottom;
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
  chart = 'bar';
  barAg = 'week';
  mCountries = new FormControl();
  lineSelection: string[] = []

  ngOnInit(): void {
    this.filteredOptions = this.countryControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options.slice())),
    );
    this.mCountries.disable();
    this.navigation = L.map('navigation2').setView([18, 0], 2.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.navigation);
    // L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
    //   minZoom: 2,
    //   maxZoom: 10,
    //   attribution:
    //     '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    // })

    this.navigation.on('moveend zoomend', () => {
      let bl: L.LatLng = L.latLng(0, 0),
        tr: L.LatLng = L.latLng(0, 0);
      const navBounds = this.navigation.getBounds();
      const pixelBounds = this.navigation.getPixelBounds();
      const bl1 = L.point(pixelBounds.getBottomLeft().x, (pixelBounds.getBottomLeft().y - 217)); // 217 is a hardcoded value based on the hard coded height of each container. 
      const tr1 = L.point(pixelBounds.getTopRight().x, (pixelBounds.getTopRight().y + 217));
      bl = this.navigation.unproject(bl1);
      tr = this.navigation.unproject(tr1);
      bl.lng = this.truncate(navBounds.getWest());
      tr.lng = this.truncate(navBounds.getEast());
      bl.lat = this.truncate(bl.lat);
      tr.lat = this.truncate(tr.lat);
      this.stService.setBlTr([bl.lat, bl.lng], [tr.lat, tr.lng]);
    });

    const start = '2020-01-01';
    const end = '2020-12-31';
    this.range1.setValue({ start: start, end: end });
    this.countryControl.setValue('World');
    this.callChart();
  }

  truncate(x: number) {
    if (x < 0) {
      x = Math.ceil(x * 10) / 10;
    } else if (x >= 0) {
      x = Math.floor(x * 10) / 10;
    }
    return x
  }

  callChart() {
    const country = this.countryControl.value;
    const countries = this.mCountries.value;
    const start = new Date(Date.parse(this.range1.value.start));
    const end = new Date(Date.parse(this.range1.value.end));
    // const navMap = this.stService.getMap();
    // // console.log(navMap.getBounds());
    if (this.worldChecked) {
      if (this.chart == 'bar') {
        this.fillBar(start, end, country);
      } else if (this.chart == 'line') {
        this.fillChart(start, end, countries);
      }
    } else {
      const bl = this.stService.getBl();
      const tr = this.stService.getTr();
      if (this.chart == 'bar') {
        this.fillBar(start, end, country, bl, tr);
      } else if (this.chart == 'line') {
        this.fillChart(start, end, countries, bl, tr);
      }
    }
  }

  fillBar(start: Date, end: Date, country: string, bl?: [number, number], tr?: [number, number]) {
    const that = this;
    this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), country, bl, tr).subscribe(data => {
      console.log(data);
      const timDom: [Date, Date] = [start, end];
      const parseDate = d3.timeFormat("%Y-%m-%d");
      if (!d3.select('#chart').select('svg').empty()) d3.select('#chart').select('svg').remove(); //removes previous chart if it exists
      const svg = d3.select('#chart')
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")");
      const xScale = d3.scaleTime()
        .domain([start, end])
        .range([0, this.width]);


      //Manually type casting bin to be <cData, Date> took 4 hours to figure out
      const histogram = d3.bin<cData, Date>()
        .value(d => d.date)
        .domain([start, end]);
      if (this.barAg == 'day') {
        histogram
          .thresholds(xScale.ticks(d3.timeDay));
      } else if (this.barAg == 'week') {
        histogram
          .thresholds(xScale.ticks(d3.timeWeek));
      } else if (this.barAg == 'month') {
        histogram
          .thresholds(xScale.ticks(d3.timeMonth));
      } else if (this.barAg == 'year') {
        histogram
          .thresholds(xScale.ticks(d3.timeYear));
      }


      const bins = histogram(data);
      const means = this.dataToBins(data, bins);
      let binSums: { x0: Date, x1: Date, tfh: number }[] = [];
      for (let i = 0; i < bins.length; i++) {
        const x0 = bins[i].x0!;
        const x1 = bins[i].x1!;
        const tfh = means[i];
        const it: { x0: Date, x1: Date, tfh: number } = { x0, x1, tfh };

        binSums.push(it);
      }
      // console.log(binMean)

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(means)!])
        .range([this.height, 0])

      svg.selectAll("rect")
        .data(binSums)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", 1)
        .attr("fill", 'purple')
        .attr("transform", function (d) {
          return "translate(" + xScale(d.x0) + "," + yScale(d.tfh) + ")";
        })
        .attr("width", function (d) { return xScale(d.x1) - xScale(d.x0) - 1; })
        .attr("height", function (d) { return that.height - yScale(d.tfh); });

      svg.append("g")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3.axisBottom(xScale));

      // add the y Axis
      svg.append("g")
        .call(d3.axisLeft(yScale));
    });
  }



  fillChart(start: Date, end: Date, countries: string[], bl?: [number, number], tr?: [number, number]) {
    let joined$ = new Observable;
    if (countries.length == 1) {
      const data1$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[0], bl, tr);
      joined$ = forkJoin([data1$]);
    } else if (countries.length == 2) {
      const data1$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[0], bl, tr);
      const data2$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[1], bl, tr);
      joined$ = forkJoin([data1$, data2$]);
    } else if (countries.length == 3) {
      const data1$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[0], bl, tr);
      const data2$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[1], bl, tr);
      const data3$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[2], bl, tr);
      joined$ = forkJoin([data1$, data2$, data3$]);
    } else if (countries.length == 4) {
      const data1$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[0], bl, tr);
      const data2$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[1], bl, tr);
      const data3$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[2], bl, tr);
      const data4$ = this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), countries[3], bl, tr);
      joined$ = forkJoin([data1$, data2$, data3$, data4$]);
    } else {
      joined$ = forkJoin([]);
    }

    joined$.subscribe((data: any) => {
      // const startDate = new Date(data[0].date);
      // const endDate = new Date(data[data.length - 1].date);
      //let getValues = data.map(d => d.date);
      let tDomain: [Date, Date] = [start, end]; //d3.extent(data.map(d => d.date));
      console.log(data);
      //console.log(domain);

      if (!d3.select('#chart').select('svg').empty()) d3.select('#chart').select('svg').remove(); //removes previous chart if it exists
      const svg = d3.select('#chart')
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")");

      let xScale = d3.scaleTime()
        .domain([start, end])
        .range([0, this.width]);
      svg.append("g")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3.axisBottom(xScale));

      let maxes = [];
      if (data.length == 1) {
        const max1 = d3.max(data[0], function (d: cData) { return +d.tfh; }) ?? 10;
        maxes.push(max1);
      } else if (data.length == 2) {
        const max1 = d3.max(data[0], function (d: cData) { return +d.tfh; }) ?? 10;
        const max2 = d3.max(data[1], function (d: cData) { return +d.tfh; }) ?? 10;
        maxes.push(max1);
        maxes.push(max2);
      } else if (data.length == 3) {
        const max1 = d3.max(data[0], function (d: cData) { return +d.tfh; }) ?? 10;
        const max2 = d3.max(data[1], function (d: cData) { return +d.tfh; }) ?? 10;
        const max3 = d3.max(data[2], function (d: cData) { return +d.tfh; }) ?? 10;
        maxes.push(max1);
        maxes.push(max2);
        maxes.push(max3);

      } else if (data.length == 4) {
        const max1 = d3.max(data[0], function (d: cData) { return +d.tfh; }) ?? 10;
        const max2 = d3.max(data[1], function (d: cData) { return +d.tfh; }) ?? 10;
        const max3 = d3.max(data[2], function (d: cData) { return +d.tfh; }) ?? 10;
        const max4 = d3.max(data[3], function (d: cData) { return +d.tfh; }) ?? 10;
        maxes.push(max1);
        maxes.push(max2);
        maxes.push(max3);
        maxes.push(max4);

      }

      const tfhMax = d3.max(maxes, function (d: number) { return d; }) ?? 10;
      // Y axis: initialization
      let yScale = d3.scaleLinear()
        .domain([0, tfhMax])
        .range([this.height, 0]);
      svg.append("g")
        .call(d3.axisLeft(yScale));

      const linef1: any = d3.line().x((d: any) => xScale(new Date(d.date))).y((d: any) => yScale(+d.tfh))
      const linef2: any = d3.line().x((d: any) => xScale(new Date(d.date))).y((d: any) => yScale(+d.tfh))
      const linef3: any = d3.line().x((d: any) => xScale(new Date(d.date))).y((d: any) => yScale(+d.tfh))
      const linef4: any = d3.line().x((d: any) => xScale(new Date(d.date))).y((d: any) => yScale(+d.tfh))

      if (data.length == 1) {
        const line1 = svg.append("path")
          .datum(data[0])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", linef1)
      } else if (data.length == 2) {
        const line1 = svg.append("path")
          .datum(data[0])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", linef1)
        const line2 = svg.append("path")
          .datum(data[1])
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 1.5)
          .attr("d", linef2)
      } else if (data.length == 3) {
        const line1 = svg.append("path")
          .datum(data[0])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", linef1);
        const line2 = svg.append("path")
          .datum(data[1])
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 1.5)
          .attr("d", linef2);
        const line3 = svg.append("path")
          .datum(data[2])
          .attr("fill", "none")
          .attr("stroke", "purple")
          .attr("stroke-width", 1.5)
          .attr("d", linef3);
      } else if (data.length == 4) {
        const line1 = svg.append("path")
          .datum(data[0])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", linef1);
        const line2 = svg.append("path")
          .datum(data[1])
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-width", 1.5)
          .attr("d", linef2);
        const line3 = svg.append("path")
          .datum(data[2])
          .attr("fill", "none")
          .attr("stroke", "purple")
          .attr("stroke-width", 1.5)
          .attr("d", linef3);
        const line4 = svg.append("path")
          .datum(data[3])
          .attr("fill", "none")
          .attr("stroke", "green")
          .attr("stroke-width", 1.5)
          .attr("d", linef4);
      }
    })
  }
  dateToStr(d: Date) {
    return d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2)
  }

  dataToBins(data: cData[], bins: any): number[] {
    let binned: cData[][] = [];
    bins.forEach((b: any) => {
      const daBin = data.filter((d: cData) => new Date(d.date) >= b.x0 && new Date(d.date) < b.x1);
      binned.push(daBin);
    });

    let sums: number[] = []
    binned.forEach((b: cData[]) => {
      sums.push(<number>d3.sum(b.map(d => d.tfh)));
    })
    return sums
  }

  radioChange() {
    if (this.chart == 'line') {
      this.countryControl.disable()
      this.mCountries.enable()
    } else if (this.chart == 'bar') {
      this.countryControl.enable()
      this.mCountries.disable()
    }

  }

  lineChange() {
    if (this.mCountries.value.length < 5) {
      this.lineSelection = this.mCountries.value;
    } else if (this.mCountries.value.length >= 5) {
      this.mCountries.setValue(this.lineSelection);
    }
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
