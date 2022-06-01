//todo: drop all rows with fishing hours = 0 (64% data reduction)
import { Component, OnInit } from '@angular/core';
import { APIService } from '../service/api.service';
import * as L from 'leaflet';
import * as d3 from 'd3';

import { MatSliderChange } from '@angular/material/slider';
import { FormControl, FormGroup } from '@angular/forms';
import { ExplorationService } from '../service/exploration.service';
import { Options } from '@angular-slider/ngx-slider';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import countryJson from '../../assets/json/countries.json';
import { tmp, Country, geo } from '../interfaces';
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
  private faoSVG: any;
  private r_data: any;
  private dMax: number = 2439.9774;
  private render: any;
  private loaded: boolean = false;
  private context: any;
  private tooltip: any;
  private faoTooltip: any;
  private legend: any;
  private intervalLength: number = 5;
  private min_color = 'orange';
  private max_color = 'purple';
  private faoURL = 'https://www.fao.org/fishery/geoserver/fifao/ows?service=WFS&request=GetFeature&version=1.0.0&typeName=fifao:FAO_AREAS_CWP&outputFormat=json';

  sliderDisplay: any = (element: number) => { return this.dateToStr(this.valToDate(element)) }; // Displays the date as a string on the slider thumb
  sliderMax: number = 3287; // the total number of dats in the dataset 
  sliderVal: number = 1;
  mapScale: string = 'log';
  minDate: Date = new Date('2012-01-01');
  maxDate: Date = new Date('2020-12-31');
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  faoChecked = false;
  faoDisabled = true;
  countryControl = new FormControl();
  options1: Country[] = countryJson;
  filteredOptions!: Observable<Country[]>;

  sliderForm = new FormGroup({
    sliderControl: new FormControl([20, 50])
  });

  ngOnInit(): void {
    const that = this;

    // initalize filter for the autocomplete input
    this.filteredOptions = this.countryControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value.name)),
      map(name => (name ? this._filter(name) : this.options1.slice())),
    );

    const mapOptions = {
      worldCopyJump: true,
      // crs: L.CRS.EPSG4326
      // preferCanvas: true 
    };
    this.map = L.map('map', mapOptions).setView([18, 0], 2.5); // defaults to world view 

    //creating new tile layer
    const tilelayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 2,
      maxZoom: 10,
      // crs: L.CRS.EPSG4326,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    this.map.attributionControl.setPosition('bottomleft');
    tilelayer.addTo(this.map);
    L.canvas().addTo(this.map);
    L.svg().addTo(this.map);
    // const bl = L.latLng(-90, -240);
    // const tr = L.latLng(90, 240);
    // this.map.setMaxBounds(L.latLngBounds(bl, tr));

    this.es.setMap(this.map); // sending map info to exploration service

    this.canvas = d3.select(this.map.getPanes().overlayPane).select('canvas').attr('z-index', 300);
    this.es.setCanvas(this.canvas);
    this.context = this.canvas.node().getContext('2d');
    this.es.setContext(this.context);

    // initalizing tooltip
    this.tooltip = d3.select('#tooltip')
      .attr("class", "leaflet-interactive")
      .style('visibility', 'hidden')
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "1px")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style('opacity', 0.7)
      .style('z-index', 9999);

    this.legend = d3.select('#legend')
      .attr('height', 360)
      .attr('width', 90)


    // collecting geoJSON form FAO API and sending it to the exploration service
    d3.json(this.faoURL).then((data: any) => {
      this.faoDisabled = false; // makes the FAO checkmark clickable 
      this.ds.setJson(data);
    });

    // >>> getting intial values and setting default inputs
    const start = "2020-03-01";
    const end = "2020-03-05";
    this.getData(start, end);
    this.es.setInterval(this.dateRangeToInterval(new Date(start), new Date(end)));
    this.sliderVal = this.dateToVal(new Date(start));
    this.range.setValue({ start: start, end: end });
    this.countryControl.setValue('World')
    // <<<

    // calling tooltip on click 
    this.map.on('click', function (event: L.LeafletMouseEvent) {
      console.log(event);
      const data = that.es.getData();
      // + 0.1 to the latitude to change raster position from top left to bottom left of each raster rectangle
      const lat = that.truncate(Math.round((event.latlng.lat + 0.1) * 100) / 100);
      const lng = that.truncate(event.latlng.lng);


      if (!(data === undefined)) {
        const d: any = data.find((d: tmp) => d.lat == lat && d.lon == lng);
        if (!(d === undefined)) {
          that.tooltip
            .style("position", "absolute")
            .style('z-index', 9999)
            .style('visibility', 'visible')
            .style('left', event.originalEvent.pageX + 20 + "px")
            .style('top', event.originalEvent.pageY + 20 + "px")
            .html('Latitude: ' + d.lat + '<br>'
              + 'Longitude: ' + d.lon + '<br>'
              + 'Fishing Hours: ' + Math.round(d.tfh * 100) / 100);
        } else {
          that.tooltip.style('visibility', 'hidden');
        }
      }
    });

  }

  // filter function for the autocomplete input
  private _filter(name: string): Country[] {
    const filterValue = name.toLowerCase();
    return this.options1.filter(option => option.viewValue.toLowerCase().includes(filterValue));
  }

  /**
   * Gets the data from the api service and adds elements to the canvas overlayed on the map
   * @param start starting date
   * @param end end date
   */
  private getData(start: string, end: string) {
    const that = this;
    // show progress bar
    this.showProgress();
    this.map = this.es.getMap();
    const context = this.es.getContext();
    const canvas = this.es.getCanvas();
    const country = this.countryControl.value;
    const legendheight = 345;
    const legendwidth = 25;

    // getting the data from the api service
    this.ds.getDateRangeVal(start, end, country).subscribe(data => {
      // removing any previous canvas elements
      clearContext();
      // hiding progress bar
      this.hideProgress();
      this.r_data = data;
      this.es.setData(this.r_data);
      this.loaded = true;
      console.log(this.r_data);
      this.render = new renderQueue(draw).clear(clearContext);
      this.es.setRenderer(this.render);
      this.dMax = d3.max(this.r_data, (d: any) => +d.tfh) ?? 0;
      this.es.setDMax(this.dMax);
      this.render(this.r_data);

      // >>> removing any previous legend DOM elements 
      if (!this.legend.selectAll('rect').empty()) this.legend.selectAll('rect').remove();
      if (!this.legend.selectAll('g').empty()) this.legend.selectAll('g').remove();
      if (!this.legend.selectAll('text').empty()) this.legend.selectAll('text').remove();
      // <<< 

      // Determine color scale based on user input
      let colorScale: any;
      if (this.mapScale == 'log') {
        colorScale = d3.scaleSymlog();
      } else if (this.mapScale == 'sqrt') {
        colorScale = d3.scaleSqrt();
      } else if (this.mapScale == 'linear') {
        colorScale = d3.scaleLinear();
      }

      colorScale.domain([0, this.dMax]).range([0, legendheight])
      const coloraxis = d3.axisLeft(colorScale).ticks(5);
      // >>> constructing legend
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
        .attr("y", 10)
        .attr("width", legendwidth)
        .attr("height", legendheight)
        .style("fill", "url(#gradient)")
      // .style('opacity', 0.9);

      this.legend.append('g')
        .attr("class", "x axis")
        .attr("transform", "translate(50, 10)")
        .call(coloraxis);

      this.legend.append('text')
        .attr('x', 70)
        .attr('y', -78)
        .attr("transform", "rotate(90)")
        .text('Apparent Fishing Activity in Hours')
      // <<<
    });

    this.map.on('moveend zoomend', update); // rerender datapoints when the map view is changed


    // adds canvas element for a given data point
    function draw(d: tmp) {
      let colorMap: any;
      // determining the color scaling based on user input
      if (that.mapScale == 'log') {
        colorMap = d3.scaleSymlog<string, number>();
      } else if (that.mapScale == 'sqrt') {
        colorMap = d3.scaleSqrt();
      } else if (that.mapScale == 'linear') {
        colorMap = d3.scaleLinear();
      }

      colorMap.domain([0, that.dMax]).range(["orange", "purple"]);
      const newY = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).y + 0.1;
      const newX = that.map.latLngToLayerPoint(L.latLng(d.lat, d.lon)).x;
      context.beginPath();
      context.fillStyle = colorMap(d.tfh);
      context.rect(newX, newY, that.detSize(d)[0], that.detSize(d)[1]);
      context.fill();
      context.closePath();
    }

    // removes all previous canvas elements
    function clearContext() {
      context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
    }

    // rerender datapoints when the map moves or zooms.
    function update() {
      if (that.loaded) {
        that.render(that.r_data);
      }
    }
  }


  onDateChange(event: any) {
    if (this.range.value.end) {
      const start = new Date(Date.parse(this.range.value.start));
      const end = new Date(Date.parse(this.range.value.end));
      this.sliderVal = this.dateToVal(start);
      this.intervalLength = this.dateRangeToInterval(start, end);
      this.getData(this.dateToStr(start), this.dateToStr(end));
      const render = this.es.getRenderer()
      const data = this.es.getData()
      render(data);
    }
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

  truncate(x: number) {
    if (x < 0) {
      x = Math.ceil((x - 0.1) * 10) / 10;
    } else if (x >= 0) {
      x = Math.floor(x * 10) / 10;
    }
    return x
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
    const zoom = this.map.getZoom();
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

    let diffX = Math.abs(this.map.latLngToContainerPoint(first).x - this.map.latLngToContainerPoint(second).x);
    let diffY = Math.abs(this.map.latLngToContainerPoint(first).y - this.map.latLngToContainerPoint(second).y);
    diffX = diffX < 1 ? 1 : diffX;
    diffY = diffY < 1 ? 1 : diffY;
    const size: [number, number] = [diffX, diffY];
    return size
  }

  showProgress() {
    let element = document.getElementById("explProgress");
    if (element != null) {
      element.style.visibility = "visible";
    }
  }

  hideProgress() {
    let element = document.getElementById("explProgress");
    if (element != null) {
      element.style.visibility = "hidden";
    }
  }

  faoChange(event: any) {
    const that = this;
    this.map = this.es.getMap();
    const jsonData = this.ds.getJson();

    // Transforming svg locations to leaflet coordinates
    const transform = d3.geoTransform({
      point: function (x, y) {
        const point = that.map.latLngToLayerPoint([y, x]);
        this.stream.point(point.x, point.y);
      },
    });

    // Adding transformation to the path
    const path = d3.geoPath().projection(transform);

    if (this.faoChecked) {
      this.faoSVG = d3.select(this.map.getPanes().overlayPane).select('svg');
      const features = this.faoSVG.append('g').selectAll('path')
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

      this.faoTooltip = d3.select('#tooltip2')
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

      features.on('pointermove', mousemove)
        .on('pointerout', mouseleave)

      this.map.on('zoomend', update);

      function update() {
        features.attr('d', (d: any) => path(d.geometry));
      }

      function mousemove(event: any, d: any) {
        that.faoTooltip.html("FAO Boundary: " + d.properties.NAME_EN + "<br>"
          + "Ocean: " + d.properties.OCEAN)
          .style('visibility', 'visible')
          .style('left', (event.pageX + 5) + 'px')
          .style('top', (event.pageY + 5) + 'px');
      }
      function mouseleave(d: any) {
        that.faoTooltip
          .style('visibility', 'hidden');
      }

    } else if (!this.faoChecked) {
      if (!this.faoSVG.selectAll('g').empty()) this.faoSVG.selectAll('g').remove();
    }
  }
}



