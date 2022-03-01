import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import * as L from 'leaflet'
import * as d3 from 'd3';
import { tmp } from '../interfaces';

declare var renderQueue: any;

@Component({
  selector: 'app-comparison',
  templateUrl: './comparison.component.html',
  styleUrls: ['./comparison.component.sass']
})
export class ComparisonComponent implements OnInit {

  constructor(private ds: APIService) { }
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

  ngOnInit(): void {
    const that = this;

    // Initialize all the maps
    this.navigation = L.map('navigation').setView([18, 0], 2.5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.navigation);

    this.map1 = L.map('map1', { dragging: false, zoomControl: false }).setView([18, 0], 2.5);
    this.map2 = L.map('map2', { dragging: false, zoomControl: false }).setView([18, 0], 2.5);
    this.map3 = L.map('map3', { dragging: false, zoomControl: false }).setView([18, 0], 2.5);
    this.map4 = L.map('map4', { dragging: false, zoomControl: false }).setView([18, 0], 2.5);

    this.initMap(this.map1);
    this.initMap(this.map2);
    this.initMap(this.map3);
    this.initMap(this.map4);
    // Stop that's enough maps

    // Attach the correct canvas to each context
    const canvas1: any = d3.select(this.map1.getPanes().overlayPane).select('canvas');
    const canvas2: any = d3.select(this.map2.getPanes().overlayPane).select('canvas');
    const canvas3: any = d3.select(this.map3.getPanes().overlayPane).select('canvas');
    const canvas4: any = d3.select(this.map4.getPanes().overlayPane).select('canvas');

    this.context1 = canvas1.node().getContext('2d');
    this.context2 = canvas2.node().getContext('2d');
    this.context3 = canvas3.node().getContext('2d');
    this.context4 = canvas4.node().getContext('2d');

    update(); // Forcing update to initalize values
    const render1 = new renderQueue(draw1).clear(clearContext1)
    const render2 = new renderQueue(draw2).clear(clearContext2)
    const render3 = new renderQueue(draw3).clear(clearContext3)
    const render4 = new renderQueue(draw4).clear(clearContext4)

    this.ds.getLcV('2020-01-01', '2020-03-31', this.bl, this.tr).subscribe(data => {
      this.max1 = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.data1 = data;
      this.init1 = true;
      render1(data);
    });

    this.ds.getLcV('2020-04-01', '2020-06-30', this.bl, this.tr).subscribe(data => {
      this.max2 = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.data2 = data;
      this.init2 = true;
      render2(data);
    });
    this.ds.getLcV('2020-07-01', '2020-09-30', this.bl, this.tr).subscribe(data => {
      this.max3 = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.data3 = data;
      this.init3 = true;
      render3(data);
    });
    this.ds.getLcV('2020-10-01', '2020-12-31', this.bl, this.tr).subscribe(data => {
      this.max4 = d3.max(data, (d: any) => +d.tfh) ?? 0;
      this.data4 = data;
      this.init4 = true;
      render4(data);
    });


    that.navigation.on('zoomend', update);
    that.navigation.on('moveend', update);

    function update() {
      const zoom = that.navigation.getZoom();
      const center = that.navigation.getCenter();
      const bounds = that.map1.getBounds();
      that.bl[0] = bounds.getSouth();
      that.bl[1] = bounds.getWest();
      that.tr[0] = bounds.getNorth();
      that.tr[1] = bounds.getEast();
      that.map1.setView(center).setZoom(zoom);
      that.map2.setView(center).setZoom(zoom);
      that.map3.setView(center).setZoom(zoom);
      that.map4.setView(center).setZoom(zoom);
      if (that.init1) render1(that.data1);
      if (that.init2) render2(that.data2);
      if (that.init3) render3(that.data3);
      if (that.init4) render4(that.data4);
    }
    function draw1(d: tmp) {
      let colorMap = d3.scaleSymlog<string, number>()
      colorMap.domain([0, that.max1]).range(["orange", "purple"])
      const newX = that.map1.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
      const newY = that.map1.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
      that.context1.fill();
      that.context1.beginPath();
      that.context1.fillStyle = colorMap(d.tfh);
      that.context1.rect(newX, newY, that.detSize(d, that.map1)[0], that.detSize(d, that.map1)[1]);
      that.context1.fill();
      that.context1.closePath();
    }

    function clearContext1() {
      that.context1.clearRect(0, 0, canvas1.attr("width"), canvas1.attr("height"));
    }

    function draw2(d: tmp) {
      let colorMap = d3.scaleSymlog<string, number>()
      colorMap.domain([0, that.max2]).range(["orange", "purple"])
      const newX = that.map2.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
      const newY = that.map2.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
      that.context2.fill();
      that.context2.beginPath();
      that.context2.fillStyle = colorMap(d.tfh);
      that.context2.rect(newX, newY, that.detSize(d, that.map2)[0], that.detSize(d, that.map2)[1]);
      that.context2.fill();
      that.context2.closePath();
    }

    function clearContext2() {
      that.context2.clearRect(0, 0, canvas2.attr("width"), canvas2.attr("height"));
    }

    function draw3(d: tmp) {
      let colorMap = d3.scaleSymlog<string, number>()
      colorMap.domain([0, that.max3]).range(["orange", "purple"])
      const newX = that.map3.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
      const newY = that.map3.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
      that.context3.fill();
      that.context3.beginPath();
      that.context3.fillStyle = colorMap(d.tfh);
      that.context3.rect(newX, newY, that.detSize(d, that.map3)[0], that.detSize(d, that.map3)[1]);
      that.context3.fill();
      that.context3.closePath();
    }

    function clearContext3() {
      that.context3.clearRect(0, 0, canvas3.attr("width"), canvas3.attr("height"));
    }

    function draw4(d: tmp) {
      let colorMap = d3.scaleSymlog<string, number>()
      colorMap.domain([0, that.max4]).range(["orange", "purple"])
      const newX = that.map4.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
      const newY = that.map4.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
      that.context4.fill();
      that.context4.beginPath();
      that.context4.fillStyle = colorMap(d.tfh);
      that.context4.rect(newX, newY, that.detSize(d, that.map4)[0], that.detSize(d, that.map4)[1]);
      that.context4.fill();
      that.context4.closePath();
    }

    function clearContext4() {
      that.context4.clearRect(0, 0, canvas4.attr("width"), canvas4.attr("height"));
    }

  }

  initMap(map: L.Map) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);

    L.canvas().addTo(map);
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
}
