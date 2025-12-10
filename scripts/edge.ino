#include <SPI.h>
#include <LoRa.h>

#define ss   5
#define rst  14
#define dio0 2

const int trigPin = 27;
const int echoPin = 26;
const int ledPin = 13;

#define SOUND_SPEED_CM_PER_US 0.034  

void setup() {
  Serial.begin(115200);
  while (!Serial);
  Serial.println("LoRa Sender + Ultrassom");

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(ledPin, OUTPUT);

  LoRa.setPins(ss, rst, dio0);
  while (!LoRa.begin(868E6)) {
    Serial.println(".");
    delay(500);
  }
  LoRa.setSyncWord(0xF3);
  Serial.println("LoRa Inicializado OK!");
}

float measureDistanceCm() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distanceCm = (duration * SOUND_SPEED_CM_PER_US) / 2.0;
  return distanceCm;
}

void loop() {
  float dist = measureDistanceCm();

  if(dist > 90){
    digitalWrite(ledPin, HIGH);
  }else{
    digitalWrite(ledPin, LOW);
  }

  Serial.print("Distance: ");
  Serial.print(dist);
  Serial.println(" cm");

  Serial.print("Enviando pacote: ");

  LoRa.beginPacket();
  LoRa.print(dist);
  LoRa.endPacket();

  delay(1000);  
}
