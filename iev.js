'use strict';
const rosalindHelper = require('./rosalindHelper.js');

const debug = rosalindHelper.debug(1);
const timer = new rosalindHelper.Timer();

const scriptFilename = __filename;
const scriptBasename = scriptFilename.replace(/.*[\/\\]/, '').replace(/\..*/, '');
const inputFilename = `rosalind_${scriptBasename}.txt`;
const outputFilename = `rosalind_${scriptBasename}_out.txt`;
const output = rosalindHelper.output(outputFilename);
const R = rosalindHelper.Rosalind;

const data = rosalindHelper.readInput(inputFilename, {split: ` `, map: s => parseInt(s)});

//const data = `1 0 0 1 0 1`.split` `.map( s => parseInt(s) );

const pDom = [
  1,
  1,
  1,
  0.75,
  0.5,
  0
];

const offspringCount = 2;

const E = data.reduce( (acc, pop, i) => {
  debug.log(`for ${i} the pop is ${pop} and the pDom is ${pDom[i]}`);
  return acc + pop * pDom[i];
}, 0);

output(E * offspringCount);



timer.log();
/*
*/
