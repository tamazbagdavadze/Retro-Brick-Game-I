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

    var maxScoreName = 'RetroBrickGameI';

    var domElement = null;
    var infoDomElement = null;
    var levelDomElement = null;
    var scoreDomElement = null;
    var maxScoreDomElement = null;
    var ctx = null;
    var screenWidth = null;
    var screenHeight = null;
    var squareWidth = null;
    var screenHeightSegments = 20;
    var screenWidthSegments = 10;
    var interval = 200;
    var intervalLimit = 80;
    var intervalId = null;
    var score = 0;
    var level = 0;

    var direction = {left : 0, right : 1};

    var arr = null;

    var player = {
      squares : [],
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
                  return x > 9 || x < 0;
                }).length == 0;
      },
      resetLocation : function(){
        this.squares = [{x:4, y:screenHeightSegments - 1},
                        {x:5, y:screenHeightSegments - 1},
                        {x:6, y:screenHeightSegments - 1},
                        {x:5, y:screenHeightSegments - 2}
                       ];
      },
      shoot : function(){
        var x = this.squares[1];

        for (let y = 0; y < screenHeightSegments - 3; y++) {
          arr[y][loc.x]
        }
      }
    };

    function generateRandomLine(argument) {
      var arr = new Array(screenWidthSegments);

      for (let i = 0; i < screenWidthSegments; i++) {
        arr[i] = Math.floor(Math.random() * 100) % 3 ? 0 : 1;
      }

      return arr;
    }

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

        console.log(squareWidth);

        domElement.setAttribute('height', screenHeight);
        domElement.setAttribute('width', screenWidth);

        render();
    }

    function keyDown(e) {
        switch (e.which) {

            /* left */
            case 37:
                {
                  player.move(direction.left);
                    break;
                }
                /*right*/
            case 39:
                {
                  player.move(direction.right);
                    break;
                }
        }
    }

    function setScore(newScore) {
        score = newScore;
        if (score % 10 === 0 && score !== 0) {
            setLevel(Math.floor(score / 10));
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

    function setLevel(newLevel) {

        level = newLevel;
        levelDomElement.innerText = "level : " + newLevel + ".  ";

        if (interval > intervalLimit && newLevel !== 0) {
            interval -= 30;
            clearInterval(intervalId);
            intervalId = setInterval(oneStep, interval);
        } else
        if (interval <= intervalLimit && interval + 20 > intervalLimit) {
            interval -= 2;
            clearInterval(intervalId);
            intervalId = setInterval(oneStep, interval);
        }
    }

    function restart() {

        setScore(0);
        setLevel(0);

        interval = 200;

        render();
    }

    function initPlayer() {
      player.resetLocation();
    }

    function initEnemy(){
      arr = get2dArray(screenHeightSegments, screenWidthSegments);

      for (let y = 0; y < screenHeightSegments - 16; y++) {
        arr[y] = generateRandomLine();
      }

    }

    function drawEnemy() {
      for (let y = 0; y < screenHeightSegments; y++) {
        for (let x = 0; x < screenWidthSegments; x++) {
          if(arr[y][x] === 1)
            drawSquare(x, y);
        }
      }
    }

    function drawPlayer(){
      player.draw();
    }

    function isEmptyLine(lineArr){
      return lineArr.filter(function(i){return i === 1;}).length === 0;
    }

    function step() {
      for (let y = screenHeightSegments-2; y > 0; y--) {
        arr[y] = arr[y - 1];
      }

      arr[0] = generateRandomLine();
    }

    function initEvents() {
      window.addEventListener('resize', resize);
      window.addEventListener('keydown', keyDown);
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

        initEnemy();
        initPlayer();

        restart();
        resize();

        setInterval(function(){
          step();
        },800);
    }

    function clear() {
        ctx.clearRect(0, 0, screenWidth, screenHeight);
    }

    function render() {
        clear();

        drawEnemy();
        drawPlayer();

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
        }
    };
}());

window.onload = function() {
    RetroBrickGameI.setDomElement(document.getElementById('canvas'));
    RetroBrickGameI.setInfoDomElement(document.getElementById('info'));
    RetroBrickGameI.start();
};
