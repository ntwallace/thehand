#!/usr/bin/env node

// initialize leap & arduino vars
const leap  = require('leapjs');
const five = require('johnny-five');
const controller = new leap.Controller({frameEventName:'deviceFrame'});
const ports = [
    { id: "A", port: "/dev/cu.usbmodem14231" }, // pos1 on anker USB hub @ right laptop USB port
    { id: "B", port: "/dev/cu.usbmodem14241" }  // pos2 on anker USB hub @ right laptop USB port
  ];
const boards = new five.Boards(ports);

// initialize motor vars
let thumb, index, middle, ring, pinky, fingersMinusThumb, fingers;
let stepper;

// initialize LED vars
let rockLED, paperLED, scissorsLED, inputLEDs;
let oneLED, twoLED, threeLED, countdownLEDs;

// initialize state vars
let waitingForWave = true;
let waveLoopCount = 0;
let waitingForTrigger = true;
let settingUpGame = false;
let waitingForPlayerHand = false;

// initialize RPS game vars
let aiChoice = 0;
let computerChoice = 0;
let playerChoice = 0;
let aiWin = 0;
let playerWin = 0;
let numberGamesPlayed = 0;

// initialize overall score vars
let totalAiWin = 0;
let totalPlayerWin = 0;

// setup arduino servo outputs
boards.on('ready', function() {
  thumb = five.Servo({
                pin: 6,
                board: this.byId("A"),
                startAt: 0});
  index = five.Servo({
                pin: 5,
                board: this.byId("A"),
                startAt: 0});
  middle = five.Servo({
                pin: 4,
                board: this.byId("A"),
                startAt: 0});
  ring = five.Servo({
                pin: 3,
                board: this.byId("A"),
                startAt: 0});
  pinky = five.Servo({
                pin: 2,
                board: this.byId("A"),
                startAt: 0});
  fingersMinusThumb = five.Servos([index, middle, ring, pinky]);
  fingers = five.Servos([thumb, index, middle, ring, pinky]);

  stepper = new five.Stepper({
    type: five.Stepper.TYPE.DRIVER,
    stepsPerRev: 200,
    board: this.byId("B"),
    pins: {
      step: 2,
      dir: 3
    }
  });

  // define LEDs
  rockLED = five.Led({
    pin: 10,
    board: this.byId("A")
  });
  paperLED = five.Led({
    pin: 12,
    board: this.byId("A")
  });
  scissorsLED = five.Led({
    pin: 11,
    board: this.byId("A")
  });

  oneLED = five.Led({
    pin: 7,
    board: this.byId("A")
  });
  twoLED = five.Led({
    pin: 8,
    board: this.byId("A")
  });
  threeLED = five.Led({
    pin: 9,
    board: this.byId("A")
  });

  inputLEDs = five.Leds([rockLED, paperLED, scissorsLED]);
  countdownLEDs = five.Leds([oneLED, twoLED, threeLED]);
  allLEDs = five.Leds([rockLED, paperLED, scissorsLED, oneLED, twoLED, threeLED]);

  this.on("exit", function() {
    // cleanup function
    allLEDs.off();
  });
});

// read input from leap motion
controller.on('deviceFrame', function(frame) {
  if (settingUpGame || frame.hands.length <= 0) {
    waitingForWave = true;
    return;
  }
  //console.log('reading new frame from leap...');
  
  // only accept input if there is at least 1 hand available
  const hand = frame.hands[0];

  const inputThumb = hand.thumb;
  const inputIndex = hand.indexFinger;
  const inputMiddle = hand.middleFinger;
  const inputRing = hand.ringFinger;
  const inputPinky = hand.pinky;

  // check how many fingers are extended on that hand
  let extendedFingers = 0;
  for(let f = 0; f < hand.fingers.length; f++){
      let finger = hand.fingers[f];
      if(finger.extended) extendedFingers++;
  }

  // if player waves for more than ~3 sec trigger hand wakeup
  if (waitingForWave && frame.hands.length > 0 && (extendedFingers == 5 || extendedFingers == 10)) {
    waitingForWave = false;
  }

  // player has to give thumbs up to start game
  if (waitingForTrigger) {  
    if (extendedFingers == 1 && inputThumb.extended) {
      waitingForTrigger = false;
    }
  } else if (waitingForPlayerHand) {
    console.log('waiting for player to throw...');
    // determine what the player is throwing once game is started
    switch(extendedFingers) {
      case 0:
          console.log('rock');
          playerChoice = 3;
          setTimeout(function() {rockLED.on();}, 200);
          break;
      case 1:
          console.log('invalid input...');
          break;
      case 2:
          console.log('scissors');
          playerChoice = 2;
          rockLED.off();
          setTimeout(function() {scissorsLED.on();}, 200);
          break;
      case 3:
          console.log('invalid input...');
          break;
      case 4:
          console.log('invalid input...');
          break;
      case 5:
          console.log('paper');
          playerChoice = 1;
          rockLED.off();
          scissorsLED.off();
          setTimeout(function() {paperLED.on();}, 200);
          break;
    }
  } else {
    //console.log('Out of sync...")
  }
});

