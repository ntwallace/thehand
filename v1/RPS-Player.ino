// include SPI and radio libs
#include <SPI.h>
#include <RF24.h>
#include <nRF24L01.h>

// define flex sensor pins
#define sensorPointer A0
#define sensorPinkie A1

// define button pins
#define startButton 2
#define tapButton 3

// initialize button variables
int gameState = 0;
int lastGameState = 0;
int throwInput = 0;
int lastThrowInput = 0;
int throwCount = 0;
int computerStart = 4;
int playerChoice = 0;

// initialize radio and variables
RF24 radio(8, 9);
int msg[1];
const uint64_t pipe = 0xE8E8F0F0E1LL;

void setup() {
  Serial.begin(9600);

  // start radio transmitter on channel 115
  radio.begin();
  radio.setChannel(115);
  radio.openWritingPipe(pipe);
  radio.stopListening();

  // set sensor inputs
  pinMode(sensorPointer, INPUT);
  pinMode(sensorPinkie, INPUT);

  // set button inputs
  pinMode(startButton, INPUT);
  pinMode(tapButton, INPUT);

}

void loop() {
  // has the player triggered the game to start
  gameState = digitalRead(startButton);
  if (gameState == HIGH && lastGameState == LOW) {
    Serial.println("Game started!");

    // tell computer to start game
    msg[0] = computerStart;
    radio.write(msg, 1);
    Serial.println("Sent start game to computer");
    computerStart++;

    // wait till player throws 2 times
    while (throwCount != 2) {
      throwInput = digitalRead(tapButton);
      delay(100);
      
      // increase the count after each tap
      if (throwInput == HIGH) {
        throwCount++;
        Serial.print("Throw count: ");
        Serial.println(throwCount);

        // send update to computer
        msg[0] = computerStart++;
        radio.write(msg, 1);
        
        delay(100);
      }
    }
    delay(10);

    // reset throw variables
    throwCount = 0;
    computerStart = 4;
    
    // get user input
    userChoice();
    Serial.print("Player choice: ");
    Serial.println(playerChoice);
    Serial.println("paper = 1, scissors = 2, rock = 3");
    Serial.println();

    msg[0] = playerChoice;
    radio.write(msg, 1);
  }
  
  // reset game state
  lastGameState = gameState;
  
}

void userChoice() {
  // get player choice based on sensors
  int pinkieSensor = analogRead(sensorPinkie);
  pinkieSensor = map(pinkieSensor, 535, 420, 0, 100);   // map values 0-100
  Serial.print("Pinkie sensor: ");
  Serial.println(pinkieSensor);
  if ( pinkieSensor > 40) {   // finger is bent
    pinkieSensor = 1;
  } else {
    pinkieSensor = 0;
  }
  int pointerSensor = analogRead(sensorPointer);
  pointerSensor = map(pointerSensor, 605, 460, 0, 100);   // map values 0-100
  Serial.print("Pointer sensor: ");
  Serial.println(pointerSensor);
  if ( pointerSensor > 40) {  // finger is bent
    pointerSensor = 1;
  } else {
    pointerSensor = 0;
  }

  // no sensors flex = paper, pinkie flexed = scisors, both flexed = rock
  if (pointerSensor == 1) {    //rock
    playerChoice = 3;
  } else if (pinkieSensor == 1 & pointerSensor == 0) {   //scisors
    playerChoice = 2;
  } else {    // paper
    playerChoice = 1;
  }
}
