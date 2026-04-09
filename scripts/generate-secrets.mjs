import { randomBytes } from "node:crypto"

function generateSecureSecret(bytes = 32) {
    return randomBytes(bytes).toString("base64url")
}

console.log("🔐 Generated Secure Secrets\n")

const betterAuthSecret = generateSecureSecret(32)
console.log(`APP_BETTER_AUTH_SECRET=${betterAuthSecret}`)

const dbAuthToken = generateSecureSecret(32)
console.log(`APP_DATABASE_AUTH_TOKEN=${dbAuthToken}`)

console.log("\n📋 Copy these values into your .env file")
