"use strict";

class App {
  constructor() {
    this.disableSaves = false;
    this.cellValues = {};
    this.progressElements = {};
    this.timeElements = {};
    this.cellColors = ['hsl(123, 15%, 54%)', 'hsl(60, 48%, 54%)'];

    this.loadFromStorage();
    this.totalTime = 0;
    this.completeTime = 0;
    this.cellCount = 0;
    this.completeCount = 0;
    this.activated = 0;

    this.UI = {};
    'infoPlayTime,infoTimeRemaining,infoProgress,resetContainer,resetButton,resetYes,resetNo,winContainer,winClose,winPlayTime,linkIcon,infoNext,imexContainer,imexImport,imexExport,imexShow,imexClose,imexText'.split`,`.forEach( id => {
      this.UI[id] = document.getElementById(id);
    });

    this.UI.resetButton.onclick = () => this.UI.resetContainer.style.display = 'block';
    this.UI.resetYes.onclick = () => this.reset();
    this.UI.resetNo.onclick = () => this.UI.resetContainer.style.display = 'none';
    this.UI.winClose.onclick = () => this.UI.winContainer.style.display = 'none';
    this.UI.imexImport.onclick = () => this.import();
    this.UI.imexExport.onclick = () => this.export();
    this.UI.imexShow.onclick = () => this.UI.imexContainer.style.display = 'block';
    this.UI.imexClose.onclick = () => this.UI.imexContainer.style.display = 'none';

    const parent = document.getElementById('cellsContainer');
    const completeList = [];

    const rowCount = 30;

    for (let i = 0; i < rowCount; i++) {
      const row = document.createElement('div');
      row.classList.add('row');

      for (let j = 0; j <= i; j++) {
        const button = document.createElement('div');
        button.classList.add('cell');
        button.id = `cellButton${i}_${j}`;

        this.cellCount++;

        const cellContent = document.createElement('div');
        cellContent.classList.add('cellContent');
        const cellValue = this.getCellVal(i, j);
        cellContent.innerText = this.formatCellVal(cellValue);
        const cellTime = document.createElement('div');
        cellTime.classList.add('cellTime');
        cellTime.innerText = this.remainingToStr(cellValue * 1000);
        this.totalTime += cellValue * 1000;

        const progress = document.createElement('div');
        progress.classList.add('progress');
        const styleIndex = cellValue % 2;
        progress.style.background = `url('./p${styleIndex}.png')`;
        progress.style.backgroundSize = 'cover';
        progress.style.backgroundPosition = 'center';
        this.progressElements[`${i},${j}`] = progress;
        this.timeElements[`${i},${j}`] = cellTime;
        button.onclick = () => {
          this.cellButtonClick(button, i, j);
        };
        button.progress = progress;
        button.appendChild(progress);
        button.appendChild(cellContent);
        button.appendChild(cellTime);
        row.appendChild(button);
        if (this.state.completeCells[`${i},${j}`]) {
          completeList.push({row: i, col: j});
          progress.style.height = '100%';
          cellTime.innerText = '';
          progress.style.filter = 'opacity(1.0)';
          button.style.cursor = 'not-allowed';
          button.style.backgroundColor = this.cellColors[styleIndex];
        }

        if (this.state.activeCells.some( cell => {return cell.row === i && cell.col === j;})) {
          button.style.cursor = 'not-allowed';
          button.style.backgroundColor = this.cellColors[styleIndex];
        }

        if (j === i || (i === (rowCount - 1))) {
          button.classList.add('cellRowEnd');
        }
      }

      parent.appendChild(row);

    }

    completeList.forEach( cell => {
      this.progressComplete(cell.row, cell.col);
    });

    this.completeCount = completeList.length;



    //scroll to top middle
    setTimeout( () => {
      const scrollX = (document.body.clientWidth / 2) - (window.innerWidth / 2);
      window.scroll(scrollX, 0);
    }, 200);
    
    const topCell = document.getElementById(`cellButton${0}_${0}`);
    topCell.classList.add('cellClickable');
    this.activated++;

    setInterval(() => this.tick(), 1000 / 30);
    setInterval(() => this.saveToStorage(), 5000);
  }

  loadFromStorage() {
    const rawState = localStorage.getItem('PedroPascalsTriangleOfPrestige');

    this.state = {
      activeCells: [],
      completeCells: {}
    };

    if (rawState !== null) {
      const loadedState = JSON.parse(rawState);
      this.state = {...this.state, ...loadedState};
    } else {
      this.state.gameStart = (new Date()).getTime();
    }

    this.saveToStorage();
  }

