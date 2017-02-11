(function(setData) {
    'use strict';


    function getElem(key, type) {
        if(type === 'id') {
            return document.getElementById(key);
        }
    }

    function getElemByPos(row, col) {
        return getElem('cell-' + row + '-' + col, 'id');
    }

    // self.modalIntro = getElem('intro', 'id');
    // self.modalGameOver = getElem('game-over', 'id');

    getElem('btn-start','id').addEventListener('click', function() {
        game.start();
        // game.modalIntro.className += ' hide';
    });

    getElem('btn-restart','id').addEventListener('click', function() {
        game.restart();
    });

    var game = {
        'speed':0, // ms
        'currentBlock':{
            'rotationSet':[],
            'rotationIdx':0,
            'cellList':[],
            'pivot':[]
        },
        'currentBlockIdx':0,
        'nextBlockIdx':0,
        'init':function() {
            var self = this;
            self.modalIntro = getElem('intro', 'id');
            self.modalGameOver = getElem('game-over', 'id');
            board.init();
            self.nextBlockIdx = Math.floor(Math.random() * setData.blockSet.length);
            self.generateBlock();
        },
        'restart':function() {
            var self = this;
            board.clear();
            self.init();
            self.start();
            if(!self.modalGameOver.className.includes('hide')) {
                self.modalGameOver.className += ' hide';
            }
        },
        'start':function() {
            var self = this;
            self.mappingKey();
            if(!self.modalIntro.className.includes('hide')) {
                self.modalIntro.className += ' hide';
            }
            tic.start(this.currentBlock, 700);
        },
        'end':function() {
            var self = this;
            tic.clear();
            self.destroyKey();
            self.modalGameOver.className = 'modal';
        },
        'mappingKey':function() {
            var self = this;
            document.body.onkeydown = function(e) {
                switch (e.keyCode) {
                    case setData.leftKeyCode:
                        e.preventDefault();
                        board.moveBlock(self.currentBlock, 'left', 1);
                        break;

                    case setData.rightKeyCode:
                        e.preventDefault();
                        board.moveBlock(self.currentBlock, 'right', 1);
                        break;

                    case setData.downKeyCode:
                        e.preventDefault();
                        board.moveBlock(self.currentBlock, 'down', 1);
                        break;

                    case setData.upKeyCode:
                        e.preventDefault();
                        board.rotateBlock(self.currentBlock);
                        break;

                    case setData.spaceKeyCode:
                        e.preventDefault();
                        board.hardDrop(self.currentBlock);
                        self.generateBlock();
                        break;

                    default: break;
                }
            }
        },
        'destroyKey':function() {
            document.body.onkeydown = function() {};
        },
        'generateBlock':function() {
            var self = this,
                row, col;

            self.currentBlockIdx = self.nextBlockIdx;
            board.removeNextBlock(setData.blockSet[self.nextBlockIdx][0]);
            self.nextBlockIdx = Math.floor(Math.random() * setData.blockSet.length);

            if(self.currentBlock.cellList.length !== 0) {
                self.currentBlock.cellList = [];
                self.currentBlock.rotationSet = [];
                self.currentBlock.rotationIdx = 0;
                self.currentBlock.pivot = [setData.startRow, setData.startCol];
            }

            var curBlockIdx = self.currentBlockIdx,
                curBlockRotIdx = self.currentBlock.rotationIdx,
                i, j, t;

            // 생성될 블락이 회전할 수 있는 경우의 수를 복사한다.
            for(i = 0; i < setData.blockSet[curBlockIdx].length; i++) {
                t = [];
                for(j = 0; j < setData.blockSet[curBlockIdx][i].length; j++) {
                    t.push(setData.blockSet[curBlockIdx][i][j].slice());
                }
                self.currentBlock.rotationSet.push(t);
            }

            // 블락 셋 중의 하나를 가져와 currentBlock에 복사한다.
            for(i = 0; i < self.currentBlock.rotationSet[0].length; i++) {
                self.currentBlock.cellList.push(setData.blockSet[curBlockIdx][curBlockRotIdx][i].slice());
            }

            for(i = 0; i < self.currentBlock.cellList.length; i++) {
                self.currentBlock.cellList[i][0] += setData.startRow;
                self.currentBlock.cellList[i][1] += setData.startCol;
            }

            for(i = 0; i < self.currentBlock.cellList.length; i++) {
                if(board.matrix[self.currentBlock.cellList[i][0]][self.currentBlock.cellList[i][1]] === 1) {
                    self.end();
                    return;
                }
            }

            self.currentBlock.pivot = [setData.startRow, setData.startCol];

            board.generateBlock(self.currentBlock.cellList, setData.colorSet[self.currentBlockIdx],
                                setData.blockSet[self.nextBlockIdx][0], setData.colorSet[self.nextBlockIdx]);
        }
    };

    var tic = {
        'start':function(block, speed){
            this._tic = setInterval(function() {
                if(board.canBlockMove(block.cellList, 'down', 1)) {
                    board.moveBlock(block, 'down', 1)
                } else {
                    board.putBlock(block);
                    game.generateBlock();
                }
            }, speed);
        },
        'clear':function() {
            if(this._tic !== undefined) {
                clearInterval(this._tic);
            }
        }
    };

    var board = {
        'matrix':[],
        'clear':function() {
            var self = this,
                board = getElem('board', 'id'),
                next = getElem('next', 'id'),
                row, col;

            while(board.lastChild) {
                board.removeChild(board.lastChild);
            }

            while(next.lastChild) {
                next.removeChild(next.lastChild);
            }

            for(row = 0; row < setData.maxRowNum; row++) {
                self.matrix[row] = [];
                for(col = 0; col < setData.maxColNum; col++) {
                    self.matrix[row][col] = 0;
                }
            }
        },
        'init':function() {
            var board = getElem('board', 'id'),
                self = this,
                cell,
                row, col,
                row_elem,
                label,
                next;

            if(setData.debug) {
                board.style.cssText = 'width: 220px';

                row_elem = document.createElement('div');
                row_elem.className = 'row';

                for(col = setData.maxColNum - 1; col >= 0; col--) {
                    label = document.createElement('div');
                    label.innerText = '' + col;
                    label.className = 'col-label';
                    row_elem.appendChild(label);
                }

                board.appendChild(row_elem);
            } else {
                board.style.cssText = 'width: 200px';
            }

            // next block 보여주는 매트릭스.
            next = getElem('next', 'id');
            for(row = 0; row < 3; row++) {
                row_elem = document.createElement('div');
                row_elem.className = 'row';
                next.appendChild(row_elem);

                for(col = 0; col < 4; col++) {
                    cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.id = 'next-' + row + '-' + col;
                    row_elem.appendChild(cell);
                }
            }

            for(row = 0; row < setData.maxRowNum; row++) {
                row_elem = document.createElement('div');
                row_elem.className = 'row';

                if(setData.debug) {
                    label = document.createElement('div');
                    label.className = 'row-label';
                    label.innerText = '' + row;
                    row_elem.appendChild(label);
                }

                if(!setData.debug && row <= setData.hideRowNum) {
                    row_elem.className += ' hide';
                }

                board.appendChild(row_elem);

                for(col = 0; col < setData.maxColNum; col++) {
                    cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.id = 'cell-' + row + '-' + col;
                    row_elem.appendChild(cell);
                }
            }

            for(row = 0; row < setData.maxRowNum; row++) {
                self.matrix[row] = [];
                for(col = 0; col < setData.maxColNum; col++) {
                    self.matrix[row][col] = 0;
                }
            }
        },
        'generateBlock': function(cellList, color, nextCellList, nextColor) {
            var self = this;

            self.renderBlock(cellList, color);
            self.renderNextBlock(nextCellList, nextColor);

        },
        'renderBlock':function(cellList, color){
            var cell;
            for(var i = 0; i < cellList.length; i++) {
                cell = getElemByPos(cellList[i][0], cellList[i][1]);
                if(!color) {
                    cell.style.cssText = 'background-color:'+cellList[i][2];
                } else {
                    cell.style.cssText = 'background-color:'+color;
                }
            }
        },
        'removeBlock':function(cellList, type){
            var cell;
            for(var i = 0; i < cellList.length; i++) {
                if(type == 'down') cell = getElemByPos(cellList[i][0]-1, cellList[i][1]);
                else if(type == 'left') cell = getElemByPos(cellList[i][0], cellList[i][1]+1);
                else if(type == 'right') cell = getElemByPos(cellList[i][0], cellList[i][1]-1);
                else if(type == 'rotate' || type == 'hardDrop' || type == 'breakLine')
                    cell = getElemByPos(cellList[i][0], cellList[i][1]);

                cell.style.cssText = 'background-color:'+'none;';
            }
        },
        'renderNextBlock':function(bl, color) {
            var cell;
            for(var i = 0; i < bl.length; i++) {
                cell = getElem('next-'+bl[i][0]+'-'+bl[i][1], 'id');
                cell.style.cssText = 'background-color:'+color;
            }
        },
        'removeNextBlock':function(cellList) {
            var cell;
            for(var i = 0; i < cellList.length; i++) {
                cell = getElem('next-'+cellList[i][0]+'-'+cellList[i][1], 'id');
                cell.style.cssText = 'background-color:'+'none;';
            }
        },
        'moveBlock':function(block, dir, cnt){
            var self = this;
            if(self.canBlockMove(block.cellList, dir, cnt)) {
                self.moveBlockPos(block, dir, cnt);
                self.removeBlock(block.cellList, dir);
                self.renderBlock(block.cellList, setData.colorSet[game.currentBlockIdx]);
            }
        },
        'moveBlockPos':function(block, dir, cnt) {
            // rotPivot이 matrix의 크기를 넘어갈 경우 대응?
            if(dir === 'down') block.pivot[0] += cnt;
            else if(dir === 'left') block.pivot[1] -= cnt;
            else if(dir === 'right') block.pivot[1] += cnt;
            else if(dir === 'up') block.pivot[0] -= cnt;

            var self = this,
                tempColor;

            for(var i = 0; i < block.cellList.length; i++) {
                if(block.cellList[i].length === 3) {
                    tempColor = block.cellList[i][2];
                }
                block.cellList[i] = self.moveCellPos(block.cellList[i][0], block.cellList[i][1], dir, cnt);
                block.cellList[i].push(tempColor)
            }

            return block.cellList;
        },
        'moveCellPos': function(row, col, dir, cnt) {
            if(dir === 'down' || dir === 'breakLine') row += cnt;
            else if(dir === 'left') col -= cnt;
            else if(dir === 'right') col += cnt;
            else if(dir === 'up') row -= cnt;

            return [row, col];
        },
        'canBlockMove':function(cellList, dir, cnt) {
            var self = this,
                row, col;

            for(var i = 0; i < cellList.length; i++) {
                if(dir === 'down') {
                    row = cellList[i][0] + cnt;
                    col = cellList[i][1]
                }else if(dir === 'left') {
                    row = cellList[i][0];
                    col = cellList[i][1] - cnt
                }else if(dir === 'right') {
                    row = cellList[i][0];
                    col = cellList[i][1] + cnt;
                }else if(dir === 'up') {
                    row = cellList[i][0] - cnt;
                    col = cellList[i][1];
                }

                if(row < 0 || row >= setData.maxRowNum || col < 0 || col >= setData.maxColNum || self.matrix[row][col] === 1) {
                    return false;
                }
            }
            return true;
        },
        'rotateBlock':function(block) {
            var nextRotIdx = (block.rotationIdx + 1) % (block.rotationSet.length),
                nextRotBlock = {'pivot':[], 'cellList':[]},
                overCells = [],
                self = this,
                canRotate = false,
                i, cnt;

            self.removeBlock(block.cellList, 'rotate');

            for(i = 0; i < block.rotationSet[nextRotIdx].length; i++) {
                nextRotBlock.cellList.push(block.rotationSet[nextRotIdx][i].slice());
            }

            for(i = 0; i < nextRotBlock.cellList.length; i++) {
                nextRotBlock.cellList[i][0] += block.pivot[0];
                nextRotBlock.cellList[i][1] += block.pivot[1];
            }

            nextRotBlock.pivot = block.pivot.slice();

            for(i = 0; i < nextRotBlock.cellList.length; i++) {
                if(nextRotBlock.cellList[i][1] >= setData.maxColNum ||
                   nextRotBlock.cellList[i][0] >= setData.maxRowNum ||
                   nextRotBlock.cellList[i][1] < 0 ||
                    self.matrix[nextRotBlock.cellList[i][0]][nextRotBlock.cellList[i][1]] === 1) {
                    console.log('매트릭스 범위를 벗어나거나, 쌓인 블록과 충돌할 위험.');
                    overCells.push(nextRotBlock.cellList[i].slice());
                }
            }

            if(overCells.length === 0) {
                console.log('충돌없음. 회전해라.');
                block.rotationIdx = nextRotIdx;
                block.cellList = [];

                for(i = 0; i < nextRotBlock.cellList.length; i++) {
                    block.cellList.push(nextRotBlock.cellList[i].slice());
                }

            } else if(overCells.length === 1) {
                if(self.canBlockMove(nextRotBlock.cellList, 'left', 1)) self.moveBlockPos(nextRotBlock, 'left', 1);
                else if(self.canBlockMove(nextRotBlock.cellList, 'right', 1)) self.moveBlockPos(nextRotBlock, 'right', 1);
                else if(self.canBlockMove(nextRotBlock.cellList, 'up', 1)) self.moveBlockPos(nextRotBlock, 'up', 1);
                else if(self.canBlockMove(nextRotBlock.cellList, 'down', 1)) self.moveBlockPos(nextRotBlock, 'down', 1);
                else return;

                block.rotationIdx = nextRotIdx;
                block.cellList = [];
                block.pivot = nextRotBlock.pivot.slice();

                for(i = 0; i < nextRotBlock.cellList.length; i++) {
                    block.cellList.push(nextRotBlock.cellList[i].slice());
                }

            } else if(overCells.length >= 2) {
                var temp = { 'cellList':[], 'pivot':[] };

                for(i = 0; i < nextRotBlock.cellList.length; i++) {
                    temp.cellList.push(nextRotBlock.cellList[i].slice());
                }

                for(cnt = 1; cnt <= overCells.length; cnt++) {
                    if(temp.cellList.length !== 0) temp.cellList = [];

                    for(i = 0; i < nextRotBlock.cellList.length; i++) {
                        temp.cellList.push(nextRotBlock.cellList[i].slice());
                    }

                    temp.pivot = nextRotBlock.pivot.slice();

                    if(self.canBlockMove(nextRotBlock.cellList, 'left', cnt)) {
                        self.moveBlockPos(nextRotBlock, 'left', cnt);
                        canRotate = true;
                        break;
                    } else if(self.canBlockMove(nextRotBlock.cellList, 'right', cnt)) {
                        self.moveBlockPos(nextRotBlock, 'right', cnt);
                        canRotate = true;
                        break;
                    } else if(self.canBlockMove(nextRotBlock.cellList, 'up', cnt)) {
                        self.moveBlockPos(nextRotBlock, 'up' ,cnt);
                        canRotate = true;
                        break;
                    } else if(self.canBlockMove(nextRotBlock.cellList, 'down', cnt)) {
                        self.moveBlockPos(nextRotBlock, 'down', cnt);
                        canRotate = true;
                        break;
                    }
                }

                if(canRotate) {
                    block.rotationIdx = nextRotIdx;
                    block.cellList = [];
                    block.pivot = nextRotBlock.pivot.slice();

                    for(i = 0; i < nextRotBlock.cellList.length; i++) {
                        block.cellList.push(nextRotBlock.cellList[i].slice());
                    }
                } else {
                    console.log('회전을 시도했지만 이동할 할 수 없어 회전 안됨.');
                }
            } else {
                console.log('그냥 회전 ');
            }

            self.renderBlock(block.cellList, setData.colorSet[game.currentBlockIdx]);
        },
        'hardDrop':function(block) {
            var self = this;
            self.removeBlock(block.cellList, 'hardDrop');

            while(self.canBlockMove(block.cellList, 'down', 1)) {
                self.moveBlockPos(block, 'down', 1);
            }

            self.renderBlock(block.cellList, setData.colorSet[game.currentBlockIdx]);
            self.putBlock(block);
        },
        'putBlock':function(block) {
            var breakingRows = [],
                self = this,
                row, col,
                i;

            for(i = 0; i < block.cellList.length; i++) {
                self.matrix[block.cellList[i][0]][block.cellList[i][1]] = 1;
            }

            // 블락이 어디에 꽂혔는지 (몇행 몇행 에 꽂혔는지 검사한다.)
            for(i = 0; i < block.cellList.length; i++) {
                if(breakingRows.indexOf(block.cellList[i][0]) === -1) {
                    breakingRows.push(block.cellList[i][0]);
                }
            }

            breakingRows = breakingRows.filter(function(row){
                if(self.matrix[row].indexOf(0) === -1) {
                    return row;
                }
            });

            if(breakingRows.length > 0) {
                breakingRows.sort();
                // 부숴져야 할 행을 구했다.
                // 이제 부숴져야 할 행들을 boardMap과 html view에서 삭제 처리한다.
                var breakingLine;

                for(i = breakingRows.length - 1; i >= 0; i--) {
                    breakingLine = [];

                    // boardMap에서 삭제 처리.
                    for(col = 0; col < setData.maxColNum; col++) {
                        self.matrix[breakingRows[i]][col] = 0;

                        // removeBlock으로 view에서 삭제 처리.
                        // removeBlock은 쉘([row, col]) 배열 형태[[row,col],[row,col....],...]의 매개변수만 처리 가능.
                        breakingLine.push([breakingRows[i],col]);
                    }

                    self.removeBlock(breakingLine, 'breakLine');
                }

                // 부셔야할 행을 찾았다.. (부숴진 행을 제외한) 나머지 행들을 아래서부터 끌어내린다.
                var color;
                var dropLineInfo = [];

                for(row = setData.maxRowNum - 1; row >= 0; row--) {
                    if(breakingRows.indexOf(row) === -1) {
                        for(col = 0; col < setData.maxColNum; col++) {
                            color = getElemByPos(row, col).style.backgroundColor;
                            dropLineInfo.push([row, col, color]);
                        }

                        self.removeBlock(dropLineInfo, 'breakLine');

                        for(i = 0; i < dropLineInfo.length; i++) {
                            self.matrix[dropLineInfo[i][0]][dropLineInfo[i][1]] = 0;
                        }

                        while(self.canBlockMove(dropLineInfo, 'down', 1)) {
                            dropLineInfo = self.moveBlockPos({'cellList':dropLineInfo}, 'breakLine', 1);
                        }

                        self.renderBlock(dropLineInfo);

                        for(i = 0; i < dropLineInfo.length; i++) {
                            if(dropLineInfo[i][2] !== '') {
                                self.matrix[dropLineInfo[i][0]][dropLineInfo[i][1]] = 1;
                            }
                        }

                        dropLineInfo = [];
                    }
                }
            }
        }
    };

    game.init();
    // game.start();

}(globalSetData));