# Stream Chat Setup Instructions

## ✅ Integration Complete!

I've integrated Stream Chat with voice/video calling support. Now you need to add your API credentials.

## Step 1: Create Stream Account (2 minutes)

1. Go to: **https://getstream.io/chat/trial/**
2. Click "Start Free Trial"
3. Sign up with your email (no credit card required)
4. You'll be redirected to the dashboard

## Step 2: Create App & Get Credentials (1 minute)

1. In Stream dashboard, click "Create App"
2. Name it "CollabHub" (or anything you want)
3. Select "Development" environment
4. Click "Create App"
5. You'll see your **App Dashboard**

## Step 3: Copy API Credentials (30 seconds)

On the app dashboard, you'll see:
- **API Key** (looks like: `abc123xyz`)
- **API Secret** (looks like: `def456uvw`)

Copy both of these!

## Step 4: Add to Environment Variables (30 seconds)

Open your `.env.local` file and add:

```env
NEXT_PUBLIC_STREAM_API_KEY=your_api_key_here
STREAM_API_SECRET=your_api_secret_here
```

Replace `your_api_key_here` and `your_api_secret_here` with the values you copied.

## Step 5: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 6: Test It! 🎉

1. Go to http://localhost:3000/messages
2. You should see the Stream chat interface
3. Open another browser (or incognito) and login with another account
4. Start chatting - messages will be **INSTANT**!

## What You Get

✅ **Instant messaging** (no delays!)
✅ **Typing indicators** (see when someone is typing)
✅ **Read receipts** (see when messages are read)
✅ **Online presence** (accurate online/offline status)
✅ **File uploads** (drag & drop images/files)
✅ **Message reactions** (👍 ❤️ 😂)
✅ **Voice calls** (audio only)
✅ **Video calls** (1-on-1 and group)
✅ **Screen sharing**
✅ **Message search**
✅ **Push notifications**

## Voice/Video Calls

Stream provides built-in calling! To enable:

1. In Stream dashboard, go to "Video & Audio"
2. Enable "Video Calling"
3. That's it! Users can now start calls from the chat

## Free Tier Limits

- **25 Monthly Active Users** (MAU)
- **Unlimited messages**
- **Unlimited channels**
- **Voice & Video calls included**
- **No credit card required**

## Troubleshooting

### Error: "Stream API credentials not configured"
- Make sure you added both `NEXT_PUBLIC_STREAM_API_KEY` and `STREAM_API_SECRET` to `.env.local`
- Restart your dev server after adding env variables

### Error: "Failed to connect"
- Check that your API Key and Secret are correct
- Make sure there are no extra spaces in the env file
- Verify you're using the correct keys from the Stream dashboard

### Messages not appearing
- This shouldn't happen with Stream! If it does:
  - Check browser console for errors
  - Verify both users are connected (green dot)
  - Refresh the page

## Production Deployment

When deploying to Vercel:

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add both:
   - `NEXT_PUBLIC_STREAM_API_KEY`
   - `STREAM_API_SECRET`
5. Redeploy

## Cost at Scale

- **Free**: 25 MAU
- **$99/month**: 100 MAU
- **$499/month**: 1,000 MAU

Much cheaper than building your own real-time infrastructure!

## Support

- Stream Docs: https://getstream.io/chat/docs/
- Video Docs: https://getstream.io/video/docs/
- Support: support@getstream.io

## Next Steps

After setup:
1. Test messaging between two accounts
2. Try file uploads (drag & drop)
3. Test voice/video calls
4. Customize the UI (edit `stream-custom.css`)

Enjoy your real-time chat system! 🚀
