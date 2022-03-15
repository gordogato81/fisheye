import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import { FormControl, FormGroup } from '@angular/forms';
import * as L from 'leaflet'
import * as d3 from 'd3';
import { Country, tmp } from '../interfaces';
import { ComparisonService } from '../service/comparison.service';
import { range } from 'd3';

import countryJson from '../../assets/json/countries.json';
import { map, Observable, startWith } from 'rxjs';

declare var renderQueue: any;

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.sass']
})
export class ComparisonComponent implements OnInit {

  constructor(private ds: APIService, private cs: ComparisonService) { }
  private navigation!: L.Map;
  private map1!: L.Map;
  private map2!: L.Map;
  private map3!: L.Map;
  private map4!: L.Map;
  private bl: [number, number] = [0, 0];
  private tr: [number, number] = [10, 10];
  private totalFishingMax = 5486.0071;
  minDate: Date = new Date('2017-01-01');
  maxDate: Date = new Date('2020-12-31');
  range1 = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  range2 = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  range3 = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  range4 = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  countryControl1 = new FormControl();
  options1: Country[] = countryJson;
  filteredOptions1!: Observable<Country[]>;
  countryControl2 = new FormControl();
  options2: Country[] = countryJson;
  filteredOptions2!: Observable<Country[]>;
  countryControl3 = new FormControl();
  options3: Country[] = countryJson;
  filteredOptions3!: Observable<Country[]>;
  countryControl4 = new FormControl();
  options4: Country[] = countryJson;
  filteredOptions4!: Observable<Country[]>;

