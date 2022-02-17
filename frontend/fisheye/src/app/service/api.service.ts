import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as L from 'leaflet';
import { fSpat, fTemp, tmp } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class APIService {
  //text variable for amenity
  amenity: string = '';
  start: string = '';
  end: string = ''
  bl: [number, number] = [0, 0]
  tr: [number, number] = [0, 0]

  //map reference
  map: any;

  //id layer reference
  id: any

  // inject the http client
  constructor(private http: HttpClient) {}

  // retrieve pubs from server
  public getAllDays(): Observable<fSpat[]> {
    return this.http.get<fSpat[]>('http://localhost:5000/allDays');
  }

  public getDateRangeVal(): Observable<tmp[]> {
    if (this.start != '' || this.end != '') {
      return this.http.get<tmp[]>('http://localhost:5000/getQuadValues?start=' + this.start + '&end=' + this.end)
    }
    return this.http.get<tmp[]>('http://localhost:5000/getQuadValues');
  }

  public setVariable(amenity: string) {
    this.amenity = amenity;
  }

  public getMapRef(mapRef: any) {
    this.map = mapRef;
  }

}
