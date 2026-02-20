// Quick script to generate a bcrypt password hash
// Usage: node hashPassword.js "YourNewPassword"

const bcrypt = require("bcrypt");

const password = process.argv[2];

if (!password) {
  console.log("❌ Error: Please provide a password");
  console.log('Usage: node hashPassword.js "YourNewPassword"');
  process.exit(1);
}

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error("❌ Error generating hash:", err);
    process.exit(1);
  }

  console.log("\n✅ Password hash generated successfully!\n");
  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("\nCopy the hash above and paste it into MongoDB Atlas.");
});
