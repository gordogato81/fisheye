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
  lineSelection: string[] = [];
  lineScale = 'linear';

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
    this.showProgress();
    this.ds.getChartData(this.dateToStr(start), this.dateToStr(end), country, bl, tr).subscribe(data => {
      this.hideProgress();
      console.log(data);
      
      const legendContainer = document.getElementById('legendContainer')!
      const graphContainer = document.getElementById('graphContainer')!;
      const legendWidth = legendContainer.offsetWidth;
      const legendheight = legendContainer.offsetHeight;
      this.width = graphContainer.offsetWidth - this.margin.left - this.margin.right;
      this.height = graphContainer.offsetHeight - this.margin.top - this.margin.bottom;

      if (!d3.select('#chart').select('svg').empty()) d3.select('#chart').select('svg').remove(); //removes previous chart if it exists
      if (!d3.select('#chartLegend').selectAll('text').empty()) d3.select('#chartLegend').selectAll('text').remove(); //removes previous chart if it exists
      if (!d3.select('#chartLegend').selectAll('circle').empty()) d3.select('#chartLegend').selectAll('circle').remove();
      if (!d3.select('#chart').select('div').empty()) d3.select('#chart').select('div').remove();
      const svg = d3.select('#chart')
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")");
      const tooltip = d3.select("#chart")
        .append('div')
        .attr('z-index', 999)
        .style('visibility', 'hidden')
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");

      const legendSVG = d3.select('#chartLegend')
        .attr('height', legendheight * 2 / 3)
        .attr('width', legendWidth);
      legendSVG.append("circle")
        .attr("cx", 0 + 5 * (legendWidth / 100))
        .attr("cy", 0 + 5 * (legendheight / 100))
        .attr("r", 6).style("fill", "purple");
      legendSVG.append("text")
        .attr("x", 20 + 5 * (legendWidth / 100))
        .attr("y", 0 + 5 * (legendheight / 100))
        .text(country).style("font-size", "15px")
        .attr("alignment-baseline", "middle");

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
        .attr("height", function (d) { return that.height - yScale(d.tfh); })
        .on('pointermove', (event, d) => mousemove(event, d))
        .on('pointerout', mouseleave);

      svg.append("g")
        .attr("transform", "translate(0," + this.height + ")")
        .call(d3.axisBottom(xScale));

      // add the y Axis
      svg.append("g")
        .call(d3.axisLeft(yScale));

      function mousemove(event: PointerEvent, d: any) {
        tooltip
          .style("position", "absolute")
          .style('z-index', 9999)
          .style('visibility', 'visible')
          .style('left', event.pageX + 20 + "px")
          .style('top', event.pageY + 20 + "px")
          .html('Start: ' + that.dateToStr(d.x0) + '<br>'
            + 'End: ' + that.dateToStr(d.x1) + '<br>'
            + country + ': ' + Math.round(d.tfh * 100) / 100);

      }
      function mouseleave() {
        if (tooltip) tooltip.style('visibility', 'hidden');
      }
    });
  }



  fillChart(start: Date, end: Date, countries: string[], bl?: [number, number], tr?: [number, number]) {
    this.showProgress();
    const that = this;
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
      this.hideProgress();
      console.log(data);
      //console.log(domain);
      const legendContainer = document.getElementById('legendContainer')!;
      const graphContainer = document.getElementById('graphContainer')!;
      const legendWidth = legendContainer.offsetWidth;
      const legendheight = legendContainer.offsetHeight;
      this.width = graphContainer.offsetWidth - this.margin.left - this.margin.right;
      this.height = graphContainer.offsetHeight - this.margin.top - this.margin.bottom;
      if (!d3.select('#chart').select('svg').empty()) d3.select('#chart').select('svg').remove(); //removes previous chart if it exists
      if (!d3.select('#chartLegend').selectAll('text').empty()) d3.select('#chartLegend').selectAll('text').remove();
      if (!d3.select('#chartLegend').selectAll('circle').empty()) d3.select('#chartLegend').selectAll('circle').remove();
      if (!d3.select('#chart').select('svg').selectAll('rect').empty()) d3.select('#chart').select('svg').selectAll('rect').remove();
      if (!d3.select('#chart').select('div').empty()) d3.select('#chart').select('div').remove();
      const svg = d3.select('#chart')
        .append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform",
          "translate(" + this.margin.left + "," + this.margin.top + ")");
      const tooltip = d3.select("#chart")
        .append('div')
        .style('visibility', 'hidden')
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");
      const tooltipLine = svg.append('line'); // search line for bisecting both value lines
      const tipBox = svg.append('rect')
        .attr('width', this.width)
        .attr('height', this.height)
        .attr('opacity', 0)
        .on('pointermove', (event) => mousemove(event))
        .on('pointerout', mouseleave);

      function mousemove(event: any) {
        let date = xScale.invert(event.offsetX - that.margin.left);
        date = new Date(that.dateToStr(date));

        tooltipLine.attr('stroke', 'black')
          .attr('x1', xScale(date))
          .attr('x2', xScale(date))
          .attr('y1', 0)
          .attr('y2', that.height)

        if (countries.length == 1) {
          let d1 = data[0].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          d1 = d1 == [] ? [0] : d1;
          tooltip
            .style("position", "absolute")
            .style('visibility', 'visible')
            .style('left', event.pageX + 20 + "px")
            .style('top', event.pageY + 20 + "px")
            .html('Date: ' + that.dateToStr(date) + '<br>'
              + countries[0] + ': ' + Math.round(d1.tfh * 100) / 100);
        } else if (countries.length == 2) {
          let d1 = data[0].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          let d2 = data[1].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          d1 = d1 == [] ? [0] : d1;
          d2 = d2 == [] ? [0] : d2;

          tooltip
            .style("position", "absolute")
            .style('visibility', 'visible')
            .style('left', event.pageX + 20 + "px")
            .style('top', event.pageY + 20 + "px")
            .html('Date: ' + that.dateToStr(date) + '<br>'
              + countries[0] + ': ' + Math.round(d1.tfh * 100) / 100 + '<br>'
              + countries[1] + ': ' + Math.round(d2.tfh * 100) / 100);
        } else if (countries.length == 3) {
          let d1 = data[0].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          let d2 = data[1].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          let d3 = data[2].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          d1 = d1 == [] ? [0] : d1;
          d2 = d2 == [] ? [0] : d2;
          d3 = d3 == [] ? [0] : d3;

          tooltip
            .style("position", "absolute")
            .style('visibility', 'visible')
            .style('left', event.pageX + 20 + "px")
            .style('top', event.pageY + 20 + "px")
            .html('Date: ' + that.dateToStr(date) + '<br>'
              + countries[0] + ': ' + Math.round(d1.tfh * 100) / 100 + '<br>'
              + countries[1] + ': ' + Math.round(d2.tfh * 100) / 100 + '<br>'
              + countries[2] + ': ' + Math.round(d3.tfh * 100) / 100);

        } else if (countries.length == 4) {
          let d1 = data[0].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          let d2 = data[1].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          let d3 = data[2].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          let d4 = data[3].find((e: cData) => new Date(e.date).getTime() == new Date(date).getTime()) ?? [];
          d1 = d1 == [] ? [0] : d1;
          d2 = d2 == [] ? [0] : d2;
          d3 = d3 == [] ? [0] : d3;
          d4 = d4 == [] ? [0] : d4;
          tooltip
            .style("position", "absolute")
            .style('visibility', 'visible')
            .style('left', event.pageX + 20 + "px")
            .style('top', event.pageY + 20 + "px")
            .html('Date: ' + that.dateToStr(date) + '<br>'
              + countries[0] + ': ' + Math.round(d1.tfh * 100) / 100 + '<br>'
              + countries[1] + ': ' + Math.round(d2.tfh * 100) / 100 + '<br>'
              + countries[2] + ': ' + Math.round(d3.tfh * 100) / 100 + '<br>'
              + countries[3] + ': ' + Math.round(d4.tfh * 100) / 100);
        }
      }

      function mouseleave() {
        if (tooltip) tooltip.style('visibility', 'hidden');
        if (tooltipLine) tooltipLine.attr('stroke', 'none');
      }

      const legendSVG = d3.select('#chartLegend')
        .attr('height', legendheight * 2 / 3)
        .attr('width', legendWidth);
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
      let yScale: any;
      if (this.lineScale == 'linear') {
        yScale = d3.scaleLinear()
      } else if (this.lineScale == 'sqrt') {
        yScale = d3.scaleSqrt();
      } else if (this.lineScale == 'log') {
        yScale = d3.scaleSymlog();
      }
      yScale
        .domain([0, tfhMax])
        .range([this.height, 0]);
      svg.append("g")
        .call(d3.axisLeft(yScale));

      const linef1: any = d3.line().x((d: any) => xScale(new Date(d.date))).y((d: any) => yScale(+d.tfh));

      if (data.length == 1) {
        const line1 = svg.append("path")
          .datum(data[0])
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("d", linef1);
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "steelblue");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 5 * (legendheight / 100))
          .text(countries[0]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
      } else if (data.length == 2) {
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
          .attr("d", linef1)
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "steelblue");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 5 * (legendheight / 100))
          .text(countries[0]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 4 * 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "orange");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 4 * 5 * (legendheight / 100))
          .text(countries[1]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
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
          .attr("d", linef1);
        const line3 = svg.append("path")
          .datum(data[2])
          .attr("fill", "none")
          .attr("stroke", "purple")
          .attr("stroke-width", 1.5)
          .attr("d", linef1);
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "steelblue");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 5 * (legendheight / 100))
          .text(countries[0]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 4 * 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "orange");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 4 * 5 * (legendheight / 100))
          .text(countries[2]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 8 * 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "purple");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 8 * 5 * (legendheight / 100))
          .text(countries[3]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
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
          .attr("d", linef1);
        const line3 = svg.append("path")
          .datum(data[2])
          .attr("fill", "none")
          .attr("stroke", "purple")
          .attr("stroke-width", 1.5)
          .attr("d", linef1);
        const line4 = svg.append("path")
          .datum(data[3])
          .attr("fill", "none")
          .attr("stroke", "green")
          .attr("stroke-width", 1.5)
          .attr("d", linef1);
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "steelblue");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 5 * (legendheight / 100))
          .text(countries[0]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 4.5 * 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "orange");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 4.5 * 5 * (legendheight / 100))
          .text(countries[1]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 8 * 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "purple");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 8 * 5 * (legendheight / 100))
          .text(countries[2]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
        legendSVG.append("circle")
          .attr("cx", 0 + 5 * (legendWidth / 100))
          .attr("cy", 0 + 11.5 * 5 * (legendheight / 100))
          .attr("r", 6).style("fill", "green");
        legendSVG.append("text")
          .attr("x", 20 + 5 * (legendWidth / 100))
          .attr("y", 0 + 11.5 * 5 * (legendheight / 100))
          .text(countries[3]).style("font-size", "15px")
          .attr("alignment-baseline", "middle");
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
      this.countryControl.disable();
      this.mCountries.enable();

    } else if (this.chart == 'bar') {
      this.countryControl.enable();
      this.mCountries.disable();
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

  showProgress() {
    let element = document.getElementById("chartProgress");
    if (element != null) {
      element.style.visibility = "visible";
    }
  }

  hideProgress() {
    let element = document.getElementById("chartProgress");
    if (element != null) {
      element.style.visibility = "hidden";
    }
  }
}
