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
    'infoPlayTime,infoTimeRemaining,infoProgress,resetContainer,resetButton,resetYes,resetNo,winContainer,winClose,winPlayTime,linkIcon,infoNext'.split`,`.forEach( id => {
      this.UI[id] = document.getElementById(id);
    });

    this.UI.resetButton.onclick = () => this.UI.resetContainer.style.display = 'block';
    this.UI.resetYes.onclick = () => this.reset();
    this.UI.resetNo.onclick = () => this.UI.resetContainer.style.display = 'none';
    this.UI.winClose.onclick = () => this.UI.winContainer.style.display = 'none';

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
    if (this.disableSaveS) {return;}

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


}

const app = new App();
