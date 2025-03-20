const fs = require("fs");
const path = require("path");

// Speicherpfad für User-Daten
const dataFile = path.join(__dirname, "../data/users.json");

// Lade oder initialisiere die JSON-Datei
function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile, "utf8"));
}

// Speichert die Daten in die JSON-Datei
function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Holt das Guthaben eines Users
function getBalance(userId) {
  const users = loadData();
  return users[userId]?.credits || 500; // Standard-Guthaben: 1000 Credits
}

// Setzt ein neues Guthaben für einen User
function setBalance(userId, amount) {
  const users = loadData();
  users[userId] = { credits: Math.max(0, amount) }; // Kein negatives Guthaben
  saveData(users);
}

// Fügt Guthaben hinzu
function addBalance(userId, amount) {
  setBalance(userId, getBalance(userId) + amount);
}

// Zieht Guthaben ab
function removeBalance(userId, amount) {
  setBalance(userId, getBalance(userId) - amount);
}

module.exports = { getBalance, setBalance, addBalance, removeBalance };
