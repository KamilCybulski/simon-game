import '../scss/index.scss';
import 'babel-polyfill';

import correct from '../sounds/correct.mp3';
import wrong from '../sounds/wrong.mp3';
import kill from '../sounds/killedkenny.mp3'

/*=================================================================
CONSTANTS
=================================================================*/
const gameLength = 5;
const speed = 1000;
const RED = document.querySelector('.top-left');
const BLUE = document.querySelector('.top-right');
const GREEN = document.querySelector('.bot-left');
const YELLOW = document.querySelector('.bot-right');
const colors = [RED, BLUE, GREEN, YELLOW];
const successSound = new Audio(correct);
const failSound = new Audio(wrong);
const killSound = new Audio(kill);


/*=================================================================
DATA DEFINITIONS
=================================================================*/

class Game {
  constructor(list, turn, strict, win, loose, pMp){
    this.list = list;
    this.turn = turn;
    this.strict = strict;
    this.win = win
    this.loose = loose;
    this.playersMovePhase = pMp;
  };

  updateState() {
    this.turn++;
    this.list.push(colors[Math.floor(Math.random() * colors.lenght)]);
  }
}


/*=================================================================
FUNCTIONS
=================================================================*/

const waitForClick = (btn) => new Promise((resolve, reject) => {
  console.log(`Click ${btn.className}`);
  const circle = document.querySelector('.circle');
  circle.addEventListener('click', function resolver(e) {
    if(e.target === btn) {
      successSound.currentTime = 0;
      successSound.play();
      resolve();
    }
    else {
      if(G1.strict) {
        killSound.play();
      }
      else {
        failSound.currentTime = 0;
        failSound.play();
      }
      reject();
    }
    circle.removeEventListener('click', resolver);
  });
});



/*=================================================================
SETUP
=================================================================*/
const G1 = new Game([RED, BLUE, GREEN, YELLOW], 0, true, false, false, false);

const runner = (gen) => {

  let it = gen();
  return Promise.resolve()
    .then(function handleNext(val) {
      let next = it.next(val)
      return (function handleResult(next) {
        if(next.done) {
          return next.value;
        }
        else {
          return Promise.resolve(next.value)
            .then(handleNext,
                  () => {
                    if(G1.strict) {
                      G1.loose = true;
                      return;
                    }
                    else {
                      runner(gen);
                    }
                  })
        }
      })(next);
    })
}

function *gen() {
  let i = 0;
  while (i < G1.list.length) {
    yield waitForClick(G1.list[i++]);
  }
}


const t = document.querySelector('.start-btn');
t.addEventListener('click', () => {
  runner(gen);
});