  saveToStorage() {
    if (this.disableSaves) {return;}

    const saveString = JSON.stringify(this.state);
    localStorage.setItem('PedroPascalsTriangleOfPrestige', saveString);
  }

  reset() {
    this.disableSaves = true;
    localStorage.removeItem('PedroPascalsTriangleOfPrestige');
    window.location.reload();
  }

  formatCellVal(val) {
    if (val < 1000) {
      return val;
    } else {
      return val.toExponential(3);
    }
  }

  getCellVal(row, col) {
    if (col === 0 || col === row) { return 1; }
    if (col < 0 || col > row) { return 0; }

    const key = `${row},${col}`;
    let cellValue = this.cellValues[key];
    if (cellValue === undefined) {
      cellValue = this.getCellVal(row - 1, col) + this.getCellVal(row - 1, col - 1);
      this.cellValues[key] = cellValue;
    }

    return cellValue;
  }

  isCellActive(row, col) {
    if (row < 0) {return true;}
    if (col < 0 || col > row) {return true;}
    return this.state.completeCells[`${row},${col}`];
  }

  cellButtonClick(button, row, col) {

    if (this.isCellActive(row - 1, col) && this.isCellActive(row - 1, col - 1)) {

      const alreadyActive = this.state.activeCells.some( cell => {
        return cell.row === row && cell.col === col;
      });

      if (alreadyActive || this.isCellActive(row, col)) {
        return;
      }

      button.style.cursor = 'not-allowed';
      const styleIndex = this.getCellVal(row, col) % 2;
      button.style.background = this.cellColors[styleIndex];

      const duration = this.getCellVal(row, col) * 1000;
      this.state.activeCells.push({
        name: `${row},${col}`,
        startTime: (new Date()).getTime(),
        duration: duration,
        percent: 0,
        remaining: duration,
        row,
        col
      });

    }
    this.saveToStorage();
  }

  progressComplete(row, col) {
    this.state.completeCells[`${row},${col}`] = true;
    this.completeTime += this.getCellVal(row, col) * 1000; 
    this.completeCount++;
    if (col === 0 || this.state.completeCells[`${row},${col-1}`]) {
      //mark row+1 col as clickable
      const cell = document.getElementById(`cellButton${row+1}_${col}`);
      if (cell && !cell.classList.contains('cellClickable')) {
        cell.classList.add('cellClickable');
        this.activated++;
      }
    }
    if (col === row || this.state.completeCells[`${row},${col+1}`]) {
      //mark row+1 col+1 as clickable
      const cell = document.getElementById(`cellButton${row+1}_${col+1}`);
      if (cell && !cell.classList.contains('cellClickable')) {
        cell.classList.add('cellClickable');
        this.activated++;
      }
    }

    if (this.completeCount >= this.cellCount && this.state.endTime === undefined) {
      this.state.endTime = (new Date()).getTime();
      const playTime = this.state.endTime - this.state.gameStart;
      this.UI.winPlayTime.innerText = this.remainingToStr(playTime);
      this.UI.winContainer.style.display = 'block'; 
      this.saveToStorage();
    }
  }

  tick() {
    this.update();
    this.draw();
  }

  update() {
    const curTime = (new Date()).getTime();
    this.partialCompleteTime = this.completeTime;
    this.state.activeCells.forEach( cell => {
      const completeTime = curTime - cell.startTime;
      const remaining = Math.max(0, (cell.startTime + cell.duration) - curTime);
      cell.percent = Math.min(100, 100 * (curTime - cell.startTime) / cell.duration);
      cell.remaining = remaining;
      if (remaining <= 0) {
        cell.complete = true;
        this.progressComplete(cell.row, cell.col);
      }
      this.partialCompleteTime += completeTime;
    });

    this.clickableCount = this.activated - (this.completeCount + this.state.activeCells.length);

  }

