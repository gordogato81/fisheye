import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import { FormControl, FormGroup } from '@angular/forms';
import * as L from 'leaflet'
import * as d3 from 'd3';
import { Country, tmp } from '../interfaces';
import { ComparisonService } from '../service/comparison.service';
import { range } from 'd3';

import countryJson from '../../assets/json/countries.json';
import { forkJoin, map, Observable, startWith } from 'rxjs';

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
  private legend: any;
  private min_color = 'orange';
  private max_color = 'purple';
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

    this.showProgress1();
    this.showProgress2();
    this.showProgress3();
    this.showProgress4();

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
    const mapOptions = { dragging: false, zoomControl: false, scrollWheelZoom: false, attributionControl: false }
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

    this.getData(this.bl, this.tr);

    this.legend = d3.select('#clegend')
      .attr('height', 360)
      .attr('width', 70);

    this.navigation.on('moveend zoomend', () => {
      // console.log("Pixel Origin: ", this.navigation.getPixelOrigin())
      // const bounds = document.querySelector("#compBorder")!.getBoundingClientRect();
      // const bl1 = L.point(bounds.left, bounds.bottom)
      // const tr1 = L.point(bounds.right, bounds.top)
      // const bl = this.navigation.layerPointToLatLng(bl1);
      // const tr = this.navigation.layerPointToLatLng(tr1);
      // const navBounds = this.navigation.getBounds();
      // bl.lng = navBounds.getWest();
      // tr.lng = navBounds.getEast();
      // bl.lat = navBounds.getSouth();
      // tr.lat = navBounds.getNorth();
      // this.cs.setBlTr([bl.lat, bl.lng], [tr.lat, tr.lng]);
      this.cs.setCenter(this.navigation.getCenter());
      this.cs.setZoom(this.navigation.getZoom());
    });
    // const para = document.getElementById('con')!;

    // para.addEventListener('mousemove', (event) => {
    //   console.log(event.pageX, event.pageY);
    // });


  }

  showProgress1() {
    let element = document.getElementById("progress1");
    if (element != null) {
      element.style.visibility = "visible";
    }
  }
  showProgress2() {
    let element = document.getElementById("progress2");
    if (element != null) {
      element.style.visibility = "visible";
    }
  }

  showProgress3() {
    let element = document.getElementById("progress3");
    if (element != null) {
      element.style.visibility = "visible";
    }
  }

  showProgress4() {
    let element = document.getElementById("progress4");
    if (element != null) {
      element.style.visibility = "visible";
    }
  }

  hideProgress1() {
    let element = document.getElementById("progress1");
    if (element != null) {
      element.style.visibility = "hidden";
    }
  }

  hideProgress2() {
    let element = document.getElementById("progress2");
    if (element != null) {
      element.style.visibility = "hidden";
    }
  }

  hideProgress3() {
    let element = document.getElementById("progress3");
    if (element != null) {
      element.style.visibility = "hidden";
    }
  }

  hideProgress4() {
    let element = document.getElementById("progress4");
    if (element != null) {
      element.style.visibility = "hidden";
    }
  }

  private _filter(name: string): Country[] {
    const filterValue = name.toLowerCase();

    return this.options1.filter(option => option.viewValue.toLowerCase().includes(filterValue));
  }

  clickUpdate() {
    this.showProgress1();
    this.showProgress2();
    this.showProgress3();
    this.showProgress4();
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

    // this.bl = this.cs.getBl();
    // this.tr = this.cs.getTr();
    console.log(this.bl, this.tr);
    this.getData(this.bl, this.tr);
  }

  initMap(num: number) {
    const map = <L.Map>this.cs.getMap(num);
    // 
    //'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png'
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);
    L.canvas().addTo(map);
    const canvas: any = d3.select(map.getPanes().overlayPane).select('canvas');
    const context = canvas.node().getContext('2d');
    this.cs.setCanvas(canvas, num);
    this.cs.setContext(context, num);
  }

  getData(bl: [number, number], tr: [number, number]) {
    const that = this;
    const map1 = <L.Map>this.cs.getMap(1);
    const map2 = <L.Map>this.cs.getMap(2);
    const map3 = <L.Map>this.cs.getMap(3);
    const map4 = <L.Map>this.cs.getMap(4);
    const context1 = this.cs.getContext(1);
    const context2 = this.cs.getContext(2);
    const context3 = this.cs.getContext(3);
    const context4 = this.cs.getContext(4);
    const canvas1 = this.cs.getCanvas(1);
    const canvas2 = this.cs.getCanvas(2);
    const canvas3 = this.cs.getCanvas(3);
    const canvas4 = this.cs.getCanvas(4);
    const country1 = this.countryControl1.value
    const country2 = this.countryControl2.value
    const country3 = this.countryControl3.value
    const country4 = this.countryControl4.value
    const start1 = new Date(Date.parse(this.range1.value.start));
    const start2 = new Date(Date.parse(this.range2.value.start));
    const start3 = new Date(Date.parse(this.range3.value.start));
    const start4 = new Date(Date.parse(this.range4.value.start));
    const end1 = new Date(Date.parse(this.range1.value.end));
    const end2 = new Date(Date.parse(this.range2.value.end));
    const end3 = new Date(Date.parse(this.range3.value.end));
    const end4 = new Date(Date.parse(this.range4.value.end));

    const data1$ = this.ds.getLcV(this.dateToStr(start1), this.dateToStr(end1), bl, tr, country1);
    const data2$ = this.ds.getLcV(this.dateToStr(start2), this.dateToStr(end2), bl, tr, country2);
    const data3$ = this.ds.getLcV(this.dateToStr(start3), this.dateToStr(end3), bl, tr, country3);
    const data4$ = this.ds.getLcV(this.dateToStr(start4), this.dateToStr(end4), bl, tr, country4);
    let max1: number;
    let max2: number;
    let max3: number;
    let max4: number;
    let colorMap = d3.scaleSymlog<string, number>();

    const values$ = forkJoin([data1$, data2$, data3$, data4$]).subscribe((data) => {
      // >>> removing previously rendered items >>>
      if (!this.legend.selectAll('rect').empty()) this.legend.selectAll('rect').remove();
      if (!this.legend.selectAll('g').empty()) this.legend.selectAll('g').remove();
      if (!this.legend.selectAll('text').empty()) this.legend.selectAll('text').remove();
      if (!this.legend.selectAll('defs').empty()) this.legend.selectAll('defs').remove();

      clearContext1();
      clearContext2();
      clearContext3();
      clearContext4();
      this.hideProgress1();
      this.hideProgress2();
      this.hideProgress3();
      this.hideProgress4();
      // <<< removing previously rendered items <<<

      const render1 = new renderQueue(draw1).clear(clearContext1);
      const render2 = new renderQueue(draw2).clear(clearContext2);
      const render3 = new renderQueue(draw3).clear(clearContext3);
      const render4 = new renderQueue(draw4).clear(clearContext4);

      // >>> determining the total max >>>
      max1 = d3.max(data[0], (d: any) => +d.tfh) ?? 0;
      max2 = d3.max(data[1], (d: any) => +d.tfh) ?? 0;
      max3 = d3.max(data[2], (d: any) => +d.tfh) ?? 0;
      max4 = d3.max(data[3], (d: any) => +d.tfh) ?? 0;
      this.totalFishingMax = d3.max([max1, max2, max3, max4], (d: any) => +d) ?? 0;
      colorMap.domain([0, this.totalFishingMax]).range(["orange", "purple"]);
      // <<< determining the total max <<<

      render1(data[0]);
      render2(data[1]);
      render3(data[2]);
      render4(data[3]);

      const legendheight = 350;
      const legendwidth = 15;

      // >>> creating new legend >>>
      let colorScale = d3.scaleSymlog();
      colorScale.domain([0, this.totalFishingMax]).range([0, legendheight])
      const coloraxis = d3.axisLeft(colorScale).ticks(5);
      this.legend.append("defs")
        .append('linearGradient')
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%") // horizontal gradient
        .attr("y2", "100%") // vertical gradient
        .selectAll('stop')
        .data([{ offset: "0%", color: this.min_color },
        { offset: "100%", color: this.max_color }])
        .join("stop")
        .attr("offset", (d: any) => d.offset)
        .attr("stop-color", (d: any) => d.color)

      const rect = this.legend
        .append("rect")
        .attr("x", 50)
        .attr("y", 5)
        .attr("width", legendwidth)
        .attr("height", legendheight)
        .style("fill", "url(#gradient)");

      this.legend.append('g')
        .attr("class", "x axis")
        .attr("transform", "translate(50, 5)")
        .call(coloraxis);

      this.legend.append('text')
        .attr('x', 5)
        .attr('y', -10)
        .attr("transform", "rotate(90)")
        .text('Apparent Fishing Activity in Hours');
      // <<< creating new legend <<<

      // >>> canvas rendering functions >>>
      function draw1(d: tmp) {
        const newX = map1.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map1.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context1.beginPath();
        context1.fillStyle = colorMap(d.tfh);
        context1.rect(newX, newY, that.detSize(d, map1)[0], that.detSize(d, map1)[1]);
        context1.fill();
        context1.closePath();
      }

      function clearContext1() {
        context1.clearRect(0, 0, canvas1.attr("width"), canvas1.attr("height"));
      }

      function draw2(d: tmp) {
        const newX = map2.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map2.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context2.beginPath();
        context2.fillStyle = colorMap(d.tfh);
        context2.rect(newX, newY, that.detSize(d, map2)[0], that.detSize(d, map2)[1]);
        context2.fill();
        context2.closePath();
      }

      function clearContext2() {
        context2.clearRect(0, 0, canvas2.attr("width"), canvas2.attr("height"));
      }

      function draw3(d: tmp) {
        const newX = map3.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map3.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context3.beginPath();
        context3.fillStyle = colorMap(d.tfh);
        context3.rect(newX, newY, that.detSize(d, map3)[0], that.detSize(d, map3)[1]);
        context3.fill();
        context3.closePath();
      }

      function clearContext3() {
        context3.clearRect(0, 0, canvas3.attr("width"), canvas3.attr("height"));
      }

      function draw4(d: tmp) {
        const newX = map4.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = map4.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context4.beginPath();
        context4.fillStyle = colorMap(d.tfh);
        context4.rect(newX, newY, that.detSize(d, map4)[0], that.detSize(d, map4)[1]);
        context4.fill();
        context4.closePath();
      }

      function clearContext4() {
        context4.clearRect(0, 0, canvas4.attr("width"), canvas4.attr("height"));
      }
      // <<< canvas rendering functions <<<
    });
  }

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

  // getData1(start: string, end: string, bl: [number, number], tr: [number, number]) {
  //   const that = this;
  //   const id = 1;
  //   // let dMax: number;
  //   const map = <L.Map>this.cs.getMap(id);
  //   const context = this.cs.getContext(id);
  //   const canvas = this.cs.getCanvas(id);
  //   const country = this.countryControl1.value
  //   this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
  //     this.hideProgress1();
  //     this.cs.setData(data, id);
  //     this.cs.setLoaded(id);
  //     const render = new renderQueue(draw).clear(clearContext);
  //     this.cs.setRenderer(render, 1);
  //     // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
  //     // console.log("max1: ", dMax);
  //     // this.cs.setMax(dMax, id);
  //     render(data);

  //     function draw(d: tmp) {
  //       let colorMap = d3.scaleSymlog<string, number>();
  //       //const daMax = that.maxMax();
  //       // console.log("maxMax1: ", daMax);
  //       colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
  //       const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
  //       const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
  //       context.beginPath();
  //       context.fillStyle = colorMap(d.tfh);
  //       context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
  //       context.fill();
  //       context.closePath();
  //     }

  //     function clearContext() {
  //       context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
  //     }
  //   });
  // }

  // getData2(start: string, end: string, bl: [number, number], tr: [number, number]) {
  //   const that = this;
  //   const id = 2;
  //   // let dMax: number;
  //   const map = <L.Map>this.cs.getMap(id);
  //   const context = this.cs.getContext(id);
  //   const canvas = this.cs.getCanvas(id);
  //   const country = this.countryControl2.value;
  //   this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
  //     this.hideProgress2();
  //     this.cs.setData(data, id);
  //     this.cs.setLoaded(id);
  //     const render = new renderQueue(draw).clear(clearContext);
  //     this.cs.setRenderer(render, 2);
  //     // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
  //     // console.log("max2: ", dMax);
  //     // this.cs.setMax(dMax, id);
  //     render(data);

  //     function draw(d: tmp) {
  //       let colorMap = d3.scaleSymlog<string, number>();
  //       //const daMax = that.maxMax();
  //       // console.log("maxMax2: ", daMax);
  //       colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
  //       const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
  //       const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;

  //       context.beginPath();
  //       context.fillStyle = colorMap(d.tfh);
  //       context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
  //       context.fill();
  //       context.closePath();
  //     }

  //     function clearContext() {
  //       context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
  //     }
  //   })
  // }

  // getData3(start: string, end: string, bl: [number, number], tr: [number, number]) {
  //   const that = this;
  //   const id = 3;
  //   // let dMax: number;
  //   const map = <L.Map>this.cs.getMap(id);
  //   const context = this.cs.getContext(id);
  //   const canvas = this.cs.getCanvas(id);
  //   const country = this.countryControl3.value;
  //   this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
  //     this.hideProgress3();
  //     this.cs.setData(data, id);
  //     this.cs.setLoaded(id);
  //     const render = new renderQueue(draw).clear(clearContext);
  //     this.cs.setRenderer(render, 3);
  //     // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
  //     // console.log("max3: ", dMax);
  //     // this.cs.setMax(dMax, id);

  //     render(data);

  //     function draw(d: tmp) {
  //       let colorMap = d3.scaleSymlog<string, number>();
  //       //const daMax = that.maxMax();
  //       // console.log("maxMax3: ", daMax);
  //       colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
  //       const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
  //       const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;

  //       context.beginPath();
  //       context.fillStyle = colorMap(d.tfh);
  //       context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
  //       context.fill();
  //       context.closePath();
  //     }

  //     function clearContext() {
  //       context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
  //     }
  //   })
  // }

  // getData4(start: string, end: string, bl: [number, number], tr: [number, number]) {
  //   const that = this;
  //   const id = 4;
  //   // let dMax: number;
  //   const map = <L.Map>this.cs.getMap(id);
  //   const context = this.cs.getContext(id);
  //   const canvas = this.cs.getCanvas(id);
  //   const country = this.countryControl4.value;
  //   this.ds.getLcV(start, end, bl, tr, country).subscribe(data => {
  //     this.hideProgress4();
  //     this.cs.setData(data, id);
  //     this.cs.setLoaded(id);
  //     const render = new renderQueue(draw).clear(clearContext);
  //     this.cs.setRenderer(render, 4);
  //     // dMax = d3.max(data, (d: any) => +d.tfh) ?? 0;
  //     // console.log("max4: ", dMax);
  //     // this.cs.setMax(dMax, id);
  //     render(data);
  //     // console.log(data);
  //     function draw(d: tmp) {
  //       let colorMap = d3.scaleSymlog<string, number>();
  //       // const daMax = that.maxMax();
  //       // console.log("maxMax4: ", daMax);
  //       colorMap.domain([0, that.totalFishingMax]).range(["orange", "purple"]);
  //       const newX = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
  //       const newY = map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;

  //       context.beginPath();
  //       context.fillStyle = colorMap(d.tfh);
  //       context.rect(newX, newY, that.detSize(d, map)[0], that.detSize(d, map)[1]);
  //       context.fill();
  //       context.closePath();
  //     }

  //     function clearContext() {
  //       context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
  //     }
  //   });
  // }
}