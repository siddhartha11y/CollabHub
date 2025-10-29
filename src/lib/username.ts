import { prisma } from "./prisma"

/**
 * Generate a unique username from email
 * Example: john.doe@gmail.com -> johndoe or johndoe2 if taken
 */
export async function generateUsernameFromEmail(email: string): Promise<string> {
  // Extract username part from email
  const emailUsername = email.split('@')[0]
  
  // Clean up: remove dots, special characters, convert to lowercase
  let baseUsername = emailUsername
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20) // Limit to 20 characters
  
  // Check if username is available
  let username = baseUsername
  let counter = 1
  
  while (await isUsernameTaken(username)) {
    username = `${baseUsername}${counter}`
    counter++
    
    // Prevent infinite loop
    if (counter > 100) {
      username = `${baseUsername}${Date.now()}`
      break
    }
  }
  
  return username
}

/**
 * Check if username is already taken
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({
    where: { username },
  })
  return !!existing
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  // Username must be 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * Update user's username
 */
export async function updateUsername(userId: string, newUsername: string): Promise<{ success: boolean; error?: string }> {
  // Validate format
  if (!isValidUsername(newUsername)) {
    return {
      success: false,
      error: "Username must be 3-20 characters and contain only lowercase letters, numbers, and underscores"
    }
  }
  
  // Check if taken
  if (await isUsernameTaken(newUsername)) {
    return {
      success: false,
      error: "Username is already taken"
    }
  }
  
  // Update
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username: newUsername }
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: "Failed to update username"
    }
  }
}
