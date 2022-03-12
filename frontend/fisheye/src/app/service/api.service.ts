import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { dtmp, tmp } from '../interfaces';

import midData from '../../assets/json/midNew.json'

@Injectable({
  providedIn: 'root',
})
export class APIService {

  constructor(private http: HttpClient) { }

  public getDateRangeVal(start?: string, stop?: string, country?: string): Observable<tmp[]> {
    if (start != undefined || stop != undefined) {
      country = country ?? 'World';
      console.log('api: ', country)
      let mids = this.getMid(country);
      let groups = this.getGroups(mids);
      console.log(groups);
      let batchNum = 0;
      if (!(groups.batch1.length == 0)) batchNum += 1;
      if (!(groups.batch2.length == 0)) batchNum += 1;
      if (!(groups.batch3.length == 0)) batchNum += 1;
      if (country == 'World') batchNum = 0;
      if (batchNum == 0) {
        return this.http.get<tmp[]>('http://localhost:5000/getQuadValues?start=' + start + '&end=' + stop);
      } else if (batchNum == 1) {
        let b1 = this.trueRange(<number[]>[groups.batch1[0], groups.batch1.slice(-1).pop()]);
        return this.http.get<tmp[]>('http://localhost:5000/getQuadValues?start='
          + start + '&end=' + stop + "&batch=" + batchNum + "&b1[0]=" + b1[0] + "&b1[1]=" + b1[1]);
      } else if (batchNum == 2) {
        let b1 = this.trueRange(<number[]>[groups.batch1[0], groups.batch1.slice(-1).pop()]);
        let b2 = this.trueRange(<number[]>[groups.batch2[0], groups.batch2.slice(-1).pop()]);
        return this.http.get<tmp[]>('http://localhost:5000/getQuadValues?start='
          + start + '&end=' + stop + "&batch=" + batchNum + "&b1[0]=" + b1[0] + "&b1[1]=" + b1[1]
          + "&b2[0]=" + b2[0] + "&b2[1]=" + b2[1]);
      } else if (batchNum == 3) {
        let b1 = this.trueRange(<number[]>[groups.batch1[0], groups.batch1.slice(-1).pop()]);
        let b2 = this.trueRange(<number[]>[groups.batch2[0], groups.batch2.slice(-1).pop()]);
        let b3 = this.trueRange(<number[]>[groups.batch3[0], groups.batch3.slice(-1).pop()]);
        return this.http.get<tmp[]>('http://localhost:5000/getQuadValues?start='
          + start + '&end=' + stop + "&batch=" + batchNum + "&b1[0]=" + b1[0] + "&b1[1]=" + b1[1]
          + "&b2[0]=" + b2[0] + "&b2[1]=" + b2[1] + "&b3[0]=" + b3[0] + "&b3[1]=" + b3[1]);
      }
    }
    return this.http.get<tmp[]>('http://localhost:5000/getQuadValues');
  }

  public getLcV(start?: string, stop?: string, bl?: [number, number], tr?: [number, number]): Observable<tmp[]> {
    if (start != undefined && stop != undefined && bl != undefined && tr != undefined) {
      return this.http.get<tmp[]>('http://localhost:5000/getLcV?start='
        + start + '&end=' + stop + '&bl[0]=' + bl[0] + '&bl[1]=' + bl[1]
        + '&tr[0]=' + tr[0] + '&tr[1]=' + tr[1]);
    }
    return this.http.get<tmp[]>('http://localhost:5000/getLcV');
  }

  private getMid(country: string) {
    let mids: number[] = [];
    let midList = midData.filter(element => element.viewValue == country);

    midList.forEach(elem => {
      mids.push(parseInt(elem.value));
    });
    return mids
  }

  private getGroups(mid: number[]) {
    let batch = {
      batch1: <number[]>[],
      batch2: <number[]>[],
      batch3: <number[]>[]
    }
    let bC = 1;
    if (mid.length == 1) {
      batch.batch1.push(mid[0]);
    } else if (mid.length > 1) {
      for (let i = 0; i < mid.length; i++) {
        const thisElem = mid[i];
        if (bC == 1) {
          batch.batch1.push(thisElem);
        } else if (bC == 2) {
          batch.batch2.push(thisElem);
        } else if (bC == 3) {
          batch.batch3.push(thisElem);
        }
        if (!(i == mid.length - 1)) {
          const nextElem = mid[i + 1];
          if (thisElem + 1 != nextElem) {
            bC += 1;
          }
        }

        // if (i == mid.length - 1){
        //   if (bC == 1) {
        //     batch.batch1.push(nextElem);
        //   } else if (bC == 2) {
        //     batch.batch2.push(nextElem);
        //   } else if (bC == 3) {
        //     batch.batch3.push(nextElem);
        //   }
        // }
      }
    }
    return batch;
  }

  private trueRange(range: number[]) {
    range[0] = range[0] * 1000000;
    range[1] = range[1] * 1000000 + 999999;
    return range;
  }
}
