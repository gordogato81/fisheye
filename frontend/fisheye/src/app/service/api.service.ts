import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { dtmp, tmp } from '../interfaces';

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
  constructor(private http: HttpClient) { }


  public getDateRangeVal(start?: string, stop?: string): Observable<tmp[]> {
    if (start != undefined || stop != undefined) {
      return this.http.get<tmp[]>('http://localhost:5000/getQuadValues?start=' + start + '&end=' + stop)
    }
    return this.http.get<tmp[]>('http://localhost:5000/getQuadValues');
  }
  public getDV(start?: string, stop?: string): Observable<dtmp[]> {
    if (start != undefined && stop != undefined) {
      return this.http.get<dtmp[]>('http://localhost:5000/getDV?start=' + start + '&end=' + stop)
    }
    return this.http.get<dtmp[]>('http://localhost:5000/getDV');
  }

  public getLcV(start?: string, stop?: string, bl?: [number, number], tr?: [number, number]): Observable<tmp[]> {
    if (start != undefined && stop != undefined && bl != undefined && tr != undefined) {
      return this.http.get<tmp[]>('http://localhost:5000/getLcV?start='
        + start + '&end=' + stop + '&bl[0]=' + bl[0] + '&bl[1]=' + bl[1]
        + '&tr[0]=' + tr[0] + '&tr[1]=' + tr[1]);
    }
    return this.http.get<tmp[]>('http://localhost:5000/getLcV');
  }

}
