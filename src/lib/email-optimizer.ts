import nodemailer from "nodemailer"

// Global transporter instance for connection reuse
let globalTransporter: nodemailer.Transporter | null = null
let lastUsed = 0

/**
 * Get optimized email transporter with connection warming
 */
export function getOptimizedTransporter() {
  const now = Date.now()
  
  // Create new transporter if none exists or if it's been idle for 5 minutes
  if (!globalTransporter || (now - lastUsed) > 300000) {
    console.log("🔥 Creating new optimized email transporter...")
    
    globalTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      // MAXIMUM SPEED OPTIMIZATIONS
      pool: true, // Connection pooling
      maxConnections: 1, // Single persistent connection
      maxMessages: Infinity, // Reuse connection forever
      rateLimit: false, // No rate limiting
      connectionTimeout: 5000, // 5 seconds
      greetingTimeout: 3000, // 3 seconds
      socketTimeout: 10000, // 10 seconds
      // GMAIL SPEED HACKS
      tls: {
        rejectUnauthorized: false, // Skip cert validation for speed
        ciphers: 'SSLv3' // Faster cipher
      },
      // DISABLE UNNECESSARY FEATURES
      disableFileAccess: true,
      disableUrlAccess: true,
      // KEEP CONNECTION ALIVE
      pool: true,
      maxConnections: 1,
      maxMessages: Infinity,
    })

    // Warm up the connection immediately
    warmUpConnection()
  }
  
  lastUsed = now
  return globalTransporter
}

/**
 * Warm up SMTP connection to reduce first-email delay
 */
async function warmUpConnection() {
  if (!globalTransporter) return
  
  try {
    console.log("🔥 Warming up SMTP connection...")
    await globalTransporter.verify()
    console.log("✅ SMTP connection warmed up successfully")
  } catch (error) {
    console.error("❌ SMTP warmup failed:", error)
  }
}

/**
 * Send ultra-fast email with minimal HTML
 */
export async function sendFastEmail(options: {
  to: string
  subject: string
  name?: string
  buttonText: string
  buttonUrl: string
  description: string
}) {
  const transporter = getOptimizedTransporter()
  
  const minimalHtml = `<div style="font-family:Arial;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#3b82f6">${options.subject}</h2><p>Hi ${options.name || 'User'},</p><p><strong>${options.description}</strong></p><div style="text-align:center;margin:20px 0"><a href="${options.buttonUrl}" style="background:#3b82f6;color:white;padding:15px 25px;text-decoration:none;border-radius:5px;font-weight:bold">${options.buttonText}</a></div><p style="color:#666;font-size:12px">CollabHub Team</p></div>`

  const emailPromise = transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: minimalHtml,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high',
      'X-Mailer': 'CollabHub-Ultra-Fast'
    }
  })

  // 6-second timeout for ultra-fast failure detection
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Email timeout')), 6000)
  })

  try {
    await Promise.race([emailPromise, timeoutPromise])
    console.log(`✅ Fast email sent to ${options.to}`)
    return { success: true }
  } catch (error) {
    console.error(`❌ Fast email failed for ${options.to}:`, error)
    throw error
  }
}

/**
 * Preload and warm up email system on server start
 */
export function initializeEmailSystem() {
  console.log("🚀 Initializing ultra-fast email system...")
  
  // Warm up connection immediately
  setTimeout(() => {
    getOptimizedTransporter()
  }, 1000)
  
  // Keep connection warm with periodic pings
  setInterval(() => {
    if (globalTransporter) {
      warmUpConnection()
    }
  }, 240000) // Every 4 minutes
}