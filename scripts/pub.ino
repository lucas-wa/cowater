#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <LoRa.h>
#include <base64.h>           

// WiFi
const char* ssid = "Melancia";
const char* password = "malfeitofeito";

// GCP Pub/Sub config
const char* gcpProjectId = "";
const char* gcpTopicId = "";
const char* gcpAccessToken = ""; 

// LoRa pins
#define ss   5
#define rst  14
#define dio0 2

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");

  LoRa.setPins(ss, rst, dio0);
  while (!LoRa.begin(868E6)) {
    Serial.println("LoRa init failed. Retry...");
    delay(500);
  }
  LoRa.setSyncWord(0xF3);
  Serial.println("LoRa iniciado OK!");
}

void loop() {
  int packetSize = LoRa.parsePacket();
  if (packetSize) {
    String msg = "";
    while (LoRa.available()) {
      msg += (char)LoRa.read();
    }
    Serial.print("Recebido via LoRa: ");
    Serial.println(msg);

    String base64msg = base64::encode(msg);

    String payload = "{\"messages\":[{\"data\":\"" + base64msg + "\"}]}";

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setInsecure();  

      HTTPClient https;
      String url = String("https://pubsub.googleapis.com/v1/projects/") + gcpProjectId +
                   "/topics/" + gcpTopicId + ":publish";
      https.begin(client, url);
      https.addHeader("Content-Type", "application/json");
      https.addHeader("Authorization", String("Bearer ") + gcpAccessToken);

      int code = https.POST(payload);
      Serial.printf("HTTP POST code: %d\n", code);
      if (code == 200) {
        String resp = https.getString();
        Serial.print("Resposta Pub/Sub: ");
        Serial.println(resp);
      } else {
        Serial.print("Erro Pub/Sub, resposta: ");
        Serial.println(https.errorToString(code));
      }
      https.end();
    }

    delay(1000);
  }
}
