const path = require("path");

module.exports = {
  port: process.env.PORT || 4000,
  sessionSecret: process.env.SESSION_SECRET || "taskforge-dev-secret-ayush-yadav",
  dbFile: path.join(__dirname, "..", "data", "db.json"),
  isProduction: process.env.NODE_ENV === "production",
};
