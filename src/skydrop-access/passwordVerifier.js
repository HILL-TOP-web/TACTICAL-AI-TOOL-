const crypto = require("crypto");
const secretProtection = require("./secretProtection");

function safeCompare(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

async function verify(password) {
  const configuredHash =
    secretProtection.getPasswordHash();

  if (!configuredHash) {
    return false;
  }

  const [algorithm, salt, storedHash] =
    configuredHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !salt ||
    !storedHash
  ) {
    return false;
  }

  return new Promise((resolve) => {
    crypto.scrypt(
      password,
      salt,
      64,
      {
        N: 16384,
        r: 8,
        p: 1
      },
      (error, derivedKey) => {
        if (error) {
          return resolve(false);
        }

        const calculatedHash =
          derivedKey.toString("hex");

        resolve(
          safeCompare(calculatedHash, storedHash)
        );
      }
    );
  });
}

module.exports = {
  verify
};
