// initialize leap & arduino vars
const leap  = require('leapjs');
const controller = new leap.Controller({frameEventName:'deviceFrame'});

// read input from leap motion
controller.on('deviceFrame', function(frame) {
  
  // only accept input if there is at least 1 hand available
  if(frame.hands.length > 0) {
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

    if (extendedFingers == 1 && inputIndex.extended) {
    	console.log('Game started!')
    } else {
    	console.log('Throw 1 finger...')
    }
 } 
});

// leap controller functions
controller.connect();

controller.on('deviceStreaming', function() {
  console.log("Leap motion connected");
});

controller.on('deviceStopped', function() {
  console.log("Leap motion disconnected.");
});