  draw() {
    let minRemaining = Infinity;
    this.state.activeCells.forEach( cell => {
      const progressElement = this.progressElements[cell.name];
      const timeElement = this.timeElements[cell.name]
      progressElement.style.height = `${cell.percent}%`;

      const timeText = this.remainingToStr(cell.remaining);
      if (cell.remaining < minRemaining) {
        minRemaining = cell.remaining;
      }
      if (cell.percent < 100) {
        timeElement.innerText = timeText;
      } else {
        timeElement.innerText = '';
        progressElement.style.filter = 'opacity(1.0)';
        progressElement.parentElement.style.cursor = 'not-allowed';
      }
    });

    this.state.activeCells = this.state.activeCells.filter( cell => cell.complete !== true );

    const curTime = this.state.endTime ?? (new Date()).getTime();
    const playTime = curTime - this.state.gameStart;
    this.UI.infoPlayTime.innerText = this.remainingToStr(playTime, true);

    this.UI.infoNext.innerText = this.remainingToStr(minRemaining, true);
    document.title = `Pedro Pascal's Triangle of Prestige - ${this.remainingToStr(minRemaining)}`;



    const timeRemaining = this.totalTime - this.partialCompleteTime;
    this.UI.infoTimeRemaining.innerText = this.remainingToStr(timeRemaining, true);

    const remainingPercent = 100 - 100 * timeRemaining / this.totalTime;
    this.UI.infoProgress.style.width = `${remainingPercent}%`;
    
    const icon = ['./favicon.png', './faviconAlert.png'][+(this.clickableCount > 0)];
    if (this.UI.linkIcon.href !== icon) {
      this.UI.linkIcon.href = icon;
    }

  }
  timeToObj(t) {
    const result = {};

    result.y = Math.floor(t / (365 * 24 * 60 * 60));
    t = t % (365 * 24 * 60 * 60);
    result.d = Math.floor(t / (24 * 60 * 60));
    t = t % (24 * 60 * 60);
    result.h = Math.floor(t / (60 * 60));
    t = t % (60 * 60);
    result.m = Math.floor(t / 60);
    t = t % 60;
    result.s = t;

    return result;
  }

  remainingToStr(ms, full) {
    if (ms === Infinity) {
      return 'Infinity';
    }

    const timeObj = this.timeToObj(ms / 1000);

    if (full) {
      return `${timeObj.y}:${timeObj.d.toString().padStart(3,0)}:${timeObj.h.toString().padStart(2,0)}:${timeObj.m.toString().padStart(2,0)}:${timeObj.s.toFixed(1).padStart(4,0)}`;
    }

    if (timeObj.y > 0 || timeObj.d > 0 || timeObj.h > 0) {
      return `${timeObj.y}:${timeObj.d.toString().padStart(3,0)}:${timeObj.h.toString().padStart(2,0)}:${timeObj.m.toString().padStart(2,0)}`;
    } else {
      return `${timeObj.m.toString().padStart(2,0)}:${timeObj.s.toFixed(1).padStart(4,0)}`;
    }

  }

  genExportStr() {
    this.saveToStorage();

    const saveString = localStorage.getItem('PedroPascalsTriangleOfPrestige');
    const compressArray = LZString.compressToUint8Array(saveString);
    const exportChars = 'pedropascal'.split``;
    let exportArray = new Array(compressArray.length * 8);
    for (let i = 0; i < compressArray.length; i++) {
      const val = compressArray[i];
      for (let b = 7; b >= 0; b--) {
        const bit = (val & (1 << b)) >> b;
        const cif = (i * 8 + (7 - b)) 
        const ci = cif % exportChars.length;
        const c = (bit === 1) ? exportChars[ci].toUpperCase() : exportChars[ci];
        exportArray[cif] = c;
      }
    }

    return exportArray.join``;
  }

  decodeExportStr(str) {
    const arraySize = Math.round(str.length / 8);
    const compressArray = new Uint8Array(arraySize);
    
    for (let i = 0; i < arraySize; i++) {
      let val = 0;
      for (let b = 7; b >=0; b--) {
        const cif = i * 8 + (7 - b);
        const c = str[cif];
        const bit = c === c.toUpperCase() ? 1 : 0;
        val = val | (bit << b);
      }
      compressArray[i] = val;
    }

    const saveString = LZString.decompressFromUint8Array(compressArray);
    return saveString;
    
  }

  export() {
    this.UI.imexText.value = this.genExportStr();
  }

  import() {
    const importString = this.UI.imexText.value.trim();
    if (importString.length % 8 !== 0) {
      console.error("Corrupted import string. Must be multiple of 8 characters long.");
      return;
    }
    const decodedStr = this.decodeExportStr(importString);
    let state;
    try {
      state = JSON.parse(decodedStr);
    } catch (error) {
      console.error("Corrupted import string. JSON.parse check failed.");
      return;
    }

    this.disableSaves = true;
    localStorage.setItem('PedroPascalsTriangleOfPrestige', decodedStr);
    window.location.reload();
  }
}

const app = new App();


/*
Below is pieroxy's LZString and license
*/

