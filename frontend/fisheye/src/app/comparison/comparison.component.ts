import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import { FormControl, FormGroup } from '@angular/forms';
import * as L from 'leaflet'
import * as d3 from 'd3';
import { tmp } from '../interfaces';
import { ComparisonService } from '../service/comparison.service';
import { range } from 'd3';

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
  private context1: any;
  private context2: any;
  private context3: any;
  private context4: any;
  private max1: number = 0;
  private max2: number = 0;
  private max3: number = 0;
  private max4: number = 0;
  private data1: any;
  private data2: any;
  private data3: any;
  private data4: any;
  private bl: [number, number] = [0, 0];
  private tr: [number, number] = [10, 10];
  private init1: boolean = false;
  private init2: boolean = false;
  private init3: boolean = false;
  private init4: boolean = false;
  minDate: Date = new Date('2020-01-01');
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

  ngOnInit(): void {
    // Initialize all the maps
    this.navigation = L.map('navigation').setView([18, 0], 2.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.navigation);
    const mapOptions = { dragging: false, zoomControl: false }
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

    const button = <HTMLButtonElement>document.getElementById('updateButton');
    button.click()
  }

  update() {
    const navigation = <L.Map>this.cs.getMap(0);
    const map = <L.Map>this.cs.getMap(1);
    const zoom = navigation.getZoom();
    const center = navigation.getCenter();
    const bounds = map.getBounds();
    this.bl[0] = bounds.getSouth();
    this.bl[1] = bounds.getWest();
    this.tr[0] = bounds.getNorth();
    this.tr[1] = bounds.getEast();
    this.map1.panTo(center).setZoom(zoom);
    this.map2.panTo(center).setZoom(zoom);
    this.map3.panTo(center).setZoom(zoom);
    this.map4.panTo(center).setZoom(zoom);

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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);
    L.canvas().addTo(map);
    const canvas: any = d3.select(map.getPanes().overlayPane).select('canvas');
    const context = canvas.node().getContext('2d');
    this.cs.setCanvas(canvas, num);
    this.cs.setContext(context, num);
  }

  getData1(start: string, end: string, bl: [number, number], tr: [number, number]) {
    const that = this;
    const id = 1;
    let d: any;
    let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    this.ds.getLcV(start, end, bl, tr).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.cs.setMax(dMax, id);
      render(data);

      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        const daMax = that.maxMax();
        colorMap.domain([0, daMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context.fill();
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
    let d: any;
    let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    this.ds.getLcV(start, end, bl, tr).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.cs.setMax(dMax, id);
      render(data);
      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        const daMax = that.maxMax();
        colorMap.domain([0, daMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context.fill();
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
    let d: any;
    let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    this.ds.getLcV(start, end, bl, tr).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.cs.setMax(dMax, id);

      render(data);

      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        const daMax = that.maxMax();
        colorMap.domain([0, daMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context.fill();
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
    let dMax: number;
    const map = <L.Map>this.cs.getMap(id);
    const context = this.cs.getContext(id);
    const canvas = this.cs.getCanvas(id);
    this.ds.getLcV(start, end, bl, tr).subscribe(data => {
      this.cs.setData(data, id);
      this.cs.setLoaded(id);
      const render = new renderQueue(draw).clear(clearContext);
      dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.cs.setMax(dMax, id);
      render(data);
      function draw(d: tmp) {
        let colorMap = d3.scaleSymlog<string, number>();
        const daMax = that.maxMax();
        colorMap.domain([0, daMax]).range(["orange", "purple"]);
        const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context.fill();
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

  detSize(d: any, map: any) {
    const lat: number = parseFloat(d.lat);
    const lon: number = parseFloat(d.lon);
    const first = L.latLng(lat - 0.01, lon); // -0.01 Removes horizontal streak artifact
    const second = L.latLng(lat + 0.1, lon + 0.1);
    let diffX = Math.abs(map.latLngToContainerPoint(first).x - map.latLngToContainerPoint(second).x)
    let diffY = Math.abs(map.latLngToContainerPoint(first).y - map.latLngToContainerPoint(second).y)
    diffX = diffX < 1 ? 1 : diffX;
    diffY = diffY < 1 ? 1 : diffY;
    const size: [number, number] = [diffX, diffY];
    return size
  }

  dateToStr(d: Date) {
    return d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2)
  }

  onDateChange(event: any, id: number) {
    const map = <L.Map>this.cs.getMap(1);
    const bounds = map.getBounds();
    this.bl[0] = bounds.getSouth();
    this.bl[1] = bounds.getWest();
    this.tr[0] = bounds.getNorth();
    this.tr[1] = bounds.getEast();

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