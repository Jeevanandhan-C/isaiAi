<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f80fa636-c131-415e-9bee-6159d6c2bd34

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select this repository.
3. Add `GEMINI_API_KEY` and `ELEVENLABS_API_KEY` when prompted.
4. Render will build and publish the app using `render.yaml`.
