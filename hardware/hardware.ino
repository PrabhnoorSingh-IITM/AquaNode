#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>
#include <math.h>

// Provide the token generation process info.
#include <addons/TokenHelper.h>
// Provide the RTDB helper functions.
#include <addons/RTDBHelper.h>

/* Credentials */
#define WIFI_SSID "Jk"
#define WIFI_PASSWORD "jaiguruji"
#define API_KEY "AIzaSyDXps3XjSl957YdQXoD7dgrb-6Qtg0b7zY"
#define DATABASE_URL "https://aquanode-b6126-default-rtdb.asia-southeast1.firebasedatabase.app/"

/* Pins - Matching User Schematic */
#define PH_PIN 32
#define TURBIDITY_PIN 33
#define FLOW1_PIN 34
#define FLOW2_PIN 35
#define DHTPIN 4
#define DHTTYPE DHT11

#define VALVE_PIN 26
#define LED_GREEN 18
#define LED_YELLOW 19
#define LED_RED 21
#define BUZZER 22

/* Objects */
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
DHT dht(DHTPIN, DHTTYPE);

/* State Variables */
bool valveState = true; // true = OPEN (HIGH), false = CLOSED (LOW)
unsigned long lastMillis = 0;

/* Functions */
float readAverage(int pin) {
  long sum = 0;
  for (int i = 0; i < 20; i++) { // Increased samples for stability
    sum += analogRead(pin);
    delay(2);
  }
  return (float)sum / 20.0;
}

void setIndicators(String state) {
  digitalWrite(LED_GREEN, state == "SAFE" ? HIGH : LOW);
  digitalWrite(LED_YELLOW, state == "WARNING" ? HIGH : LOW);
  digitalWrite(LED_RED, state == "CRITICAL" ? HIGH : LOW);
  digitalWrite(BUZZER, state == "CRITICAL" ? HIGH : LOW);
}

void setup() {
  Serial.begin(115200);
  
  pinMode(VALVE_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  // Default to Valve OPEN
  digitalWrite(VALVE_PIN, HIGH);
  
  analogReadResolution(12);
  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Auth: Success");
  } else {
    Serial.printf("Firebase Auth Failed: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // Check Firebase connection every loop
  if (Firebase.ready() && (millis() - lastMillis > 3000 || lastMillis == 0)) {
    lastMillis = millis();

    // 1. READ SENSORS
    float temp = dht.readTemperature();
    if (isnan(temp)) temp = 25.0; // Fallback

    // pH Calculation (Calibrated for 0-14 range)
    float phRaw = readAverage(PH_PIN);
    float pH = (phRaw / 4095.0) * 14.0; 

    // Turbidity calculation (0-1000 scale)
    float turbRaw = readAverage(TURBIDITY_PIN);
    float turbidity = map(turbRaw, 0, 4095, 0, 100); // Percentage for dashboard

    // Flow Calculation (Mocking rate from analog for now)
    float f1 = readAverage(FLOW1_PIN);
    float f2 = readAverage(FLOW2_PIN);
    float flowRate = (f1 / 4095.0) * 10.0; // Simulated L/min
    float flowClog = (1.0 - (f2 / f1)) * 100.0; // % Clogging

    // 2. REMOTE VALVE CONTROL (Listen to Dashboard)
    if (Firebase.RTDB.getString(&fbdo, "/controls/valve")) {
      if (fbdo.dataType() == "string") {
        String remoteValve = fbdo.stringData();
        if (remoteValve == "CLOSED") {
           valveState = false;
        } else {
           valveState = true;
        }
      }
    }

    // 3. EMERGENCY LOCAL LOGIC (Safety Override)
    String systemStatus = "SAFE";
    if (pH < 5.0 || pH > 7.5 || turbidity > 20) {
      systemStatus = "CRITICAL";
      valveState = false; // Auto-shut on critical failure
    } else if (pH < 5.5 || pH > 7.0 || turbidity > 5) {
      systemStatus = "WARNING";
    }

    // 4. EXECUTE ACTIONS
    digitalWrite(VALVE_PIN, valveState ? HIGH : LOW);
    setIndicators(systemStatus);

    // 5. PUSH TO FIREBASE (Telemetry Node)
    FirebaseJson json;
    json.set("temp", temp);
    json.set("ph", pH);
    json.set("turbidity", turbidity);
    json.set("flow", flowRate);
    json.set("clog", flowClog);
    json.set("valve", valveState ? "OPEN" : "CLOSED");
    json.set("status", systemStatus);

    if (Firebase.RTDB.updateNode(&fbdo, "/telemetry", &json)) {
      Serial.println("Telemetry Synced to Firebase");
    } else {
      Serial.println("Firebase Update Failed: " + fbdo.errorReason());
    }

    // Local Serial Debug
    Serial.printf("Status: %s | pH: %.2f | Turb: %.1f | Valve: %s\n", 
                  systemStatus.c_str(), pH, turbidity, valveState ? "OPEN" : "CLOSED");
  }
}
