import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ffmpegExe = 'C:\\Users\\sushant\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const ffprobeExe = 'C:\\Users\\sushant\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe';

const rootDir = path.resolve(__dirname, '..');
const rawVideo = path.join(rootDir, 'recordings', 'raw_walkthrough.webm');
const masterAudio = path.join(rootDir, 'audio', 'PaisaWise_Indian_Voiceover_Master.mp3');
const outputMp4 = path.join(rootDir, 'recordings', 'PaisaWise_Full_Demo_Indian_Voiceover.mp4');
const outputWebm = path.join(rootDir, 'recordings', 'PaisaWise_Full_Demo_Indian_Voiceover.webm');
const artifactDir = 'C:\\Users\\sushant\\.gemini\\antigravity\\brain\\cba7358f-dae7-427d-bcc4-10ab0f88495b';
const artifactMp4 = path.join(artifactDir, 'PaisaWise_Full_Demo_Indian_Voiceover.mp4');

async function main() {
  console.log('===============================================================');
  console.log('   MUXING VIDEO WITH INDIAN ACCENT VOICEOVER AUDIO            ');
  console.log('===============================================================\n');

  if (!fs.existsSync(rawVideo)) {
    throw new Error(`Raw video not found at: ${rawVideo}`);
  }
  if (!fs.existsSync(masterAudio)) {
    throw new Error(`Master audio not found at: ${masterAudio}`);
  }

  // Probe durations
  console.log('Inspecting inputs:');
  const vidDur = execSync(`"${ffprobeExe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${rawVideo}"`).toString().trim();
  const audDur = execSync(`"${ffprobeExe}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${masterAudio}"`).toString().trim();
  console.log(`- Video duration: ${vidDur}s`);
  console.log(`- Audio duration: ${audDur}s\n`);

  // 1. Create MP4 with H.264 + AAC audio (universal compatibility)
  console.log('1. Encoding high-definition MP4 (H.264 + AAC 192kbps)...');
  const mp4Cmd = `"${ffmpegExe}" -i "${rawVideo}" -i "${masterAudio}" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputMp4}" -y`;
  execSync(mp4Cmd, { stdio: 'inherit' });
  console.log(`✔ MP4 generated: ${outputMp4} (${(fs.statSync(outputMp4).size / (1024 * 1024)).toFixed(2)} MB)\n`);

  // 2. Create WebM with VP9/VP8 copy + Opus audio
  console.log('2. Muxing WebM with Opus audio...');
  const webmCmd = `"${ffmpegExe}" -i "${rawVideo}" -i "${masterAudio}" -c:v copy -c:a libopus -b:a 128k -shortest "${outputWebm}" -y`;
  execSync(webmCmd, { stdio: 'inherit' });
  console.log(`✔ WebM generated: ${outputWebm} (${(fs.statSync(outputWebm).size / (1024 * 1024)).toFixed(2)} MB)\n`);

  // 3. Copy to Artifact Directory for easy user download / preview
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(outputMp4, artifactMp4);
    console.log(`✔ Copied to Artifact Directory: ${artifactMp4}`);
  }

  // 4. Verify streams on final MP4
  console.log('\nFinal Stream Verification for MP4:');
  const streams = execSync(`"${ffprobeExe}" -v error -show_entries stream=index,codec_name,codec_type -of default=noprint_wrappers=1 "${outputMp4}"`).toString().trim();
  console.log(streams);

  console.log('\n===============================================================');
  console.log('  🎉 DEMO VIDEO WITH INDIAN ACCENT VOICEOVER IS COMPLETE!');
  console.log('===============================================================\n');
}

main().catch(console.error);
