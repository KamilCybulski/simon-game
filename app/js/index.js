import 'babel-polyfill';
import '../scss/index.scss';

import s1 from '../sounds/correct.mp3';
import s2 from '../sounds/wrong.mp3';
import s3 from '../sounds/killedkenny.mp3'
/*=================================================================
CONSTANTS
=================================================================*/

const GAME_LENGTH = 5;
const SPEED = 1000;
const DISPLAY_TIME = 1000
const START_BTN = document.querySelector('.start-btn');
const STRICT_BTN = document.querySelector('.strict-btn');
const CIRCLE = document.querySelector('.circle');
const RED = document.querySelector('.top-left');
const BLUE = document.querySelector('.top-right');
const GREEN = document.querySelector('.bot-left');
const YELLOW = document.querySelector('.bot-right');
const colors = [RED, BLUE, GREEN, YELLOW];
const successSound = new Audio(s1);
const failSound = new Audio(s2);
const killSound = new Audio(s3)



/*=================================================================
DATA DEFINITIONS
=================================================================*/

class Game {
  constructor(strict) {
    this.list = [];
    this.turn = 0;
    this.strict = strict;
    this.won = false;
    this.lost = false;
  };
}


/*=================================================================
FUNCTIONS
=================================================================*/

/**
 * takes a promise-aware generator as a first param, calls it and 
 * exhausts the recieved iterator.
 * game param is for passing a game object
 * loop param is a boolean indicating if runner should restart if any
 * of the promises in the chain rejects
 * cb is a callback function to be called after the iterator is exhausted
 */
const runner = (gen, game, loop, cb) => {
  let it = gen(game);

  return Promise.resolve()
    .then(function handleNext(val) {
      let next = it.next(val)
      return (function handleResult(next) {
        if(next.done) {
          if(cb && typeof cb === 'function') {
            cb();
          }
          return next.value;
        }
        else {
          return Promise.resolve(next.value)
            .then(
              handleNext,
              () => {
                if(loop && !game.strict) {
                  runner(gen, game, loop);
                }
                else {
                  if(cb && typeof cb === 'function') {
                    cb();
                  }
                  return undefined;
                }
              })
        }
      })(next);
    })
}

const signalFailure = (bool) => {
  if(bool) {
    killSound.play();
  }
  else {
    failSound.currentTime = 0;
    failSound.play();
  }
};

const signalSuccess = () => {
  successSound.currentTime = 0;
  successSound.play();
}

/**
 * waits for a player to click the circle
 * resolves a promise if a player clicks correct part of the circle
 * rejects a promise if players clicks any other part of the circle
 * color is one of the colors
 * strict is a boolean, indicating if game is ran is strict mode
 */
const waitForClick = (color, strict) => new Promise((resolve, reject) => {
  CIRCLE.addEventListener('click', function circleClickHandler(e) {
    if(e.target === color) {
      signalSuccess();
      resolve();
    }
    else {
      signalFailure(strict);
      reject();
    }
    CIRCLE.removeEventListener('click', circleClickHandler);
  });
});

/**
 * generator that yields all the colors accumulated in the game.list
 * and waits for the user to click the proper button
 */
function *playersInput(game) {
  for (const color of game.list) {
    yield waitForClick(color);
  }
}

/**
 * increments game turn by 1
 * pusches random color onto list
 */
const updateState = (game) => {
  game.turn++;
  game.list.push(colors[Math.floor(Math.random() * colors.lenght)]);
};


const highlightColor = (color) => new Promise((resolve, reject) => {
  color.classList.add('highlighted');
  setTimeout(() => {
      color.classList.remove('highlighted');
      resolve();
    }, DISPLAY_TIME);
});

function *displayColors(game) {
  for (const color of game.list) {
    yield highlightColor(color);
  }
}


// const playTurn = (g) =>
//   checkIfWin(playersMove(displayColors(updateState(g))));

const logger = () => {console.log('ENDED')};

START_BTN.addEventListener('click', () => {
  let game = new Game(false);

  game.list.push(RED, BLUE, GREEN, YELLOW);

  
  (function play(g) {
    return new Promise((resolve, reject) => {
      runner(displayColors, g, false, resolve)
    })
    .then(
      () => runner(playersInput, g, true)
    )
    .then(
      () => {console.log('Yupieeee')}
    )
  })(game);
});