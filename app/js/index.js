import 'babel-polyfill';
import '../scss/index.scss';

import s1 from '../sounds/correct.mp3';
import s2 from '../sounds/wrong.mp3';
import s3 from '../sounds/killedkenny.mp3'
import s4 from '../sounds/win.mp3';
/*=================================================================
CONSTANTS
=================================================================*/

const GAME_LENGTH = 4;
const DISPLAY_TIME = 300;
const DISPLAY_TIMEOUT = 200;
const START_BTN = document.querySelector('.start-btn');
const STRICT_BTN = document.querySelector('.strict-btn');
const RESET_BTN = document.querySelector('.reset-btn');
const CIRCLE = document.querySelector('.circle');
const COUNTER = document.querySelector('.counter');
const RED = document.querySelector('.top-left');
const BLUE = document.querySelector('.top-right');
const GREEN = document.querySelector('.bot-left');
const YELLOW = document.querySelector('.bot-right');
const colors = [RED, BLUE, GREEN, YELLOW];
const successSound = new Audio(s1);
const failSound = new Audio(s2);
const killSound = new Audio(s3)
const winSound = new Audio(s4);



/*=================================================================
DATA DEFINITIONS
=================================================================*/
/**
 * representes state of the game
 * list is a sequence of randomly generated colors
 * turn is a moves counter
 * strict is a boolean indicating if the game is ran in strict mode
 * lost is a boolean indicating if the player lost (strict mode only);
 */
class Game {
  constructor(strict) {
    this.list = [];
    this.turn = 0;
    this.strict = strict;
    this.lost = false;
    this.reset = false;
    this.repeat = false;
  };
}


/*=================================================================
FUNCTIONS
=================================================================*/

//--------------------------------
// UTILITIES

/**
 * takes a promise-aware generator as a first param, calls it and 
 * exhausts the recieved iterator.
 * game param is for passing a game object
 * 
 * this function is taken from YDKJS Async & Performance book
 * courtesy of Kyle Simpson
 * https://github.com/getify/You-Dont-Know-JS/blob/master/async%20%26%20
 * performance/ch4.md
 */
const run = (gen, ...args) => {
  let it = gen(...args);

  return Promise.resolve()
    .then(
      function handleNext(val) {
        let next = it.next(val);
        return (function handleResult(next) {
          if (next.done) {
            return next.value;
          }
          else {
            return Promise.resolve(next.value)
              .then(
                handleNext,
                function handleErr(err) {
                  return Promise.resolve(
                    it.throw(err)
                  ).then(handleResult)
                }
              );
          }
        })(next);
    });
};

/**
 * function for signaling if the player guessed color correctly or not
 */
const signal = (bool) => {
  if(bool) {
    successSound.currentTime = 0;
    successSound.play();
  }
  else {
    failSound.currentTime = 0;
    failSound.play();
  }
};

const resetMovesCounter = () => {
  COUNTER.firstChild.textContent = '0';
};

const updateState = (game) => {
  game.turn++;
  game.list.push(colors[Math.floor(Math.random() * colors.length)]);
  COUNTER.firstChild.textContent = game.turn;
};


const handleFinish = (game) => {
  if(!game.reset) {
    setTimeout(() => {
      resetMovesCounter();
      if(game.lost) {
        killSound.play();
      }
      else {
        winSound.play();
      }
    }, 500)
  }
};


//--------------------------------
// CORE FUNCTIONS


/**
 * returns a promise that is resolved DISPLAY_TIME miliseconds after 
 * color got highlighted
 */
const highlightColor = (color) => new Promise(resolve => {
  color.classList.add('highlighted');
  setTimeout(resolve, DISPLAY_TIME);
});

/**
 * returns a promise that is resolved DISPLAY_TIMEOUT miliseconds after 
 * color got unhighlighted
 */
const unHighlighColor = (color) => new Promise(resolve => {
  color.classList.remove('highlighted');
  setTimeout(resolve, DISPLAY_TIMEOUT);
});

/**
 * waits for a player to click the circle
 * resolves a promise if a player clicks correct part of the circle
 * rejects a promise if players clicks any other part of the circle
 * color is one of the colors
 */
const waitForClick = (color, game) => new Promise((resolve, reject) => {
  CIRCLE.addEventListener('click', function circleClickHandler(e) {
    if(e.target === color) {
      if(!game.reset) signal(true);
      resolve();
    }
    else {
      if(!game.reset) signal(false);
      reject();
    }
    CIRCLE.removeEventListener('click', circleClickHandler);
  });
});


//--------------------------------
// GENERATORS

function *displayColors(game) {
  for (const color of game.list) {
    if(!game.reset) {
      yield highlightColor(color);
      yield unHighlighColor(color);
    }
  }
}

function *playersInput(game) {
  if(!game.reset) {
    for (const color of game.list) {
      yield waitForClick(color, game);
    }
  }
}

function *inputPhase(game) {
  yield * displayColors(game);
  try { 
    yield * playersInput(game); 
  }
  catch(err) {
    if(game.strict) {
      game.lost = true;
      return Promise.reject();
    }
    else {
      yield * inputPhase(game);
    }
  }
}

function *playGame(game) {
    let i = 0;
    while (i++ < GAME_LENGTH && !game.lost) {
      updateState(game);
      yield * inputPhase(game);
    }
    return game;
}

STRICT_BTN.addEventListener('click', () => {
  STRICT_BTN.classList.toggle('pressed');
})

START_BTN.addEventListener('click', () => {
  const strict = STRICT_BTN.classList.contains('pressed')
  const game = new Game(strict);

  RESET_BTN.addEventListener('click', () => {
    resetMovesCounter();
    game.reset = true;
  })


  run(playGame, game)
    .then(handleFinish);
})