// wait until leap and arduino are online to move to first state (waiting)
setTimeout(function() { waiting(); }, 7000);

function waiting() {
  if (waitingForWave) {
    console.log('waiting for player to wave...');

    // hand taps through fingers
    pinky.max();
    setTimeout(function() { ring.max(); }, 200);
    setTimeout(function() { middle.max(); }, 400); 
    setTimeout(function() { index.max(); }, 600); 
    setTimeout(function() { thumb.max(); }, 1000);
    setTimeout(function() { fingers.min(); }, 2500);

    // wait 7 sec
    setTimeout(function() { waiting(); }, 5000);
  } else {
    waitingForTrigger = true;
    inviting();
  }
}

function inviting() {

  // icons light up one by one then flash
  rockLED.on();
    setTimeout(function() {
      rockLED.off();
      scissorsLED.on();

      setTimeout(function() { 
        scissorsLED.off();
        paperLED.on();

        setTimeout(function() {
          paperLED.off();
          console.log('RPS icons cycled/flashed')
        }, 700);
      }, 700);
    }, 700);

  // hand points to player and gives thumbs up
  fingersMinusThumb.max();
  thumb.to(165);

  setTimeout(function() { index.min(); }, 2400);
  setTimeout(function() { index.max(); thumb.min(); }, 3800)

  // get thumbs up from player
  setTimeout(function() { waitingForStart(); }, 3900);
}

function waitingForStart() {
  inputLEDs.off();

  // thumbs up from player starts game
  if (waitingForTrigger) {
    setTimeout(function() { 
      console.log('waiting for player thumbs up...');
      waitingForStart();
    }, 3000);
  } else {
    // flash ready, set, go LEDs
    /*threeLED.on();
    setTimeout(function() {
      threeLED.off();
      twoLED.on();

      setTimeout(function() { 
        twoLED.off();
        oneLED.on();

        setTimeout(function() {
          oneLED.off();
          //countdownLEDs.blink(200);
        }, 700);
      }, 700);
    }, 700);*/

    setTimeout(function() {
      //countdownLEDs.off();
      settingUpGame = true;
      setupGame();
    }, 700);
  }
}

function setupGame() {
  console.log('');
  console.log('setting up game ' + (numberGamesPlayed + 1));
  console.log('');
  settingUpGame = false;
  waitingForTrigger = false;

  // reset hand
  // move arm to top position and make fist
  fingersMinusThumb.max();
  thumb.to(160);
  
  //setTimeout(function() { threeLED.on(); }, 500);
  threeLED.on();
  stepper.rpm(400).ccw().step(200, function() {
    console.log('first throw down');
    stepper.rpm(400).cw().step(500, function() {
      console.log('first throw down');
    });
  });
  console.log('ready!');
  setTimeout(function() {
    threeLED.off();
    console.log('set!');
    twoLED.on();
    stepper.rpm(400).ccw().step(200, function() {
    console.log('second throw up');
    stepper.rpm(400).cw().step(500, function() {
      console.log('second throw down');
    });
  });
    
  }, 700);
  setTimeout(function() { 
    twoLED.off();
    console.log('go!');
    oneLED.on();
    stepper.rpm(400).ccw().step(200, function() {
    console.log('third throw up');
    stepper.rpm(400).cw().step(500, function() {
      console.log('third throw down');
    });
  });
    waitingForPlayerHand = true;
  }, 1400);

  setTimeout(function() {
    rpsGame(handChoice(), playerChoice);
  }, 2400);
}

