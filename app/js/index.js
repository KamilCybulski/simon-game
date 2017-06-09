import '../scss/index.scss';
import 'babel-polyfill';

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
  btn.addEventListener('click', function resolver() {
    resolve();
    btn.removeEventListener('click', resolver);
  });
});



/*=================================================================
SETUP
=================================================================*/
const G1 = new Game([RED, BLUE, GREEN, YELLOW], 0, false, false, false, false);

const genRunner = (gen) => {

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
            .then(handleNext)
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
  genRunner(gen);
});