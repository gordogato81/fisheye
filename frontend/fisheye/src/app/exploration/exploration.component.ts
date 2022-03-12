import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import * as L from 'leaflet';
import * as d3 from 'd3';
import { tmp, Country } from '../interfaces';
import { MatSliderChange } from '@angular/material/slider';
import { FormControl, FormGroup } from '@angular/forms';
import { ExplorationService } from '../service/exploration.service';
import { Options } from '@angular-slider/ngx-slider';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import midData from '../../assets/json/midNew.json'
import countryJson from '../../assets/json/countries.json'

declare var renderQueue: any;

@Component({
  selector: 'app-exploration',
  templateUrl: './exploration.component.html',
  styleUrls: ['./exploration.component.sass']
})
export class ExplorationComponent implements OnInit {

  constructor(
    private ds: APIService,
    public es: ExplorationService
  ) { }
  private map!: L.Map;
  private canvas: any;
  private r_data: any;
  private dMax: any;
  private render: any;
  private loaded: boolean = false;
  private context: any;
  private tooltip: any;
  private intervalLength: number = 5;
  sliderDisplay: any = (element: number) => { return this.dateToStr(this.valToDate(element)) };
  sliderMax: number = 1461; //3288 = 2012 - 2020
  sliderVal: number = 1;
  minDate: Date = new Date('2017-01-01');
  maxDate: Date = new Date('2020-12-31');
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });


  countryControl = new FormControl();
  options1: Country[] = countryJson;
  filteredOptions!: Observable<Country[]>;

  sliderForm = new FormGroup({
    sliderControl: new FormControl([20, 50])
  });
  public options: Options = {
    floor: 0,
    ceil: 365,
    step: 1,
    translate: (value: number): string => {
      return this.dateToStr(this.valToDate(value));
    }
  };

  ngOnInit(): void {
    const that = this;
    this.filteredOptions = this.countryControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options1.slice())),
    );

    const mapOptions = {
      worldCopyJump: true,
      // preferCanvas: true 
    };
    this.map = L.map('map', mapOptions).setView([18, 0], 2.5); // defaults to world view 

    const tilelayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    tilelayer.addTo(this.map);
    L.canvas().addTo(this.map);
    const bl = L.latLng(-90, -240);
    const tr = L.latLng(90, 240)
    this.map.setMaxBounds(L.latLngBounds(bl, tr))
    this.es.setMap(this.map);

    this.canvas = d3.select(this.map.getPanes().overlayPane).select('canvas');
    this.es.setCanvas(this.canvas);

    this.context = this.canvas.node().getContext('2d');
    this.es.setContext(this.context);

    this.tooltip = d3.select('#tooltip')
      .attr("class", "leaflet-interactive")
      .style('visibility', 'hidden')
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style('z-index', 1000000);

    // this.canvas
    //   .on("pointermove", function (event: any, d: any) { that.mousemove(event, d) })
    //   .on("pointerout", function (event: any, d: any) { that.mouseleave(d) });

    const start = "2020-03-01";
    const end = "2020-03-05";

    this.getData(start, end);
    this.es.setInterval(this.dateRangeToInterval(new Date(start), new Date(end)));
    this.sliderVal = this.dateToVal(new Date(start));
    this.range.setValue({ start: start, end: end });
    this.countryControl.setValue('World')

  }


  displayFn(country: Country): string {
    return country && country.viewValue ? country.viewValue : '';
  }

  private _filter(name: string): Country[] {
    const filterValue = name.toLowerCase();

    return this.options1.filter(option => option.viewValue.toLowerCase().includes(filterValue));
  }

  private getData(start: string, end: string) {
    const that = this;
    this.dMax = this.es.getDMax();
    this.map = this.es.getMap();
    const context = this.es.getContext()
    const canvas = this.es.getCanvas()
    const country = this.countryControl.value
    console.log(country);
    this.ds.getDateRangeVal(start, end, country).subscribe(data => {
      clearContext();
      this.r_data = data;
      this.es.setData(this.r_data);
      this.loaded = true;
      console.log(this.r_data);
      this.render = new renderQueue(draw).clear(clearContext);
      this.es.setRenderer(this.render);
      this.dMax = d3.max(this.r_data, (d: any) => +d.tfh) ?? 0;
      this.es.setDMax(this.dMax);
      this.render(this.r_data);
    });

    this.map.on('moveend zoomend', update);

    function draw(d: tmp) {
      let colorMap = d3.scaleSymlog<string, number>()
      colorMap.domain([0, that.dMax]).range(["orange", "purple"])
      let newX;
      const newY = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
      context.beginPath();
      context.fillStyle = colorMap(d.tfh);
      // if (d.lon < 0) {
      //   newX = that.map.latLngToLayerPoint(L.latLng(d.lat, (d.lon + 180))).x;
      //   context.rect(newX, newY, that.detSize(d)[0], that.detSize(d)[1]);
      // } else {

      // }
      newX = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
      context.rect(newX, newY, that.detSize(d)[0], that.detSize(d)[1]);
      context.fill();
      context.closePath();
      // const extendWest = 60; // width extension in longitude
      // if (d.lon < (-180 + extendWest)) { // extending towards the west
      //   const extX = that.map.latLngToLayerPoint(L.latLng(d.lat, (d.lon + 360))).x;
      //   context.beginPath();
      //   context.fillStyle = colorMap(d.tfh);
      //   context.rect(extX, newY, that.detSize(d)[0], that.detSize(d)[1]);
      //   context.fill();
      //   context.closePath();
      // } else if (d.lon > (180 - extendWest)) { // extending towards the east
      //   const extX = that.map.latLngToLayerPoint(L.latLng(d.lat, (-360 + d.lon))).x;
      //   context.beginPath();
      //   context.fillStyle = colorMap(d.tfh);
      //   context.rect(extX, newY, that.detSize(d)[0], that.detSize(d)[1]);
      //   context.fill();
      //   context.closePath();
      // }
    }

    function clearContext() {
      context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
    }

    function update() {
      if (that.loaded) {
        that.render(that.r_data);
      }
    }
  }


  onDateChange(event: any) {
    const start = new Date(Date.parse(this.range.value.start));
    const end = new Date(Date.parse(this.range.value.end));
    this.sliderVal = this.dateToVal(start);
    this.intervalLength = this.dateRangeToInterval(start, end);
    this.getData(this.dateToStr(start), this.dateToStr(end));
    const render = this.es.getRenderer()
    const data = this.es.getData()
    render(data);

  }

  onInputChange(event: MatSliderChange) {
    const that = this;
    this.sliderVal = event.value ?? 0;
    const start = this.valToDate(this.sliderVal);
    const end = this.intervalToEndDate(start);
    this.range.setValue({ start: start, end: end });
    this.getData(this.dateToStr(start), this.dateToStr(end));
  }

  onCountryChange(event: any) {
    const start = new Date(Date.parse(this.range.value.start));
    const end = new Date(Date.parse(this.range.value.end));
    this.sliderVal = this.dateToVal(start);
    this.intervalLength = this.dateRangeToInterval(start, end);
    this.getData(this.dateToStr(start), this.dateToStr(end));
  }

  dateToStr(d: Date) {
    return d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2)
  }

  valToDate(value: number) {
    const max_date = new Date(this.maxDate);
    const new_val = this.sliderMax - value; // determines the difference in the number of days between the selected value and the max value
    const new_milli = max_date.valueOf() - (new_val * 1000 * 60 * 60 * 24); // converts the number of days into milliseconds and subtracts from the latest day in milliseconds
    const new_date = new Date(new_milli);
    return new_date;
  }

  dateToVal(date: Date) {
    const min_date = new Date(this.minDate);
    return this.dateRangeToInterval(min_date, date);
  }

  intervalToEndDate(start: Date) {
    let date = new Date(start);
    date.setDate(date.getDate() + this.intervalLength);
    return date;
  }

  dateRangeToInterval(start: Date, end: Date) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    return Math.round(Math.abs((start.valueOf() - end.valueOf()) / oneDay));
  }

  detSize(d: any) {
    this.map = this.es.getMap();
    const lat: number = parseFloat(d.lat);
    const lon: number = parseFloat(d.lon);
    let first, second;
    if (this.map.getZoom() <= 6) {
      first = L.latLng(lat - 0.01, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (this.map.getZoom() == 7, 8) {
      first = L.latLng(lat - 0.005, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else {
      first = L.latLng(lat, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    }

    let diffX = Math.abs(this.map.latLngToContainerPoint(first).x - this.map.latLngToContainerPoint(second).x);
    let diffY = Math.abs(this.map.latLngToContainerPoint(first).y - this.map.latLngToContainerPoint(second).y);
    diffX = diffX < 1 ? 1 : diffX;
    diffY = diffY < 1 ? 1 : diffY;
    const size: [number, number] = [diffX, diffY];
    return size
  }

  // mousemove(event: any, d: any) {
  //   console.log(d);
  //   // const c_val = this.getDataVal(d, country_data, this.choroProperty) ?? 0;
  //   // const b_val = this.getDataVal(d, country_data, this.bubbleProperty) ?? 0;
  //   // this.tooltip
  //   //   .html(d.properties.NAME + '<br>'
  //   //     + this.betterNames(this.choroProperty) + ': ' + Math.round(c_val * 100) / 100 + '<br>'
  //   //     + this.betterNames(this.bubbleProperty) + ': ' + Math.round(b_val * 100) / 100)
  //   //   .style('visibility', 'visible')
  //   //   .style('left', (event.pageX + 5) + 'px')
  //   //   .style('top', (event.pageY + 5) + 'px');

  // }

  // mouseleave(d: any) {
  //   this.tooltip
  //     .style('visibility', 'hidden');
  // }
}