function handChoice() {

  // generate random number 1-3
  aiChoice = (Math.floor(Math.random() * 3)) + 1;
  console.log('Computer choice: ' + aiChoice);


  switch (aiChoice) {
    case 1:   // paper
      // move all fingers open
      fingers.min();

      console.log('Computer choice: paper');
      return(aiChoice);
    case 2:   // scissors
      // move thumb, ring, and pinky fingers
      thumb.to(155);
      index.min();
      middle.min();
      ring.max();
      pinky.max();

      console.log('Computer choice: scissors');
      return(aiChoice);
    case 3:   // rock
      // move all fingers closed
      fingers.max();
      thumb.to(160);

      console.log('Computer choice: rock');
      return(aiChoice);
  }
}

function rpsGame(computerChoice, playerChoice) {
  waitingForPlayerHand = false;
  console.log('Player choice: ' + playerChoice);

  // compare choices to see who wins
  if (playerChoice == computerChoice) {   // tie game
    // reset game and throw again
    console.log('Tie game!');

  } else {
    switch (computerChoice) {

      // computer chooses paper
      case 1:
        switch (playerChoice) {
          case 2: // player chooses scissors
            // player wins!
            console.log('Player wins!');
            playerWin++;
            totalPlayerWin++;
            break;
          case 3: //player chooses rock
            // computer wins!
            console.log('Computer wins!');
            aiWin++;
            totalAiWin++;
            break;
        }
        break;

      // computer chooses scissors
      case 2:
        switch (playerChoice) {
          case 1: // player chooses paper
            // computer wins!
            console.log('Computer wins!');
            aiWin++;
            totalAiWin++;
            break;
          case 3: // player chooses rock
            // player wins!
            console.log('Player wins!');
            playerWin++;
            totalPlayerWin++;
            break;
        }
        break;

      // computer chooses rock
      case 3:
        switch (playerChoice) {
          case 1: // player chooses paper
            // player wins!
            console.log('Player wins!');
            playerWin++;
            totalPlayerWin++;
            break;
          case 2: // player chooses scissors
            // computer wins!
            console.log('Computer wins!');
            aiWin++;
            totalAiWin++;
            break;
        }
        break;
    }
  }

  numberGamesPlayed++;

  // hand reacts to score
  if(numberGamesPlayed == 3 && (aiWin + playerWin == 3)) {
    switch(true) {
      case aiWin == playerWin:
        console.log('Score tied ' + aiWin + '-' + playerWin);
        // keep playing
        break;

      case aiWin > playerWin:
        console.log('Computer won ' + aiWin + '-' + playerWin);
        if (aiWin == 2 && playerWin == 1) {
          // ok sign
          thumb.max();
          index.max();
          middle.min();
          ring.min();
          pinky.min();
        } else if (aiWin == 3 && playerWin == 0) {
          // thumbs up
          thumb.min();
          index.max();
          middle.max();
          ring.max();
          pinky.max();
        }
        break;

      case aiWin < playerWin:
        console.log('Player won ' + playerWin + '-' + aiWin);
        // reaction code
        if (playerWin == 2 && aiWin == 1) {
          // gun to user
          thumb.min();
          index.min();
          middle.min();
          ring.max();
          pinky.max();
        } else if (playerWin == 3 && aiWin == 0) {
          // flip off user
          thumb.max();
          index.max();
          middle.min();
          ring.max();
          pinky.max();
        }
        break;
    }
  }

  // reset game variables
  playerChoice = 0;
  aiChoice = 0;
  waitingForTrigger = true;

  // reset LEDs
  setTimeout(function() {
    allLEDs.off();
  }, 500);

  // reset arm after playing 3 games unless score is tied
  if (numberGamesPlayed >= 3 && (aiWin + playerWin == 3)) {
    numberGamesPlayed = 0;
    aiWin = 0;
    playerWin = 0;
    setTimeout(function() { waiting(); }, 3000);
  } else {
    setTimeout(function() { setupGame(); }, 2000);
  }
}

// leap controller cleanup
controller.connect();

controller.on('deviceStreaming', function() {
  console.log('Leap motion connected');
});

controller.on('deviceStopped', function() {
  console.log('Leap motion disconnected.');
});