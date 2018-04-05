#!/usr/bin/env node

const five = require('johnny-five');

const board = new five.Board();


// enable arduino
board.on('ready', function() {

  var stepper = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: 200,
    pins: {
      step: 2,
      dir: 3
    }
  });

  stepper.rpm(400).cw().step(500, function() {
  	console.log('hand pointed at icons');
  	stepper.rpm(400).ccw().step(900, function() {
      console.log('hand pointed at icons');
  	});
  });

  this.on("exit", function() {
  });

});

