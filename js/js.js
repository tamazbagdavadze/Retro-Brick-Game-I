/**
 * Created by tazo on 01/09/2016.
 */

'use strict';

function get2dArray(x, y, value){
  var arr = new Array(x);
  var length = arr.length;

  for(let i = 0; i < arr.length; i++){
    arr[i] = new Array(y);

    if(value === undefined)
      continue;

    for(let j = 0; j < y; j++){
      if(typeof(value) === "object" && value !== null)
      {
        arr[i][j] = Object.assign({}, value);
      }
      else{
        arr[i][j] = value;
      }
    }

  }

  return arr;
}

var RetroBrickGameI = (function() {

    var maxScoreName = 'RetroBrickGameI_MaxScore';
    var gamesPlayedName = 'RetroBrickGameI_GamesPlayed'

    var domElement = null;
    var infoDomElement = null;
    var levelDomElement = null;
    var scoreDomElement = null;
    var maxScoreDomElement = null;
    var gamesPlayedElement = null;
    var ctx = null;
    var screenWidth = null;
    var screenHeight = null;
    var squareWidth = null;
    var screenHeightSegments = 20;
    var screenWidthSegments = 10;
    var interval = 600;
    var intervalLimit = 200;
    var shootingInterval = 260;
    var shootingIntervalLimit = 60;
    var enemyMovingFuncIntervalId = null;
    var score = 0;
    var level = 0;

    var playerMovingFuncIntervalId = null;
    var shootingIntervalId = null;

    var direction = {left : 0, right : 1};

    var enemy = {
      arr: null,
      generateRandomLine : function () {
        var newLine = new Array(screenWidthSegments);

        for (let i = 0; i < screenWidthSegments; i++) {
          newLine[i] = Math.floor(Math.random() * 100) % 2 ? 0 : 1;
        }

        return newLine;
      },
      reset : function () {
        this.arr = get2dArray(screenHeightSegments, screenWidthSegments);

        for (let y = 0; y < screenHeightSegments - 16; y++) {
          this.arr[y] = this.generateRandomLine();
        }

      },
      draw : function () {
        for (let y = 0; y < screenHeightSegments; y++) {
          for (let x = 0; x < screenWidthSegments; x++) {
            if(this.arr[y][x] === 1)
              drawSquare(x, y);
          }
        }

        // this.arr.forEach(function(i){
        //   i.forEach(function(value) {
        //     if(value === 1)
        //       drawSquare(x, y);
        //   });
        // });
      },
      step : function () {

        var gameOver = this.arr[screenHeightSegments - 4].filter(function(i){
          return i === 1;
        }).length;

        if(gameOver){
          alert("წააგე! ქულა : " + score);
          restart();
        }

        for (let y = screenHeightSegments-3; y > 0; y--) {
          this.arr[y] = this.arr[y - 1];
        }

        this.arr[0] = this.generateRandomLine();
      }
    };

    var player = {
      squares : null,
      draw : function () {
        for (let crd of this.squares) {
          drawSquare(crd.x, crd.y);
        }
      },
      move : function(direction) {
        if(this.canMove(direction)){
            this.squares.forEach(function(i){i.x = [i.x - 1, i.x + 1][direction];});
          }
      },
      canMove: function(direction){
        return  this.squares.filter(function(i){
                  var x = [i.x - 1, i.x + 1][direction];
                  return x > 10 || x < -1;
                }).length == 0;
      },
      reset : function(){
        this.squares = [{x:4, y:screenHeightSegments - 1},
                        {x:5, y:screenHeightSegments - 1},
                        {x:6, y:screenHeightSegments - 1},
                        {x:5, y:screenHeightSegments - 2}
                       ];
      },
      shoot : function(){
        var x = this.squares[1].x;

        for (let y = screenHeightSegments - 3; y > 0 ; y--) {
          if(enemy.arr[y][x] == 1){
            setScore(score + 1);
            enemy.arr[y][x] = 0;
            break;
          }
        }
      }
    };


    function drawSquare(x, y) {

        x *= squareWidth;
        y *= squareWidth;

        var width = squareWidth;

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, width);

        var innerSquareWidth = width / 4;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;

        var _from = innerSquareWidth / 2;
        var to = width - _from;

        for (let i = _from; i < to; i += innerSquareWidth) {
            for (let j = to - innerSquareWidth; j > _from - innerSquareWidth; j -= innerSquareWidth) {
                ctx.fillRect(x + i, y + j, innerSquareWidth, innerSquareWidth);
                ctx.strokeRect(x + i, y + j, innerSquareWidth, innerSquareWidth);
            }
        }
    }

    //TODO crashes when height is 0
    function resize() {

        var bodyWidth = parseInt(getComputedStyle(document.body).width.slice(0, -2), 10);

        if (bodyWidth < screenWidth) { //TODO fix width change
            screenWidth = bodyWidth;
            screenHeight = screenWidth / screenWidthSegments * screenHeightSegments;
        } else {
            screenHeight = parseInt(getComputedStyle(domElement).height.slice(0, -2), 10);
            screenWidth = Math.floor(screenHeight / screenHeightSegments * screenWidthSegments);
        }

        squareWidth = Math.floor(screenWidth / screenWidthSegments);
        screenWidth = screenWidthSegments * squareWidth; // pixel perfect :v

        console.log("square width : "+squareWidth);

        domElement.setAttribute('height', screenHeight);
        domElement.setAttribute('width', screenWidth);

        render();
    }

    function keyUp(e) {
      switch (e.which) {

          case 37://left
          case 39://right
              {
                  clearInterval(playerMovingFuncIntervalId);
                  playerMovingFuncIntervalId = null;
                  break;
              }
          case 32 :
              {
                  clearInterval(shootingIntervalId);
                  shootingIntervalId = null;
                  break;
              }
      }
    }

    function keyDown(e) {
        switch (e.which) {

            /* left */
            case 37:
                {
                    if(playerMovingFuncIntervalId === null){
                      player.move(direction.left);
                      playerMovingFuncIntervalId = setInterval(function () {
                        player.move(direction.left);
                      }, 50);
                    }
                    break;
                }
                /*right*/
            case 39:
                {
                    if(playerMovingFuncIntervalId === null){
                      player.move(direction.right);
                      playerMovingFuncIntervalId = setInterval(function () {
                        player.move(direction.right);
                      }, 50);
                    }
                    break;
                }
            case 32 :
                {
                    if(shootingIntervalId === null){
                      player.shoot();
                      shootingIntervalId = setInterval(function() {
                        player.shoot();
                      }, shootingInterval);
                    }
                    break;
                }
        }
    }

    function setScore(newScore) {
        score = newScore;
        if (score % 120 === 0 && score !== 0) {
            setLevel(Math.floor(score / 120));
        }
        scoreDomElement.innerText = "score : " + score + ". ";
        updateMaxScore();
    }

    function updateMaxScore() {
        var old = localStorage.getItem(maxScoreName);

        if (old == null || old === undefined || isNaN(parseInt(old, 10))) {
            localStorage.setItem(maxScoreName, 0);
            old = 0;
        } else {
            old = parseInt(old, 10);
        }

        var maxScore = old > score ? old : score;
        maxScoreDomElement.innerText = 'max : ' + maxScore;
        localStorage.setItem(maxScoreName, maxScore);
    }

    function updateGamesPlayed() {
      var old = localStorage.getItem(gamesPlayedName);

      if (old == null || old === undefined || isNaN(parseInt(old, 10))) {
          localStorage.setItem(gamesPlayedName, 0);
          old = 0;
      } else {
          old = parseInt(old, 10);
      }

      var gamesPlayed = old + 1;
      gamesPlayedElement.innerText = 'games played : ' + gamesPlayed;
      localStorage.setItem(gamesPlayedName, gamesPlayed);
    }

    function setLevel(newLevel) {

        level = newLevel;
        levelDomElement.innerText = "level : " + newLevel + ".  ";

        if (interval > intervalLimit && newLevel !== 0) {
            interval -= 100;
            clearInterval(enemyMovingFuncIntervalId);
            enemyMovingFuncIntervalId = setInterval(function(){
              enemy.step();
            }, interval);

            if(shootingInterval > shootingIntervalLimit){
              shootingInterval -= 10;
            }

            if(shootingIntervalId != null){
              clearInterval(shootingInterval);
              player.shoot();
              shootingIntervalId = setInterval(function() {
                player.shoot();
              }, shootingInterval);
            }
        } else
        if (interval <= intervalLimit && interval + 20 > intervalLimit) {
            interval -= 2;
            clearInterval(enemyMovingFuncIntervalId);
            enemyMovingFuncIntervalId = setInterval(function(){
              enemy.step();
            }, interval);
        }
    }

    function restart() {

        updateGamesPlayed();

        clearInterval(playerMovingFuncIntervalId);
        clearInterval(enemyMovingFuncIntervalId);
        clearInterval(shootingIntervalId);

        setScore(0);
        setLevel(0);

        interval = 800;
        shootingInterval = 200;

        enemy.reset();
        player.reset();

        enemyMovingFuncIntervalId = setInterval(function(){
          enemy.step();
        }, interval);

        render();
    }

    //TODO remove
    function isEmptyLine(lineArr){
      return lineArr.filter(function(i){return i === 1;}).length === 0;
    }

    function initEvents() {
      window.addEventListener('resize', resize);
      window.addEventListener('keydown', keyDown);
      window.addEventListener('keyup', keyUp);
      window.addEventListener('touchstart', function(e) {
          localStorage.setItem('x', e.targetTouches[0].clientX);
      });
      window.addEventListener('touchend', function(e) {
          var x = parseInt(localStorage.getItem('x'), 10);

          if (x > e.changedTouches[0].clientX + 20) {
              keyDown({
                  which: 37
              });
          } else {
              if (x < e.changedTouches[0].clientX - 20)
                  keyDown({
                      which: 39
                  });
          }
      });
    }

    function init() {
        ctx = domElement.getContext('2d');

        initEvents();

        levelDomElement.innerText = 0;
        scoreDomElement.innerText = 0;

        toast("shooting : space, moving : arrows");

        restart();
        resize();
    }

    function toast(msg){
      var span = document.createElement('span');
      span.className = 'toast';
      span.innerText = msg;
      setTimeout(function() {
        span.parentNode.removeChild(span);
      }, 4000);
      document.body.appendChild(span);
    }

    function clear() {
        ctx.clearRect(0, 0, screenWidth, screenHeight);
    }

    function render() {
        clear();

        enemy.draw();
        player.draw();

        requestAnimationFrame(render);
    }

    return {
        setDomElement: function(el) {
            domElement = el;
        },
        start: function() {
            init();
        },
        setInfoDomElement: function(el) {
            infoDomElement = el;

            levelDomElement = document.createElement('span');
            levelDomElement.id = 'level';

            infoDomElement.appendChild(levelDomElement);

            scoreDomElement = document.createElement('span');
            scoreDomElement.id = 'score';

            infoDomElement.appendChild(scoreDomElement);

            maxScoreDomElement = document.createElement('span');
            maxScoreDomElement.id = maxScoreName;

            infoDomElement.appendChild(maxScoreDomElement);

            gamesPlayedElement = document.createElement('span');
            gamesPlayedElement.id = gamesPlayedName;

            infoDomElement.appendChild(gamesPlayedElement);
        }
    };
}());

window.onload = function() {
    RetroBrickGameI.setDomElement(document.getElementById('canvas'));
    RetroBrickGameI.setInfoDomElement(document.getElementById('info'));
    RetroBrickGameI.start();
};
