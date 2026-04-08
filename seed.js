import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8ldsq1Ddnx3WdvieX_BaeJH4QlZQ2dIo",
  authDomain: "demoecomm-36e0e.firebaseapp.com",
  projectId: "demoecomm-36e0e",
  storageBucket: "demoecomm-36e0e.firebasestorage.app",
  messagingSenderId: "1030236095434",
  appId: "1:1030236095434:web:f7088b22b801b9c8144533"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const defaultProducts = [
  {
    name: "Arduino Uno R3",
    category: "Development Boards",
    price: "Rs. 540 / board",
    stock: "32 units ready",
    description: "ATmega328P-based board for prototyping, sensor integration, and classroom electronics projects.",
    image: "" // Add image logic if needed, but for now we'll use placeholder SVGs
  },
  {
    name: "10k Ohm Resistor Pack",
    category: "Passive Components",
    price: "Rs. 120 / pack",
    stock: "150 packs ready",
    description: "Quarter-watt through-hole resistor assortment suitable for breadboards and general circuit builds.",
    image: ""
  },
  {
    name: "ESP32 Wi-Fi Module",
    category: "IoT Modules",
    price: "Rs. 380 / piece",
    stock: "21 units ready",
    description: "Low-power dual-core microcontroller with Wi-Fi and Bluetooth support for connected device projects.",
    image: ""
  },
  {
    name: "16x2 LCD Display",
    category: "Displays",
    price: "Rs. 180 / piece",
    stock: "48 units ready",
    description: "Character display module for quick readouts in embedded systems and lab prototypes.",
    image: ""
  },
  {
    name: "IR Sensor Module",
    category: "Sensors",
    price: "Rs. 95 / piece",
    stock: "65 units ready",
    description: "Infrared obstacle detection module designed for robotics, automation, and simple motion triggers.",
    image: ""
  },
  {
    name: "L298N Motor Driver",
    category: "Power & Motion",
    price: "Rs. 210 / board",
    stock: "14 units ready",
    description: "Dual H-bridge motor driver board for DC motors and small robotic vehicle control.",
    image: ""
  }
];

const defaultCategories = [
  "Development Boards",
  "IoT Modules",
  "Sensors",
  "Displays",
  "Power & Motion",
  "Passive Components"
];

async function seed() {
  const statusLine = document.getElementById("status-line");
  const log = document.getElementById("log");

  try {
    statusLine.textContent = "Seeding Categories...";
    for (const cat of defaultCategories) {
      await addDoc(collection(db, "categories"), { name: cat });
      log.innerHTML += `<div>✅ Added Category: ${cat}</div>`;
    }

    statusLine.textContent = "Seeding Products...";
    for (const prod of defaultProducts) {
      await addDoc(collection(db, "products"), { ...prod, createdAt: new Date().toISOString() });
      log.innerHTML += `<div>✅ Added Product: ${prod.name}</div>`;
    }

    statusLine.textContent = "Database Seeded Successfully!";
    statusLine.style.color = "var(--primary)";
    document.getElementById("done-msg").hidden = false;
  } catch (error) {
    statusLine.textContent = "Error: " + error.message;
    statusLine.style.color = "var(--danger)";
    console.error(error);
  }
}

document.getElementById("seed-btn").onclick = seed;
