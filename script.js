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


    var game = {
        'currentBlock':{
            'rotationSet':[],
            'rotationIdx':0,
            'cellList':[],
            'pivot':[]
        },
        'currentBlockIdx':0,
        'nextBlockIdx':0,
        'calculateScore':function(line) {
            var self = this;

            self.line += line;

            if(line === 1) self.score += 10;
            else if(line === 2) self.score += 20;
            else if(line === 3) self.score += 40;
            else if(line === 4) self.score += 100;

            var speed = setData.initSpeed - (parseInt(self.score/setData.speedUpScore, 10)*100);

            if(speed >= setData.maxSpeed && speed < self.speed) {
                self.speed = speed;
                tic.clear();
                tic.start(self.currentBlock, self.speed);
            }

            console.log('current speed', self.speed);

            self.elemScore.innerText = self.score;
            self.elemLine.innerText = self.line
        },
        'init':function() {
            var self = this;
            board.init();
            ranking.init();
            self.mappingKey();
        },
        'start':function() {
            var self = this;

            self.popupIntro = self.popupIntro || getElem('intro', 'id');
            self.popupGameOver = self.popupGameOver || getElem('game-over', 'id');
            self.elemScore = self.elemScore || getElem('score', 'id');
            self.elemLine = self.elemLine || getElem('line', 'id');
            self.inputUsername = self.inputUsername || getElem('username', 'id');

            self.elemLine.innerText = 0;
            self.elemScore.innerText = 0;
            self.line = 0;
            self.score = 0;
            self.speed = setData.initSpeed;
            self.isScoreAdded = false;

            if(!self.popupIntro.className.includes('hide')) {
                self.popupIntro.className += ' hide';
            }

            self.isPlaying = true;
            tic.start(this.currentBlock, self.speed);
            self.nextBlockIdx = Math.floor(Math.random() * setData.blockSet.length);
            self.generateBlock();
        },
        'restart':function() {
            var self = this;

            if(!self.popupGameOver.className.includes('hide'))
                self.popupGameOver.className += ' hide';

            board.clear();
            // self.init();
            self.start();
        },
        'end':function() {
            var self = this;
            tic.clear();
            self.isPlaying = false;
            self.popupGameOver.className = 'popup';
        },
        'mappingKey':function() {
            var self = this;
            document.body.onkeydown = function(e) {
                if(!self.isPlaying) return;

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
        'generateBlock':function() {
            var self = this;

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
        },
        'addScore':function() {
            var self = this,
                username = self.inputUsername.value,
                score = self.score;

            if(!username || self.isScoreAdded) return;

            self.isScoreAdded = true;

            ranking.addScore(username, score);
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
                childOfBoard = getElem('board', 'id').childNodes,
                childOfNext = getElem('next', 'id').childNodes,
                row, col,
                i, j;

            for(i = 0; i < childOfBoard.length; i++) {
                for(j = 0; j < childOfBoard[i].childNodes.length; j++) {
                    if(childOfBoard[i].childNodes[j].className.includes('cell')) {
                        childOfBoard[i].childNodes[j].style.cssText = 'background-color: none;';
                    }
                }
            }

            for(i = 0; i < childOfNext.length; i++) {
                for(j = 0; j < childOfNext[i].childNodes.length; j++) {
                    if(childOfNext[i].childNodes[j].className.includes('cell')) {
                        childOfNext[i].childNodes[j].style.cssText = 'background-color: none; border: none;';
                    }
                }
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
                next;

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

                if(row <= setData.hideRowNum) {
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
                cell.style.cssText = 'background-color:'+color+';border:solid 1px #cccccc;';
            }
        },
        'removeNextBlock':function(cellList) {
            var cell;
            for(var i = 0; i < cellList.length; i++) {
                cell = getElem('next-'+cellList[i][0]+'-'+cellList[i][1], 'id');
                cell.style.cssText = 'background-color:'+'none;border:none;';
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

            // 블락이 어디에 꽂혔는지 (우선 몇 행을 지워야 할까?)
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

            game.calculateScore(breakingRows.length);

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

    var ranking = {
        'scoreList':[],
        'init':function() {
            var self = this;
            firebase.initializeApp(setData.firebaseConfig);

            self.firebaseAuth = firebase.auth();
            self.firebaseDB = firebase.database();
            self.elemCollections = document.getElementsByClassName('score-list')[0];

            self.firebaseAuth.signInAnonymously().then(function(user) {
                if(user) {
                    // userInfo = user.uid;
                    self.getScoreList();
                }
            });
        },
        'getScoreList':function() {
            var self = this,
                ref = self.firebaseDB.ref('scores');

            ref.on('child_added', function(data) {
                self.scoreList.push(data.val());
                self.updateRanking();
            });
        },
        'updateRanking':function() {
            var self = this,
                elemList, elemUser, elemScore;

            self.scoreList.sort(function(s1, s2){
                return s2.score - s1.score;
            });

            while(self.elemCollections.lastChild) {
                self.elemCollections.removeChild(self.elemCollections.lastChild);
            }

            for(var i = 0; i < self.scoreList.length; i++) {
                if(i == 10) {
                    break;
                }
                elemList = document.createElement('li');
                elemList.className = 'item';

                elemUser = document.createElement('span');
                elemUser.className = 'user';
                elemUser.innerText = self.scoreList[i].user;

                elemScore = document.createElement('span');
                elemScore.className = 'score';
                elemScore.innerText = self.scoreList[i].score;

                elemList.appendChild(elemUser);
                elemList.appendChild(elemScore);

                self.elemCollections.appendChild(elemList);
            }
        },
        'addScore':function(username, score) {
            if(!username) return;

            var self = this,
                ref = self.firebaseDB.ref('scores');

            ref.push({
                user:username,
                score:score
            })
        }
    };

    getElem('btn-start','id').addEventListener('click', function() {
        game.start();
    });

    getElem('btn-restart','id').addEventListener('click', function() {
        game.restart();
    });

    getElem('btn-save', 'id').addEventListener('click', function() {
        game.addScore()
    });

    game.init();

}(globalSetData));