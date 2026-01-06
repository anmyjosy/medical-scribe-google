<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This app uses **AssemblyAI** for medical transcription with speaker diarization to distinguish between doctor and patient voices.

View your app in AI Studio: https://ai.studio/apps/drive/1nqgGv2NIgJtojQRv7IraEeSLhuZh-Tml

## Run Locally

**Prerequisites:**  Node.js

1. **Enable PowerShell Scripts** (Windows only - run as Administrator):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get your AssemblyAI API Key:**
   - Sign up at [AssemblyAI](https://www.assemblyai.com/)
   - Get your API key from the [dashboard](https://www.assemblyai.com/app)
   - Free tier includes 5 hours of transcription per month

4. **Set the `ASSEMBLYAI_API_KEY` in [.env.local](.env.local):**
   ```
   ASSEMBLYAI_API_KEY=your_api_key_here
   ```

5. **Run the app:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   - Navigate to `http://localhost:3000`

## Features

- 🎙️ **Audio Recording**: Record doctor-patient consultations
- 🗣️ **Speaker Diarization**: Automatically distinguishes between speakers (doctor and patient)
- 📝 **SOAP Note Generation**: AI-powered generation of structured medical notes
- 💾 **Note Management**: Save and view past consultation notes
