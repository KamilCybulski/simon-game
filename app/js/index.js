import 'babel-polyfill';
import '../scss/index.scss';

import s1 from '../sounds/correct.mp3';
import s2 from '../sounds/wrong.mp3';
import s3 from '../sounds/killedkenny.mp3'
import s4 from '../sounds/win.mp3';
/*=================================================================
CONSTANTS
=================================================================*/

const GAME_LENGTH = 3;
const DISPLAY_TIME = 500;
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
 */
const runner = (gen, game, addon) => {
  let it = gen(game);

  return Promise.resolve()
    .then(function handleNext(val) {
      let next = it.next(val)
      return (function handleResult(next) {
        if(next.done) {
          return next.value;
        }
        else {
          return Promise.resolve(next.value)
            .then(
              handleNext,
              function handleErr(err) {
                if (game.strict){
                  return Promise.reject()
                }
                else {
                  return Promise.resolve(
                    runner(gen, game)
                )
                .then(handleResult);
                }
              }
              )
        }
      })(next);
    })
}

/**
 * functions for displaying effects of correct and incorrect guess
 */
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
 * increments game turn by 1
 * pusches random color onto list
 */
const updateState = (game) => {
  game.turn += 1;
  game.list.push(colors[Math.floor(Math.random() * colors.length)]);
};

/**
 * returns a promise that is resolved after the color is done being highlighted
 */
const highlightColor = (color) => new Promise((resolve, reject) => {
  color.classList.add('highlighted');
  setTimeout(() => {
      color.classList.remove('highlighted');
      setTimeout(resolve, 300);
    }, DISPLAY_TIME);
});

/**
 * If game is ran in strict mode and a player fails to repeat the color
 * sequence - sets game.lost to true and resets the moves counter
 */
const checkIfLost = (game) => {
  if(game.strict) {
    game.lost = true;
    COUNTER.firstChild.textContent = 0;
  }
};

/**
 * updates moves counter
 */
const updateMovesCounter = (game) => {
  COUNTER.firstChild.textContent = game.turn;
}



//--------------------------------
// MAIN FUNCTIONALITIES


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
    yield waitForClick(color, game.strict);
  }
}

/**
 * generator that yields all the colors accumulated in the game.list
 * and waits for all of them to be properly displayed
 */
function *displayColors(game) {
  for (const color of game.list) {
    yield highlightColor(color);
  }
}

/**
 * 
 */
const gameTurn = (game) => {
  updateState(game);
  return Promise.resolve()
    .then(() => runner(displayColors, game))
    .then(() => runner(playersInput, game, displayColors))
    .then(
      () => { updateMovesCounter(game) },
      () => { checkIfLost(game) }
    )
}

function *playGame(game) {
  let i = 0;
  while (i < GAME_LENGTH && !game.lost) {
    yield gameTurn(game);
    i++;
  }
}


/*=================================================================
SETUP
=================================================================*/
let gameIsRunning = false;

const initializeGame = () => {
  if(!gameIsRunning){
    gameIsRunning = true;
    let strict = STRICT_BTN.classList.contains('pressed');
    let game = new Game(strict);
    console.log(game);

    runner(playGame, game)
      .then(
        () => {
          gameIsRunning = false;
          if(game.lost){
            console.log("You lost, sucker");
          }
          else {
            setTimeout( () => {winSound.play()}, 350);
            console.log('WIN WIN WIN!!!');
          }
        }
      )
    }
}

STRICT_BTN.addEventListener('click', () => {
  STRICT_BTN.classList.toggle('pressed')
})

START_BTN.addEventListener('click', initializeGame);

RESET_BTN.addEventListener('click', () => {
  window.location.reload();
})