/*
MIT License

Copyright (c) 2013 pieroxy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var LZString=function(){var r=String.fromCharCode,o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",e={};function t(r,o){if(!e[r]){e[r]={};for(var n=0;n<r.length;n++)e[r][r.charAt(n)]=n}return e[r][o]}var i={compressToBase64:function(r){if(null==r)return"";var n=i._compress(r,6,function(r){return o.charAt(r)});switch(n.length%4){default:case 0:return n;case 1:return n+"===";case 2:return n+"==";case 3:return n+"="}},decompressFromBase64:function(r){return null==r?"":""==r?null:i._decompress(r.length,32,function(n){return t(o,r.charAt(n))})},compressToUTF16:function(o){return null==o?"":i._compress(o,15,function(o){return r(o+32)})+" "},decompressFromUTF16:function(r){return null==r?"":""==r?null:i._decompress(r.length,16384,function(o){return r.charCodeAt(o)-32})},compressToUint8Array:function(r){for(var o=i.compress(r),n=new Uint8Array(2*o.length),e=0,t=o.length;e<t;e++){var s=o.charCodeAt(e);n[2*e]=s>>>8,n[2*e+1]=s%256}return n},decompressFromUint8Array:function(o){if(null==o)return i.decompress(o);for(var n=new Array(o.length/2),e=0,t=n.length;e<t;e++)n[e]=256*o[2*e]+o[2*e+1];var s=[];return n.forEach(function(o){s.push(r(o))}),i.decompress(s.join(""))},compressToEncodedURIComponent:function(r){return null==r?"":i._compress(r,6,function(r){return n.charAt(r)})},decompressFromEncodedURIComponent:function(r){return null==r?"":""==r?null:(r=r.replace(/ /g,"+"),i._decompress(r.length,32,function(o){return t(n,r.charAt(o))}))},compress:function(o){return i._compress(o,16,function(o){return r(o)})},_compress:function(r,o,n){if(null==r)return"";var e,t,i,s={},u={},a="",p="",c="",l=2,f=3,h=2,d=[],m=0,v=0;for(i=0;i<r.length;i+=1)if(a=r.charAt(i),Object.prototype.hasOwnProperty.call(s,a)||(s[a]=f++,u[a]=!0),p=c+a,Object.prototype.hasOwnProperty.call(s,p))c=p;else{if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++),s[p]=f++,c=String(a)}if(""!==c){if(Object.prototype.hasOwnProperty.call(u,c)){if(c.charCodeAt(0)<256){for(e=0;e<h;e++)m<<=1,v==o-1?(v=0,d.push(n(m)),m=0):v++;for(t=c.charCodeAt(0),e=0;e<8;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}else{for(t=1,e=0;e<h;e++)m=m<<1|t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t=0;for(t=c.charCodeAt(0),e=0;e<16;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1}0==--l&&(l=Math.pow(2,h),h++),delete u[c]}else for(t=s[c],e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;0==--l&&(l=Math.pow(2,h),h++)}for(t=2,e=0;e<h;e++)m=m<<1|1&t,v==o-1?(v=0,d.push(n(m)),m=0):v++,t>>=1;for(;;){if(m<<=1,v==o-1){d.push(n(m));break}v++}return d.join("")},decompress:function(r){return null==r?"":""==r?null:i._decompress(r.length,32768,function(o){return r.charCodeAt(o)})},_decompress:function(o,n,e){var t,i,s,u,a,p,c,l=[],f=4,h=4,d=3,m="",v=[],g={val:e(0),position:n,index:1};for(t=0;t<3;t+=1)l[t]=t;for(s=0,a=Math.pow(2,2),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;c=r(s);break;case 2:return""}for(l[3]=c,i=c,v.push(c);;){if(g.index>o)return"";for(s=0,a=Math.pow(2,d),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;switch(c=s){case 0:for(s=0,a=Math.pow(2,8),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 1:for(s=0,a=Math.pow(2,16),p=1;p!=a;)u=g.val&g.position,g.position>>=1,0==g.position&&(g.position=n,g.val=e(g.index++)),s|=(u>0?1:0)*p,p<<=1;l[h++]=r(s),c=h-1,f--;break;case 2:return v.join("")}if(0==f&&(f=Math.pow(2,d),d++),l[c])m=l[c];else{if(c!==h)return null;m=i+i.charAt(0)}v.push(m),l[h++]=i+m.charAt(0),i=m,0==--f&&(f=Math.pow(2,d),d++)}}};return i}();"function"==typeof define&&define.amd?define(function(){return LZString}):"undefined"!=typeof module&&null!=module?module.exports=LZString:"undefined"!=typeof angular&&null!=angular&&angular.module("LZString",[]).factory("LZString",function(){return LZString});

