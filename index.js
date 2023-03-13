"use strict";

/*
TODO:
  change infinity to target time if cell is clickable
  when a cell is complete, turn the display time off
  display total play time and total progress time

*/

class App {
  constructor() {
    this.disableSaves = false;
    this.cellValues = {};
    this.completeCells = {};
    this.progressElements = {};
    this.timeElements = {};

    this.loadFromStorage();

    const parent = document.getElementById('cellsContainer');

    for (let i = 0; i < 30; i++) {
      const row = document.createElement('div');
      row.classList.add('row');
      const rowInfo = document.createElement('div');
      rowInfo.innerHTML = `<div>Point x: <span id='rowPointX${i}'>1</span></div>
      <div>Time /: <span id='rowPointD${i}'>1</span></div>
      <button type='button'>x</button><button type='button'>/</button>
      `;
      rowInfo.classList.add('rowInfo');
      //row.appendChild(rowInfo);

      for (let j = 0; j <= i; j++) {
        const button = document.createElement('div');
        button.classList.add('cell');
        button.id = `cellButton${i}_${j}`;

        const cellContent = document.createElement('div');
        cellContent.classList.add('cellContent');
        const cellValue = this.getCellVal(i, j);
        cellContent.innerText = this.formatCellVal(cellValue);
        const cellTime = document.createElement('div');
        cellTime.classList.add('cellTime');
        cellTime.innerText = 'Infinity';

        const progress = document.createElement('div');
        progress.classList.add('progress');
        this.progressElements[`${i},${j}`] = progress;
        this.timeElements[`${i},${j}`] = cellTime;
        //progress.style.transition = `all ${cellValue}s linear`;
        //progress.addEventListener('transitionend', () => {
        //  this.progressComplete(i, j);
        //});
        button.onclick = () => {
          this.cellButtonClick(button, i, j);
        };
        button.progress = progress;
        button.appendChild(progress);
        button.appendChild(cellContent);
        button.appendChild(cellTime);
        row.appendChild(button);
      }

      parent.appendChild(row);

    }

    //scroll to top middle
    setTimeout( () => {
      const scrollX = (document.body.clientWidth / 2) - (window.innerWidth / 2);
      window.scroll(scrollX, 0);
    }, 200);
    
    const topCell = document.getElementById(`cellButton${0}_${0}`);
    topCell.classList.add('cellClickable');

    setInterval(() => this.tick(), 1000 / 30);
    setInterval(() => this.saveToStorage(), 5000);
  }

  loadFromStorage() {
    const rawState = localStorage.getItem('PedroPascalsTriangle');

    this.state = {
      activeCells: []
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
    if (this.disableSaveS) {return;}

    const saveString = JSON.stringify(this.state);
    localStorage.setItem('PedroPascalsTriangle', saveString);
  }

  reset() {
    this.disableSaves = true;
    localStorage.removeItem('PedroPascalsTriangle');
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
    return this.completeCells[`${row},${col}`];
  }

  cellButtonClick(button, row, col) {

    if (this.isCellActive(row - 1, col) && this.isCellActive(row - 1, col - 1)) {

      button.progress.classList.add('progressComplete');
      //TODO: make sure cell is not already active

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
  }

  progressComplete(row, col) {
    this.completeCells[`${row},${col}`] = true;
    console.log('progress complete', row, col);
    //TODO: handle case when we are on the LAST row and there is no row+1
    if (col === 0 || this.completeCells[`${row},${col-1}`]) {
      //mark row+1 col as clickable
      const cell = document.getElementById(`cellButton${row+1}_${col}`);
      cell.classList.add('cellClickable');
    }
    if (col === row || this.completeCells[`${row},${col+1}`]) {
      //mark row+1 col+1 as clickable
      const cell = document.getElementById(`cellButton${row+1}_${col+1}`);
      cell.classList.add('cellClickable');
    }
  }

  tick() {
    this.update();
    this.draw();
  }

  update() {
    const curTime = (new Date()).getTime();
    this.state.activeCells.forEach( cell => {
      const remaining = Math.max(0, (cell.startTime + cell.duration) - curTime);
      cell.percent = Math.min(100, 100 * (curTime - cell.startTime) / cell.duration);
      cell.remaining = remaining;
      if (remaining <= 0) {
        cell.complete = true;
        this.progressComplete(cell.row, cell.col);
      }
    });

    this.state.activeCells = this.state.activeCells.filter( cell => cell.complete !== true );
  }

  draw() {
    this.state.activeCells.forEach( cell => {
      const progressElement = this.progressElements[cell.name];
      const timeElement = this.timeElements[cell.name]
      progressElement.style.height = `${cell.percent}%`;

      const timeText = this.remainingToStr(cell.remaining);
      timeElement.innerText = timeText;
    });
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

  remainingToStr(ms) {
    const timeObj = this.timeToObj(ms / 1000);

    if (timeObj.y > 0 || timeObj.d > 0 || timeObj.h > 0) {
      return `${timeObj.y}:${timeObj.d.toString().padStart(3,0)}:${timeObj.h.toString().padStart(2,0)}:${timeObj.m.toString().padStart(2,0)}`;
    } else {
      return `${timeObj.m.toString().padStart(2,0)}:${timeObj.s.toFixed(1).padStart(4,0)}`;
    }

  }


}

const app = new App();