  ngOnInit(): void {

    this.filteredOptions1 = this.countryControl1.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options1.slice())),
    );
    this.filteredOptions2 = this.countryControl2.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options1.slice())),
    );
    this.filteredOptions3 = this.countryControl3.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options1.slice())),
    );
    this.filteredOptions4 = this.countryControl4.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options1.slice())),
    );
    // Initialize all the maps
    this.navigation = L.map('navigation').setView([18, 0], 2.5);
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
    const mapOptions = { dragging: false, zoomControl: false, scrollWheelZoom: false, attributionControl: false}
    this.map1 = L.map('map1', mapOptions).setView([18, 0], 2.5);
    this.map2 = L.map('map2', mapOptions).setView([18, 0], 2.5);
    this.map3 = L.map('map3', mapOptions).setView([18, 0], 2.5);
    this.map4 = L.map('map4', mapOptions).setView([18, 0], 2.5);
    this.cs.setMap(this.map1, 1);
    this.cs.setMap(this.map2, 2);
    this.cs.setMap(this.map3, 3);
    this.cs.setMap(this.map4, 4);
    this.initMap(1);
    this.initMap(2);
    this.initMap(3);
    this.initMap(4);
    // Stop that's enough maps

    //getting inital bounds;
    const bounds = this.map1.getBounds();
    this.bl[0] = bounds.getSouth();
    this.bl[1] = bounds.getWest();
    this.tr[0] = bounds.getNorth();
    this.tr[1] = bounds.getEast();

    //setting initial time intervals
    this.range1.setValue({ start: '2020-01-01', end: '2020-03-31' });
    this.range2.setValue({ start: '2020-04-01', end: '2020-06-30' });
    this.range3.setValue({ start: '2020-07-01', end: '2020-09-30' });
    this.range4.setValue({ start: '2020-10-01', end: '2020-12-31' });

    this.getData1('2020-01-01', '2020-03-31', this.bl, this.tr);
    this.getData2('2020-04-01', '2020-06-30', this.bl, this.tr);
    this.getData3('2020-07-01', '2020-09-30', this.bl, this.tr);
    this.getData4('2020-10-01', '2020-12-31', this.bl, this.tr);

    // const button = <HTMLButtonElement>document.getElementById('updateButton');
    // button.click()
    this.navigation.on('moveend zoomend', () => {
      this.cs.setCenter(this.navigation.getCenter());
      this.cs.setZoom(this.navigation.getZoom());
    })

    
  }

  private _filter(name: string): Country[] {
    const filterValue = name.toLowerCase();

    return this.options1.filter(option => option.viewValue.toLowerCase().includes(filterValue));
  }

  clickUpdate() {
    const map1 = <L.Map>this.cs.getMap(1);
    const map2 = <L.Map>this.cs.getMap(2);
    const map3 = <L.Map>this.cs.getMap(3);
    const map4 = <L.Map>this.cs.getMap(4);
    const zoom = this.cs.getZoom()
    const center = this.cs.getCenter();
    map1.setView(center, zoom, { animate: true });
    map2.setView(center, zoom, { animate: true });
    map3.setView(center, zoom, { animate: true });
    map4.setView(center, zoom, { animate: true });
    const bounds = map1.getBounds();
    this.bl[0] = bounds.getSouth();
    this.bl[1] = bounds.getWest();
    this.tr[0] = bounds.getNorth();
    this.tr[1] = bounds.getEast();
    console.log(this.bl, this.tr);

    const start1 = new Date(Date.parse(this.range1.value.start));
    const end1 = new Date(Date.parse(this.range1.value.end));
    this.getData1(this.dateToStr(start1), this.dateToStr(end1), this.bl, this.tr);
    const start2 = new Date(Date.parse(this.range2.value.start));
    const end2 = new Date(Date.parse(this.range2.value.end));
    this.getData2(this.dateToStr(start2), this.dateToStr(end2), this.bl, this.tr);
    const start3 = new Date(Date.parse(this.range3.value.start));
    const end3 = new Date(Date.parse(this.range3.value.end));
    this.getData3(this.dateToStr(start3), this.dateToStr(end3), this.bl, this.tr);
    const start4 = new Date(Date.parse(this.range4.value.start));
    const end4 = new Date(Date.parse(this.range4.value.end));
    this.getData4(this.dateToStr(start4), this.dateToStr(end4), this.bl, this.tr);

  }

  initMap(num: number) {
    const map = <L.Map>this.cs.getMap(num);
    // 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {}).addTo(map);
    L.canvas().addTo(map);
    const canvas: any = d3.select(map.getPanes().overlayPane).select('canvas');
    const context = canvas.node().getContext('2d');
    this.cs.setCanvas(canvas, num);
    this.cs.setContext(context, num);
  }

  // onDateChange(event: any, id: number) {
  //   const map = <L.Map>this.cs.getMap(1);
  //   const bounds = map.getBounds();
  //   this.bl[0] = bounds.getSouth();
  //   this.bl[1] = bounds.getWest();
  //   this.tr[0] = bounds.getNorth();
  //   this.tr[1] = bounds.getEast();
  //   const render1 = this.cs.getRenderer(1);
  //   const render2 = this.cs.getRenderer(2);
  //   const render3 = this.cs.getRenderer(3);
  //   const render4 = this.cs.getRenderer(4);
  //   const data1 = this.cs.getData(1);
  //   const data2 = this.cs.getData(2);
  //   const data3 = this.cs.getData(3);
  //   const data4 = this.cs.getData(4);
  //   if (id == 1) {
  //     const start1 = new Date(Date.parse(this.range1.value.start));
  //     const end1 = new Date(Date.parse(this.range1.value.end));
  //     this.getData1(this.dateToStr(start1), this.dateToStr(end1), this.bl, this.tr);
  //     render2(data2);
  //     render3(data3);
  //     render4(data4);
  //   } else if (id == 2) {
  //     const start2 = new Date(Date.parse(this.range2.value.start));
  //     const end2 = new Date(Date.parse(this.range2.value.end));
  //     this.getData2(this.dateToStr(start2), this.dateToStr(end2), this.bl, this.tr);
  //     render1(data1);
  //     render3(data3);
  //     render4(data4);
  //   } else if (id == 3) {
  //     const start3 = new Date(Date.parse(this.range3.value.start));
  //     const end3 = new Date(Date.parse(this.range3.value.end));
  //     this.getData3(this.dateToStr(start3), this.dateToStr(end3), this.bl, this.tr);
  //     render1(data1);
  //     render2(data2);
  //     render4(data4);
  //   } else if (id == 4) {
  //     const start4 = new Date(Date.parse(this.range4.value.start));
  //     const end4 = new Date(Date.parse(this.range4.value.end));
  //     this.getData4(this.dateToStr(start4), this.dateToStr(end4), this.bl, this.tr);
  //     render1(data1);
  //     render2(data2);
  //     render3(data3);

  //   }
  // }

  getData1(start: string, end: string, bl: [number, number], tr: [number, number]) {
    const that = this;
    const id = 1;
    // let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    const country = this.countryControl1.value
    this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      this.cs.setRenderer(render, 1);
      // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      // console.log("max1: ", dMax);
      // this.cs.setMax(dMax, id);
      render(data);

      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        //const daMax = that.maxMax();
        // console.log("maxMax1: ", daMax);
        colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context.beginPath();
        context.fillStyle = colorMap(d.tfh);
        context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
        context.fill();
        context.closePath();
      }

      function clearContext() {
        context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
      }
    });
  }

  getData2(start: string, end: string, bl: [number, number], tr: [number, number]) {
    const that = this;
    const id = 2;
    // let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    const country = this.countryControl2.value;
    this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      this.cs.setRenderer(render, 2);
      // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      // console.log("max2: ", dMax);
      // this.cs.setMax(dMax, id);
      render(data);

      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        //const daMax = that.maxMax();
        // console.log("maxMax2: ", daMax);
        colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;

        context.beginPath();
        context.fillStyle = colorMap(d.tfh);
        context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
        context.fill();
        context.closePath();
      }

      function clearContext() {
        context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
      }
    })
  }

  getData3(start: string, end: string, bl: [number, number], tr: [number, number]) {
    const that = this;
    const id = 3;
    // let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    const country = this.countryControl3.value;
    this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      this.cs.setRenderer(render, 3);
      // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      // console.log("max3: ", dMax);
      // this.cs.setMax(dMax, id);

      render(data);

      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        //const daMax = that.maxMax();
        // console.log("maxMax3: ", daMax);
        colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;

        context.beginPath();
        context.fillStyle = colorMap(d.tfh);
        context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
        context.fill();
        context.closePath();
      }

      function clearContext() {
        context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
      }
    })
  }

  getData4(start: string, end: string, bl: [number, number], tr: [number, number]) {
    const that = this;
    const id = 4;
    // let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    const country = this.countryControl4.value;
    this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      this.cs.setRenderer(render, 4);
      // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      // console.log("max4: ", dMax);
      // this.cs.setMax(dMax, id);
      render(data);
      console.log(data);
      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        // const daMax = that.maxMax();
        // console.log("maxMax4: ", daMax);
        colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;

        context.beginPath();
        context.fillStyle = colorMap(d.tfh);
        context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
        context.fill();
        context.closePath();
      }

      function clearContext() {
        context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
      }
    });
  }

  // detSize(d: any, map: any) {
  //   const lat: number = parseFloat(d.lat);
  //   const lon: number = parseFloat(d.lon);
  //   const first = L.latLng(lat - 0.01, lon); // -0.01 Removes horizontal streak artifact
  //   const second = L.latLng(lat + 0.1, lon + 0.1);
  //   let diffX = Math.abs(map.latLngToContainerPoint(first).x - map.latLngToContainerPoint(second).x)
  //   let diffY = Math.abs(map.latLngToContainerPoint(first).y - map.latLngToContainerPoint(second).y)
  //   diffX = diffX < 1 ? 1 : diffX;
  //   diffY = diffY < 1 ? 1 : diffY;
  //   const size: [number, number] = [diffX, diffY];
  //   return size
  // }

  detSize(d: any, map: any) {
    const lat: number = parseFloat(d.lat);
    const lon: number = parseFloat(d.lon);
    const zoom = map.getZoom();
    let first, second;
    if (zoom == 2) {
      first = L.latLng(lat - 0.01, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 3) {
      first = L.latLng(lat - 0.03, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 4) {
      first = L.latLng(lat - 0.025, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 5) {
      first = L.latLng(lat - 0.017, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 6) {
      first = L.latLng(lat - 0.005, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 7) {
      first = L.latLng(lat - 0.002, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else {
      first = L.latLng(lat, lon); // -0.01 Removes horizontal streak artifact
      second = L.latLng(lat + 0.1, lon + 0.1);
    }

    let diffX = Math.abs(map.latLngToContainerPoint(first).x - map.latLngToContainerPoint(second).x);
    let diffY = Math.abs(map.latLngToContainerPoint(first).y - map.latLngToContainerPoint(second).y);
    diffX = diffX < 1 ? 1 : diffX;
    diffY = diffY < 1 ? 1 : diffY;
    const size: [number, number] = [diffX, diffY];
    return size
  }


  dateToStr(d: Date) {
    return d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2)
  }



  maxMax() {
    let maxes: number[] = [];
    let maxMax = 0;

    maxes.push(this.cs.getMax(1));
    maxes.push(this.cs.getMax(2));
    maxes.push(this.cs.getMax(3));
    maxes.push(this.cs.getMax(4));

    maxes.forEach(element => {
      if (element > maxMax) maxMax = element;
    });
    return maxMax;
  }
}