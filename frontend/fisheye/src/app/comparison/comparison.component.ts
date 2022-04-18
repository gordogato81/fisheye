import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import { FormControl, FormGroup } from '@angular/forms';
import * as L from 'leaflet'
import * as d3 from 'd3';
import { Country, tmp } from '../interfaces';
import { ComparisonService } from '../service/comparison.service';
import { range } from 'd3';

import countryJson from '../../assets/json/countries.json';
import { forkJoin, map, Observable, startWith, Subscription } from 'rxjs';

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
  private tooltip1: any;
  private tooltip2: any;
  private tooltip3: any;
  private tooltip4: any;
  private faoSVG1: any;
  private faoSVG2: any;
  private faoSVG3: any;
  private faoSVG4: any;
  private bl: [number, number] = [0, 0];
  private tr: [number, number] = [10, 10];
  private totalFishingMax = 5486.0071;
  private legend: any;
  private min_color = 'orange';
  private max_color = 'purple';
  private faoURL = 'https://www.fao.org/fishery/geoserver/fifao/ows?service=WFS&request=GetFeature&version=1.0.0&typeName=fifao:FAO_AREAS_CWP&outputFormat=json';
  subs: Subscription = new Subscription();
  mapsScale: string = 'log'
  minDate: Date = new Date('2017-01-01');
  maxDate: Date = new Date('2020-12-31');
  faoChecked = false;
  faoDisabled = true;
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
    const that = this;
    this.showProgress1();
    this.showProgress2();
    this.showProgress3();
    this.showProgress4();

    //Filter for the autocomplete input
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

    const mapOptions = { dragging: false, zoomControl: false, scrollWheelZoom: false, doubleClickZoom: false, attributionControl: false }
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

    // Acquiring geojson from FAO API
    d3.json(this.faoURL).then((data: any) => {
      this.faoDisabled = false;
      this.cs.setJson(data, 1);
    });

    //getting inital bounds;
    const bounds = this.map1.getBounds();
    this.bl[0] = bounds.getSouth();
    this.bl[1] = bounds.getWest();
    this.tr[0] = bounds.getNorth();
    this.tr[1] = bounds.getEast();

    //setting initial time intervals
    this.range1.setValue({ start: '2017-01-01', end: '2020-01-31' });
    this.range2.setValue({ start: '2018-01-01', end: '2020-01-31' });
    this.range3.setValue({ start: '2019-01-01', end: '2020-01-31' });
    this.range4.setValue({ start: '2020-01-01', end: '2020-01-31' });

    // initially filling maps with data
    this.getData(this.bl, this.tr);

    // initallizing tool tips for each map
    this.tooltip1 = d3.select('#tooltip1')
      .attr("class", "leaflet-interactive")
      .style('visibility', 'hidden')
      .style('position', 'absolute')
      .style('opacity', 0.7)
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style('z-index', 9999);
    this.tooltip2 = d3.select('#tooltip2')
      .attr("class", "leaflet-interactive")
      .style('visibility', 'hidden')
      .style('position', 'absolute')
      .style('opacity', 0.7)
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style('z-index', 9999);
    this.tooltip3 = d3.select('#tooltip3')
      .attr("class", "leaflet-interactive")
      .style('visibility', 'hidden')
      .style('position', 'absolute')
      .style('opacity', 0.7)
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style('z-index', 9999);
    this.tooltip4 = d3.select('#tooltip4')
      .attr("class", "leaflet-interactive")
      .style('visibility', 'hidden')
      .style('position', 'absolute')
      .style('opacity', 0.7)
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style('z-index', 9999);
    this.legend = d3.select('#clegend')
      .attr('height', 360)
      .attr('width', 70);

    // collecting/setting navigation map projection info to rely to the raster maps upon updating the visualization.
    this.navigation.on('moveend zoomend', () => {
      let bl: L.LatLng = L.latLng(0, 0),
        tr: L.LatLng = L.latLng(0, 0);
      const navBounds = this.navigation.getBounds();
      const pixelBounds = this.navigation.getPixelBounds();
      const bl1 = L.point(pixelBounds.getBottomLeft().x, (pixelBounds.getBottomLeft().y - 217)); // 217 is a hardcoded value based on the hard coded height of each container. 
      const tr1 = L.point(pixelBounds.getTopRight().x, (pixelBounds.getTopRight().y + 217)); // A dynamic solution was not found that was accurate enough to appropriately identify the lat lon position of the border container.
      bl = this.navigation.unproject(bl1); // converting point to latlng layer point
      tr = this.navigation.unproject(tr1);
      bl.lng = this.truncate(navBounds.getWest()); // truncating to 1 decimal place
      tr.lng = this.truncate(navBounds.getEast());
      bl.lat = this.truncate(bl.lat);
      tr.lat = this.truncate(tr.lat);
      this.cs.setBlTr([bl.lat, bl.lng], [tr.lat, tr.lng]);
      this.cs.setCenter(this.navigation.getCenter());
      this.cs.setZoom(this.navigation.getZoom());
    });


  }

  truncate(x: number) {
    if (x < 0) {
      x = Math.ceil((x - 0.1) * 10) / 10;
    } else if (x >= 0) {
      x = Math.floor(x * 10) / 10;
    }
    return x
  }



  private _filter(name: string): Country[] {
    const filterValue = name.toLowerCase();

    return this.options1.filter(option => option.viewValue.toLowerCase().includes(filterValue));
  }

  // fires when "Update Visualization button is clicked"
  clickUpdate() {
    // unhides the progress bars for each map
    this.showProgress1();
    this.showProgress2();
    this.showProgress3();
    this.showProgress4();
    this.map1 = <L.Map>this.cs.getMap(1);
    this.map2 = <L.Map>this.cs.getMap(2);
    this.map3 = <L.Map>this.cs.getMap(3);
    this.map4 = <L.Map>this.cs.getMap(4);
    const zoom = this.cs.getZoom()
    const center = this.cs.getCenter();

    // set the view of the raster maps to fit that of the navigation
    this.map1.setView(center, zoom, { animate: false });
    this.map2.setView(center, zoom, { animate: false });
    this.map3.setView(center, zoom, { animate: false });
    this.map4.setView(center, zoom, { animate: false });

    // retrieving the location of the bottom left and top right corner of the border element
    this.bl = this.cs.getBl();
    this.tr = this.cs.getTr();
    // getting and displaying the data
    this.getData(this.bl, this.tr);
  }

  // initializes each raster map by adding a tile layer and a canvas
  initMap(num: number) {
    const map = <L.Map>this.cs.getMap(num);
    // 
    //'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png'
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map);
    L.canvas().addTo(map);
    L.svg().addTo(map);
    const canvas: any = d3.select(map.getPanes().overlayPane).select('canvas');
    const context = canvas.node().getContext('2d');
    this.cs.setCanvas(canvas, num);
    this.cs.setContext(context, num);
  }

  getData(bl: [number, number], tr: [number, number]) {
    const that = this;
    this.map1 = <L.Map>this.cs.getMap(1);
    this.map2 = <L.Map>this.cs.getMap(2);
    this.map3 = <L.Map>this.cs.getMap(3);
    this.map4 = <L.Map>this.cs.getMap(4);
    const context1 = this.cs.getContext(1);
    const context2 = this.cs.getContext(2);
    const context3 = this.cs.getContext(3);
    const context4 = this.cs.getContext(4);
    const canvas1 = this.cs.getCanvas(1);
    const canvas2 = this.cs.getCanvas(2);
    const canvas3 = this.cs.getCanvas(3);
    const canvas4 = this.cs.getCanvas(4);

    // determining which country to grab for each map
    const country1 = this.countryControl1.value
    const country2 = this.countryControl2.value
    const country3 = this.countryControl3.value
    const country4 = this.countryControl4.value

    // determining the start and end date for each map
    const start1 = new Date(Date.parse(this.range1.value.start));
    const start2 = new Date(Date.parse(this.range2.value.start));
    const start3 = new Date(Date.parse(this.range3.value.start));
    const start4 = new Date(Date.parse(this.range4.value.start));
    const end1 = new Date(Date.parse(this.range1.value.end));
    const end2 = new Date(Date.parse(this.range2.value.end));
    const end3 = new Date(Date.parse(this.range3.value.end));
    const end4 = new Date(Date.parse(this.range4.value.end));

    // grabbing the data for each map from the api service and adding these to an Observable
    const data1$ = this.ds.getLcV(this.dateToStr(start1), this.dateToStr(end1), bl, tr, country1);
    const data2$ = this.ds.getLcV(this.dateToStr(start2), this.dateToStr(end2), bl, tr, country2);
    const data3$ = this.ds.getLcV(this.dateToStr(start3), this.dateToStr(end3), bl, tr, country3);
    const data4$ = this.ds.getLcV(this.dateToStr(start4), this.dateToStr(end4), bl, tr, country4);
    let max1: number;
    let max2: number;
    let max3: number;
    let max4: number;
    let colorMap: any;

    //determining the scaling factor for each map
    if (that.mapsScale == 'log') {
      colorMap = d3.scaleSymlog<string, number>();
    } else if (that.mapsScale == 'sqrt') {
      colorMap = d3.scaleSqrt();
    } else if (that.mapsScale == 'linear') {
      colorMap = d3.scaleLinear();
    }

    // concatenating Observable results on completion of all calls
    const values$ = forkJoin([data1$, data2$, data3$, data4$]).subscribe((data) => {
      this.cs.setData(data[0], 1);
      this.cs.setData(data[1], 2);
      this.cs.setData(data[2], 3);
      this.cs.setData(data[3], 4);
      // >>> removing previously rendered items >>>
      if (!this.legend.selectAll('rect').empty()) this.legend.selectAll('rect').remove();
      if (!this.legend.selectAll('g').empty()) this.legend.selectAll('g').remove();
      if (!this.legend.selectAll('text').empty()) this.legend.selectAll('text').remove();
      if (!this.legend.selectAll('defs').empty()) this.legend.selectAll('defs').remove();

      // clearing any previously rendered items from the canvas
      clearContext1();
      clearContext2();
      clearContext3();
      clearContext4();

      this.hideProgress1();
      this.hideProgress2();
      this.hideProgress3();
      this.hideProgress4();
      // <<< removing previously rendered items <<<
      console.log(data);

      // >>> creating a new render queue for each map
      const render1 = new renderQueue(draw1).clear(clearContext1);
      const render2 = new renderQueue(draw2).clear(clearContext2);
      const render3 = new renderQueue(draw3).clear(clearContext3);
      const render4 = new renderQueue(draw4).clear(clearContext4);
      // <<< creating a new render queue for each map

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
      let colorScale: any;

      // determining which scaling factor to apply based on user selection
      if (this.mapsScale == 'log') {
        colorScale = d3.scaleSymlog();
      } else if (this.mapsScale == 'sqrt') {
        colorScale = d3.scaleSqrt();
      } else if (this.mapsScale == 'linear') {
        colorScale = d3.scaleLinear();
      }
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
        const newX = that.map1.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = that.map1.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        // + 0.1 to the latitude as we are looking at the lower bottom left corner of each raster point whilst leaflet looks at the top left
        context1.beginPath();
        context1.fillStyle = colorMap(d.tfh);
        context1.rect(newX, newY, that.detSize(d, that.map1)[0], that.detSize(d, that.map1)[1]);
        context1.fill();
        context1.closePath();
      }

      function clearContext1() {
        context1.clearRect(0, 0, canvas1.attr("width"), canvas1.attr("height"));
      }

      function draw2(d: tmp) {
        const newX = that.map2.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = that.map2.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context2.beginPath();
        context2.fillStyle = colorMap(d.tfh);
        context2.rect(newX, newY, that.detSize(d, that.map2)[0], that.detSize(d, that.map2)[1]);
        context2.fill();
        context2.closePath();
      }

      function clearContext2() {
        context2.clearRect(0, 0, canvas2.attr("width"), canvas2.attr("height"));
      }

      function draw3(d: tmp) {
        const newX = that.map3.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = that.map3.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context3.beginPath();
        context3.fillStyle = colorMap(d.tfh);
        context3.rect(newX, newY, that.detSize(d, that.map3)[0], that.detSize(d, that.map3)[1]);
        context3.fill();
        context3.closePath();
      }

      function clearContext3() {
        context3.clearRect(0, 0, canvas3.attr("width"), canvas3.attr("height"));
      }

      function draw4(d: tmp) {
        const newX = that.map4.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
        const newY = that.map4.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
        context4.beginPath();
        context4.fillStyle = colorMap(d.tfh);
        context4.rect(newX, newY, that.detSize(d, that.map4)[0], that.detSize(d, that.map4)[1]);
        context4.fill();
        context4.closePath();
      }

      function clearContext4() {
        context4.clearRect(0, 0, canvas4.attr("width"), canvas4.attr("height"));
      }
      // <<< canvas rendering functions <<<

      this.map1 = this.cs.getMap(1)!;
      this.map2 = this.cs.getMap(2)!;
      this.map3 = this.cs.getMap(3)!;
      this.map4 = this.cs.getMap(4)!;

      // adding tooltip on click to map 1
      this.map1.on('click', function (event: L.LeafletMouseEvent) {
        const data = that.cs.getData(1);
        // + 0.1 to the latitude as we are looking at the lower bottom left corner of each raster point whilst leaflet looks at the top left
        const lat = that.truncate(Math.round((event.latlng.lat + 0.1) * 100) / 100);
        const lng = that.truncate(event.latlng.lng);

        if (!(data === undefined)) {
          // finding the data point that was clicked 
          const d: any = data.find((d: tmp) => d.lat == lat && d.lon == lng);
          if (!(d === undefined)) {
            that.tooltip1
              .style("position", "absolute")
              .style('z-index', 9999)
              .style('visibility', 'visible')
              .style('left', event.originalEvent.pageX + 20 + "px")
              .style('top', event.originalEvent.pageY + 20 + "px")
              .html('Latitude: ' + d.lat + '<br>'
                + 'Longitude: ' + d.lon + '<br>'
                + 'Fishing Hours: ' + Math.round(d.tfh * 100) / 100);
          } else {
            that.tooltip1.style('visibility', 'hidden');
          }
        }
      });

      this.map2.on('click', function (event: L.LeafletMouseEvent) {
        const data = that.cs.getData(2);
        const lat = that.truncate(Math.round((event.latlng.lat + 0.1) * 100) / 100);
        const lng = that.truncate(event.latlng.lng);

        if (!(data === undefined)) {
          const d: any = data.find((d: tmp) => d.lat == lat && d.lon == lng);
          if (!(d === undefined)) {
            that.tooltip2
              .style("position", "absolute")
              .style('z-index', 9999)
              .style('visibility', 'visible')
              .style('left', event.originalEvent.pageX + 20 + "px")
              .style('top', event.originalEvent.pageY + 20 + "px")
              .html('Latitude: ' + d.lat + '<br>'
                + 'Longitude: ' + d.lon + '<br>'
                + 'Fishing Hours: ' + Math.round(d.tfh * 100) / 100);
          } else {
            that.tooltip2.style('visibility', 'hidden');
          }
        }
      });

      this.map3.on('click', function (event: L.LeafletMouseEvent) {
        const data = that.cs.getData(3);
        const lat = that.truncate(Math.round((event.latlng.lat + 0.1) * 100) / 100);
        const lng = that.truncate(event.latlng.lng);

        if (!(data === undefined)) {
          const d: any = data.find((d: tmp) => d.lat == lat && d.lon == lng);
          if (!(d === undefined)) {
            that.tooltip3
              .style("position", "absolute")
              .style('z-index', 9999)
              .style('visibility', 'visible')
              .style('left', event.originalEvent.pageX + 20 + "px")
              .style('top', event.originalEvent.pageY + 20 + "px")
              .html('Latitude: ' + d.lat + '<br>'
                + 'Longitude: ' + d.lon + '<br>'
                + 'Fishing Hours: ' + Math.round(d.tfh * 100) / 100);
          } else {
            that.tooltip3.style('visibility', 'hidden');
          }
        }
      });

      this.map4.on('click', function (event: L.LeafletMouseEvent) {
        const data = that.cs.getData(4);
        const lat = that.truncate(Math.round((event.latlng.lat + 0.1) * 100) / 100);
        const lng = that.truncate(event.latlng.lng);

        if (!(data === undefined)) {
          const d: any = data.find((d: tmp) => d.lat == lat && d.lon == lng);
          if (!(d === undefined)) {
            that.tooltip4
              .style("position", "absolute")
              .style('z-index', 9999)
              .style('visibility', 'visible')
              .style('left', event.originalEvent.pageX + 20 + "px")
              .style('top', event.originalEvent.pageY + 20 + "px")
              .html('Latitude: ' + d.lat + '<br>'
                + 'Longitude: ' + d.lon + '<br>'
                + 'Fishing Hours: ' + Math.round(d.tfh * 100) / 100);
          } else {
            that.tooltip4.style('visibility', 'hidden');
          }
        }
      });

    });
    this.subs.add(values$);
    this.cs.setSub(this.subs);

  }

  /**
   * determines the width and height of each raster datapoint.
   * @param d the datapoint 
   * @param map the map the pixel is being projected on
   * @returns pixel width (x: [0]) and height (y: [1]) of the raster datapoint
   */
  detSize(d: any, map: any) {
    const lat: number = parseFloat(d.lat);
    const lon: number = parseFloat(d.lon);
    const zoom = map.getZoom();
    let first, second;

    // adding/removing small amounts to the lat lon position to remove horizontal streak artifacts based on zoom.
    if (zoom == 2) {
      first = L.latLng(lat - 0.01, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 3) {
      first = L.latLng(lat - 0.03, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 4) {
      first = L.latLng(lat - 0.025, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 5) {
      first = L.latLng(lat - 0.017, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 6) {
      first = L.latLng(lat - 0.005, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else if (zoom == 7) {
      first = L.latLng(lat - 0.002, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    } else {
      first = L.latLng(lat, lon);
      second = L.latLng(lat + 0.1, lon + 0.1);
    }

    // determining the difference in height and width between two neighboring raster data points
    let diffX = Math.abs(map.latLngToLayerPoint(first).x - map.latLngToLayerPoint(second).x);
    let diffY = Math.abs(map.latLngToLayerPoint(first).y - map.latLngToLayerPoint(second).y);
    // ensuring the minimum remains 1 pixel
    diffX = diffX < 1 ? 1 : diffX;
    diffY = diffY < 1 ? 1 : diffY;
    const size: [number, number] = [diffX, diffY];
    return size
  }

  // converts date to a more readable string.
  dateToStr(d: Date) {
    return d.getFullYear() + '-' + ("0" + (d.getMonth() + 1)).slice(-2) + '-' + ("0" + d.getDate()).slice(-2)
  }

  // add or remove FAO boundary SVG layer
  faoChange(event: any) {
    const that = this;
    this.map1 = this.cs.getMap(1)!;
    this.map2 = this.cs.getMap(2)!;
    this.map3 = this.cs.getMap(3)!;
    this.map4 = this.cs.getMap(4)!;
    const jsonData = this.cs.getJson(1);

    // Transforming svg locations to leaflet coordinates
    const transform = d3.geoTransform({
      point: function (x, y) {
        const point = that.map1.latLngToLayerPoint([y, x]);
        this.stream.point(point.x, point.y);
      },
    });

    // Adding transformation to the path
    const path = d3.geoPath().projection(transform);

    if (this.faoChecked) {
      this.faoSVG1 = d3.select(this.map1.getPanes().overlayPane).select('svg');
      this.faoSVG2 = d3.select(this.map2.getPanes().overlayPane).select('svg');
      this.faoSVG3 = d3.select(this.map3.getPanes().overlayPane).select('svg');
      this.faoSVG4 = d3.select(this.map4.getPanes().overlayPane).select('svg');

      // adding FAO boundary paths
      const features1 = this.faoSVG1.append('g').selectAll('path')
        .data(jsonData.features)
        .enter()
        .append('path')
        .attr('d', (d: any) => path(d.geometry))
        .attr("class", "leaflet-interactive")
        .attr('pointer-events', 'painted')
        .style('fill', 'lightgrey')
        .style('fill-opacity', 0)
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.2);

      const features2 = this.faoSVG2.append('g').selectAll('path')
        .data(jsonData.features)
        .enter()
        .append('path')
        .attr('d', (d: any) => path(d.geometry))
        .attr("class", "leaflet-interactive")
        .attr('pointer-events', 'painted')
        .style('fill', 'lightgrey')
        .style('fill-opacity', 0)
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.2);

      const features3 = this.faoSVG3.append('g').selectAll('path')
        .data(jsonData.features)
        .enter()
        .append('path')
        .attr('d', (d: any) => path(d.geometry))
        .attr("class", "leaflet-interactive")
        .attr('pointer-events', 'painted')
        .style('fill', 'lightgrey')
        .style('fill-opacity', 0)
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.2);

      const features4 = this.faoSVG4.append('g').selectAll('path')
        .data(jsonData.features)
        .enter()
        .append('path')
        .attr('d', (d: any) => path(d.geometry))
        .attr("class", "leaflet-interactive")
        .attr('pointer-events', 'painted')
        .style('fill', 'lightgrey')
        .style('fill-opacity', 0)
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.2);

      // adding tooltip
      const faoTooltip = d3.select('#tooltipFAO')
        .attr("class", "leaflet-interactive")
        .style('visibility', 'hidden')
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style('opacity', 0.7)
        .style('z-index', 10000);

      features1.on('pointermove', mousemove)
        .on('pointerout', mouseleave);
      features2.on('pointermove', mousemove)
        .on('pointerout', mouseleave);
      features3.on('pointermove', mousemove)
        .on('pointerout', mouseleave);
      features4.on('pointermove', mousemove)
        .on('pointerout', mouseleave);

      function mousemove(event: any, d: any) {
        faoTooltip.html("FAO Boundary: " + d.properties.NAME_EN + "<br>"
          + "Ocean: " + d.properties.OCEAN)
          .style('visibility', 'visible')
          .style('left', (event.pageX + 5) + 'px')
          .style('top', (event.pageY + 5) + 'px');
      }
      function mouseleave(d: any) {
        faoTooltip
          .style('visibility', 'hidden');
      }

    } else if (!this.faoChecked) {
      if (!this.faoSVG1.selectAll('g').empty()) this.faoSVG1.selectAll('g').remove();
      if (!this.faoSVG2.selectAll('g').empty()) this.faoSVG2.selectAll('g').remove();
      if (!this.faoSVG3.selectAll('g').empty()) this.faoSVG3.selectAll('g').remove();
      if (!this.faoSVG4.selectAll('g').empty()) this.faoSVG4.selectAll('g').remove();
    }
  }

  // functions for showing and hiding the progress bar
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

}