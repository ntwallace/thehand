// include SPI, radio, and servo libs
#include <SPI.h>
#include <RF24.h>
#include <nRF24L01.h>
#include <Servo.h>

// define servo finger pins
#define servoThumb 6
#define servoPointer 5
#define servoMiddle 4
#define servoRing 3
#define servoPinkie 2

// setup radio
RF24 radio(7, 8);

// initialize servo fingers
Servo thumbFinger, pointerFinger, middleFinger, ringFinger, pinkieFinger;

// initialize game variables
int aiChoice = 0;
int playerChoice = 0;

// initialize radio variables
int msg[1];
const uint64_t pipe = 0xE8E8F0F0E1LL;

void setup() {
  Serial.begin(9600);

  // attach the servos
  thumbFinger.attach(servoThumb);
  pointerFinger.attach(servoPointer);
  middleFinger.attach(servoMiddle);
  ringFinger.attach(servoRing);
  pinkieFinger.attach(servoPinkie);

  // set fingers straight
  thumbFinger.write(0);
  pointerFinger.write(0);
  middleFinger.write(0);
  ringFinger.write(0);
  pinkieFinger.write(0);

  // start the radio receiver on channel 115
  radio.begin();
  radio.setChannel(115);
  radio.openReadingPipe(1, pipe);
  radio.startListening();

  // generate seed for random function via floating pin
  randomSeed(analogRead(A2));
}

void loop() {

  // wait to receive start code from player
  while (msg[0] != 4) {
    radio.read(msg, 1);
    Serial.println("Waiting to start game...");
  }

  Serial.println();
  Serial.println("----------------------------------");
  Serial.println("Game started!");
  aiChoice = random(300); // generate psuedo-random number 0-300
  aiChoice = map(aiChoice, 0, 300, 1, 3);

  while (msg[0] != 5) {
    radio.read(msg, 1);
  }
  // count to one
  Serial.println("Moving fingers to 1...");
  //delay(100);

  while (msg[0] != 6) {
    radio.read(msg, 1);
  }
  // count to two
  Serial.println("Moving fingers to 2...");
  Serial.println();
  //delay(100);

  // move robot hand per computer choice
  switch (aiChoice) {
    case 1:   // paper
      // leave all fingers open
      delay(1000);
      Serial.println("Computer choice: paper");
      break;
    case 2:   // scissors
      // move thumb, ring, and pinkie fingers
      pointerFinger.write(0);
      middleFinger.write(0);
      pinkieFinger.write(180);
      ringFinger.write(180);
      thumbFinger.write(180);
      delay(2000);
      Serial.println("Computer choice: scissors");
      break;
    case 3:   // rock
      // move all fingers
      pinkieFinger.write(180);
      ringFinger.write(180);
      middleFinger.write(180);
      pointerFinger.write(180);
      thumbFinger.write(180);
      delay(1000);
      Serial.println("Computer choice: rock");
      break;
  }
  Serial.println();

  // wait for choice from player
  while (msg[0] != 1 && msg[0] != 2 && msg[0] != 3) {
    radio.read(msg, 1);
    Serial.println("Waiting for player choice");
  }
  playerChoice = msg[0];
  Serial.println();
  Serial.print("Player choice: ");
  Serial.println(playerChoice);
  Serial.println("paper = 1, scissors = 2, rock = 3");
  Serial.println();

  // compare choices to see who wins
  if (playerChoice == aiChoice) {   // tie game
    // countdown code and throw again code here
    //break;
    Serial.println("Tie game!");

  } else {
    switch (aiChoice) {

      // computer chooses paper
      case 1:
        switch (playerChoice) {
          case 2: // player chooses scissors
            // player wins!
            Serial.println("Player wins!");
            // scissors cuts paper
            break;
          case 3: //player chooses rock
            // computer wins!
            Serial.println("Computer wins!");
            // paper wraps rock
            break;
        }
        break;

      // computer chooses scissors
      case 2:
        switch (playerChoice) {
          case 1: // player chooses paper
            // computer wins!
            Serial.println("Computer wins!");
            // scissors cuts paper
            break;
          case 3: // player chooses rock
            // player wins!
            Serial.println("Player wins!");
            // rock crushes scissors
            break;
        }
        break;

      // computer chooses rock
      case 3:
        switch (playerChoice) {
          case 1: // player chooses paper
            // player wins!
            Serial.println("Player wins!");
            // paper covers rock
            break;
          case 2: // player chooses scissors
            // computer wins!
            Serial.println("Computer wins!");
            // rock crushes scissors
            break;
        }
        break;
    }
  }
  Serial.println("----------------------------------");
  Serial.println();

  // reset game variables
  playerChoice = 0;
  aiChoice = 0;

  //reset servos
  thumbFinger.write(0);
  pointerFinger.write(0);
  middleFinger.write(0);
  ringFinger.write(0);
  pinkieFinger.write(0);

  delay(500);
}
