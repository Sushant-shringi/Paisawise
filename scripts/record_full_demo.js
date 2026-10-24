import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ffmpegExe = 'C:\\Users\\sushant\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const ffprobeExe = 'C:\\Users\\sushant\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffprobe.exe';

// Helper to render high-definition presenter caption overlay with Indian badge
async function showPresenterCaption(page, badge, speakerText, technicalNote) {
  await page.evaluate(({ badge, speakerText, technicalNote }) => {
    let overlay = document.getElementById('presenter-caption-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'presenter-caption-overlay';
      overlay.style.position = 'fixed';
      overlay.style.bottom = '20px';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.width = '92%';
      overlay.style.maxWidth = '1000px';
      overlay.style.background = 'linear-gradient(135deg, rgba(10, 15, 29, 0.96), rgba(6, 9, 18, 0.98))';
      overlay.style.backdropFilter = 'blur(20px)';
      overlay.style.color = '#ffffff';
      overlay.style.padding = '14px 22px';
      overlay.style.borderRadius = '18px';
      overlay.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(16, 185, 129, 0.28)';
      overlay.style.border = '1.5px solid rgba(16, 185, 129, 0.5)';
      overlay.style.fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      overlay.style.zIndex = '9999999';
      overlay.style.pointerEvents = 'none';
      overlay.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.45);">
          🎙️
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #34d399; background: rgba(16, 185, 129, 0.16); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.35);">
                ${badge}
              </span>
              <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">
                Spoken Indian English Voiceover
              </span>
            </div>
            <span style="font-size: 11.5px; font-family: monospace; color: #10b981; font-weight: 800; background: rgba(16, 185, 129, 0.12); padding: 2px 9px; border-radius: 5px; border: 1px solid rgba(16, 185, 129, 0.25);">
              ₹ PAISAWISE
            </span>
          </div>
          <div style="font-size: 14px; font-weight: 600; line-height: 1.45; color: #f8fafc; margin-bottom: 4px;">
            "${speakerText}"
          </div>
          ${technicalNote ? `
            <div style="font-size: 11.5px; color: #a7f3d0; font-weight: 500; display: flex; align-items: center; gap: 6px;">
              <span>⚡ System Highlight:</span> <span style="color: #6ee7b7; font-weight: 600;">${technicalNote}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }, { badge, speakerText, technicalNote });
}

// Smooth scrolling helper
async function smoothScroll(page, distance, steps = 15) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), distance / steps);
    await page.waitForTimeout(30);
  }
}

// Safe navigation helper that handles network conditions gracefully
async function navigateTo(page, targetUrl) {
  try {
    const current = page.url();
    const cleanCurrent = current.replace(/\/$/, '');
    const cleanTarget = targetUrl.replace(/\/$/, '');
    if (cleanCurrent === cleanTarget) {
      await page.waitForTimeout(400);
      return;
    }
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  } catch (err) {
    console.warn(`[Nav Note] ${targetUrl}:`, err.message);
  }
  await page.waitForTimeout(600);
}

// Precise scene timer helper: ensures each scene's recording time matches its audio duration exactly
async function runSceneWithDuration(sceneStartTime, targetDurationMs) {
  const elapsed = Date.now() - sceneStartTime;
  const remaining = targetDurationMs - elapsed;
  if (remaining > 50) {
    await new Promise(r => setTimeout(r, remaining));
  }
}

async function recordFullDemo() {
  console.log('======================================================================');
  console.log('   STARTING EXHAUSTIVE PAISAWISE DEMO RECORDING (ALL 11 SCENES)       ');
  console.log('======================================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const outputDir = path.join(rootDir, 'recordings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Exact durations in ms matching the 11 audio files
  const SCENE_DURATIONS = {
    scene1: 18820,   // 18.82s
    scene2: 22540,   // 22.54s
    scene3: 20640,   // 20.64s
    scene4: 24980,   // 24.98s
    scene5: 15170,   // 15.17s
    scene6: 17470,   // 17.47s
    scene7: 14860,   // 14.86s
    scene8: 15340,   // 15.34s
    scene9: 26500,   // 26.50s
    scene10: 13970,  // 13.97s
    scene11: 19660   // 19.66s
  };

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();
  const baseUrl = 'https://paisawise-two.vercel.app';

  try {
    // =========================================================================
    // SCENE 1: Introduction & Brand Presentation (18.82s)
    // =========================================================================
    console.log('▶ [Scene 1/11] Recording Introduction & Brand Presentation...');
    let sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/login`);

    await showPresenterCaption(
      page,
      '🇮🇳 Brand Introduction',
      "Namaste and hello everyone! Welcome to the full live walkthrough of PaisaWise, an intelligent personal finance platform tailored for Indian financial habits. PaisaWise brings complete clarity to your daily income, expenses, and long term wealth.",
      'React 19, TypeScript, Tailwind CSS, Express, and Supabase PostgreSQL'
    );

    await smoothScroll(page, 150);
    await page.waitForTimeout(1000);
    await smoothScroll(page, -150);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene1);

    // =========================================================================
    // SCENE 2: Authentication & Gmail OTP Security (22.54s)
    // =========================================================================
    console.log('▶ [Scene 2/11] Recording Authentication & Gmail OTP Security...');
    sceneStart = Date.now();
    const createAccountTab = page.locator('button:has-text("Create Account")').first();
    if (await createAccountTab.isVisible()) {
      await createAccountTab.click();
      await page.waitForTimeout(600);
    }

    await showPresenterCaption(
      page,
      '🔐 Multi-Factor Auth',
      "Let us examine our secure authentication system. Users can register with their legal name, email, and password. With Bcrypt encryption and verified Gmail SMTP integration, single use six digit OTP codes are dispatched directly to the user's inbox for high security onboarding.",
      'Bcrypt Password Hashing & Real-time Gmail SMTP OTP verification'
    );

    const nameInput = page.locator('input[placeholder="Legal Name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Sushant Shringi');
      await page.waitForTimeout(300);
      await page.locator('input[placeholder="Email Address"]').fill('sushantshringi444@gmail.com');
      await page.waitForTimeout(300);
      await page.locator('input[placeholder="Password (min 6 characters)"]').fill('PaisaWise@2026!');
      await page.waitForTimeout(300);

      const tos = page.locator('#tos');
      if (await tos.isVisible()) {
        await tos.check();
        await page.waitForTimeout(400);
      }
    }

    // Authenticate with pre-seeded demo records to load the full financial cockpit
    const demoLink = page.locator('button:has-text("Explore with pre-seeded demo records")');
    if (await demoLink.isVisible()) {
      await demoLink.click();
      await page.waitForTimeout(2200);
    }
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene2);

    // =========================================================================
    // SCENE 3: Main Financial Cockpit & Overview Dashboard (20.64s)
    // =========================================================================
    console.log('▶ [Scene 3/11] Recording Financial Cockpit & Indian Rupee Analytics...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/`);

    await showPresenterCaption(
      page,
      '📊 Financial Cockpit',
      "Stepping into the main Financial Cockpit! Everything is tracked in Indian Rupees. We see real time cards for Total Income, Total Expenses, Net Savings, and our algorithmic Financial Health Score. Recharts power our dynamic category donut and daily spending trends.",
      'Total Income, Expenses, Net Savings, and Algorithmic Health Score in ₹ INR'
    );

    await smoothScroll(page, 280);
    await page.waitForTimeout(1500);
    await smoothScroll(page, 240);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -520);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene3);

    // =========================================================================
    // SCENE 4: Transactions Management & Live Expense Entry (24.98s)
    // =========================================================================
    console.log('▶ [Scene 4/11] Recording Transactions & Live UPI Entry...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/transactions`);

    await showPresenterCaption(
      page,
      '💳 UPI & Cards Ledger',
      "Next is the Transactions module. Users can search and filter across UPI, Net Banking, and Credit Cards. Let us add a new transaction: a grocery expense of ₹2,450 paid via UPI. Once submitted, it appears immediately in the ledger and updates all balance calculations.",
      'Categorized transaction ledger with date filters and live UPI expense logging'
    );

    // Open Record modal
    const recordBtn = page.locator('button:has-text("Record")').first();
    if (await recordBtn.isVisible()) {
      await recordBtn.click();
      await page.waitForTimeout(800);

      const titleInput = page.locator('input[placeholder="e.g. Grocery Shopping, Salary"]').or(page.locator('form input[type="text"]').first());
      if (await titleInput.isVisible()) {
        await titleInput.fill('Reliance Smart Supermarket');
        await page.waitForTimeout(400);
      }

      const amountInput = page.locator('input[placeholder="0.00"]').or(page.locator('form input[type="number"]').first());
      if (await amountInput.isVisible()) {
        await amountInput.fill('2450');
        await page.waitForTimeout(400);
      }

      const submitBtn = page.locator('button:has-text("Add Transaction")').or(page.locator('form button[type="submit"]')).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    await smoothScroll(page, 200);
    await page.waitForTimeout(1000);
    await smoothScroll(page, -200);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene4);

    // =========================================================================
    // SCENE 5: Monthly Budgets & 80% Threshold Warnings (15.17s)
    // =========================================================================
    console.log('▶ [Scene 5/11] Recording Budgets & 80% Threshold Warnings...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/budgets`);

    await showPresenterCaption(
      page,
      '🎯 Budget Discipline',
      "Under Budgets, you can set spending limits for groceries, rent, and shopping. PaisaWise provides visual progress bars and automated eighty percent threshold warnings to safeguard against overspending.",
      'Category spending caps with dynamic 80% warning triggers'
    );

    await smoothScroll(page, 250);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -250);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene5);

    // =========================================================================
    // SCENE 6: Savings Goals & Live 1-Click Contribution (17.47s)
    // =========================================================================
    console.log('▶ [Scene 6/11] Recording Savings Goals & 1-Click Contribution...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/goals`);

    await showPresenterCaption(
      page,
      '🏆 Milestone Goals',
      "The Savings Goals module helps users plan for milestone targets like an Emergency Fund or electronics. Here, we can contribute ₹5,000 to our Emergency Fund with one click, immediately updating the target progress bar.",
      'Target tracking, countdown to deadline, and 1-click fund contribution'
    );

    // Click Contribute button
    const contributeBtn = page.locator('button:has-text("Contribute")').first();
    if (await contributeBtn.isVisible()) {
      await contributeBtn.click();
      await page.waitForTimeout(800);

      const depInput = page.locator('input[placeholder="5000"]').or(page.locator('form input[type="number"]')).first();
      if (await depInput.isVisible()) {
        await depInput.fill('5000');
        await page.waitForTimeout(400);
      }

      const confirmBtn = page.locator('button:has-text("Confirm Contribution")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(1200);
      }
    }
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene6);

    // =========================================================================
    // SCENE 7: Recurring Commitments & Subscriptions (14.86s)
    // =========================================================================
    console.log('▶ [Scene 7/11] Recording Recurring Commitments & Subscriptions...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/recurring`);

    await showPresenterCaption(
      page,
      '🔄 Subscriptions & EMIs',
      "Our Recurring Expenses and Subscriptions tracker organizes monthly fixed obligations such as rent, broadband, insurance EMIs, and streaming services, ensuring you never miss a billing date.",
      'Automated recurring expense calculations & payment schedule tracking'
    );

    await smoothScroll(page, 200);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -200);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene7);

    // =========================================================================
    // SCENE 8: Analytics & Financial Health Reports (15.34s)
    // =========================================================================
    console.log('▶ [Scene 8/11] Recording Analytics & Financial Health Reports...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/analytics`);

    await showPresenterCaption(
      page,
      '📈 Visual Analytics',
      "Under Analytics and Reports, PaisaWise visualizes income versus expense velocity, savings rate trends, and monthly breakdown statements that can be exported directly for tax and financial planning.",
      'Cash flow velocity curves, savings rate trends, and exportable reports'
    );

    await smoothScroll(page, 260);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -260);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene8);

    // =========================================================================
    // SCENE 9: Google Sheets Cloud Integration ⭐ (26.50s)
    // =========================================================================
    console.log('▶ [Scene 9/11] Recording Google Sheets Cloud Integration...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/sheets`);

    await showPresenterCaption(
      page,
      '📊 Cloud Sheets Sync',
      "Now for our core feature: Google Sheets Cloud Integration! PaisaWise connects directly to your Google Spreadsheet. With one click on 'Copy All Data', our engine formats every transaction into eight standardized columns with zero duplicate rows. Simply click cell A1 in Google Sheets and press Ctrl+V to populate your spreadsheet instantly.",
      'Target Sheet ID: 1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA'
    );

    // Click Connect & Sync
    const syncButton = page.locator('button:has-text("Connect & Sync with Google Sheet")').first();
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await page.waitForTimeout(1500);
    }

    // Click Copy button
    const copyButton = page.locator('button:has-text("Copy All Data for Google Sheets (Ctrl+V)")').first();
    if (await copyButton.isVisible()) {
      await copyButton.click();
      await page.waitForTimeout(1200);
    }

    // Open Direct TSV preview box
    const tsvBtn = page.locator('button:has-text("Show Direct TSV Data Box")').first();
    if (await tsvBtn.isVisible()) {
      await tsvBtn.click();
      await page.waitForTimeout(1000);
    }

    await smoothScroll(page, 240);
    await page.waitForTimeout(1500);
    await smoothScroll(page, -240);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene9);

    // =========================================================================
    // SCENE 10: Personalized Theme Switcher (Dark & Light Mode) (13.97s)
    // =========================================================================
    console.log('▶ [Scene 10/11] Recording Theme Switcher (Dark / Light Mode)...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/settings`);

    await showPresenterCaption(
      page,
      '🌓 Theme Customization',
      "PaisaWise is built with personalized user experience. You can switch smoothly between dark mode and light mode with a single click, providing seamless readability across all daylight conditions.",
      'One-click high-contrast Dark Mode and crisp Light Mode toggle'
    );

    // Switch to Mint Frost (Light theme)
    const mintThemeCard = page.locator('text="Mint Frost"').first();
    if (await mintThemeCard.isVisible()) {
      await mintThemeCard.click();
      await page.waitForTimeout(2500);
    }

    // Switch back to Professional Carbon (Dark theme)
    const carbonThemeCard = page.locator('text="Professional Carbon"').first();
    if (await carbonThemeCard.isVisible()) {
      await carbonThemeCard.click();
      await page.waitForTimeout(2000);
    }
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene10);

    // =========================================================================
    // SCENE 11: Production Vercel Deployment & Concluding Summary (19.66s)
    // =========================================================================
    console.log('▶ [Scene 11/11] Recording Live Vercel Production & Concluding Summary...');
    sceneStart = Date.now();
    await navigateTo(page, `${baseUrl}/api/health`);
    await page.waitForTimeout(1500);

    await showPresenterCaption(
      page,
      '🚀 Vercel Production Live',
      "Finally, PaisaWise is deployed live in production on Vercel with high availability serverless APIs and Supabase PostgreSQL. Thank you for watching the PaisaWise demonstration! Track your money, understand your habits, and build a better financial future.",
      'Status 200 OK — Express 5 Serverless API + Supabase PostgreSQL on Vercel'
    );

    // Final hero shot back on live production dashboard
    await navigateTo(page, `${baseUrl}/`);
    await page.waitForTimeout(2000);
    await runSceneWithDuration(sceneStart, SCENE_DURATIONS.scene11);

    console.log('✔ All 11 scenes recorded successfully! Closing browser to write video file...');
    await page.waitForTimeout(500);

    await page.close();
    await context.close();
    await browser.close();

    // Identify recorded webm file in recordings
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.webm') && !f.includes('Full_Demo') && !f.includes('raw_walkthrough'));
    if (files.length > 0) {
      const newestFile = files.sort((a, b) => {
        return fs.statSync(path.join(outputDir, b)).mtimeMs - fs.statSync(path.join(outputDir, a)).mtimeMs;
      })[0];

      const rawVideoPath = path.join(outputDir, 'raw_walkthrough.webm');
      if (fs.existsSync(rawVideoPath)) {
        fs.unlinkSync(rawVideoPath);
      }
      fs.renameSync(path.join(outputDir, newestFile), rawVideoPath);
      console.log(`\n✔ Raw video saved at: ${rawVideoPath}`);
    }

    // =========================================================================
    // MUX AUDIO AND VIDEO USING FULL FFMPEG
    // =========================================================================
    console.log('\n===============================================================');
    console.log('   STEP 2: MUXING RECORDED VIDEO WITH INDIAN ACCENT VOICEOVER  ');
    console.log('===============================================================\n');

    const rawVideoPath = path.join(outputDir, 'raw_walkthrough.webm');
    const masterAudioPath = path.join(rootDir, 'audio', 'PaisaWise_Indian_Voiceover_Master.mp3');
    const outputMp4 = path.join(outputDir, 'PaisaWise_Full_Demo_Indian_Voiceover.mp4');
    const outputWebm = path.join(outputDir, 'PaisaWise_Full_Demo_Indian_Voiceover.webm');
    const artifactDir = 'C:\\Users\\sushant\\.gemini\\antigravity\\brain\\cba7358f-dae7-427d-bcc4-10ab0f88495b';
    const artifactMp4 = path.join(artifactDir, 'PaisaWise_Full_Demo_Indian_Voiceover.mp4');

    // 1. Generate MP4 with H.264 + AAC 192kbps (compatible everywhere)
    console.log('1. Encoding high-definition MP4 (H.264 + AAC 192kbps)...');
    const mp4Cmd = `"${ffmpegExe}" -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputMp4}" -y`;
    execSync(mp4Cmd, { stdio: 'inherit' });
    const mp4Stats = fs.statSync(outputMp4);
    console.log(`✔ MP4 generated: ${outputMp4} (${(mp4Stats.size / (1024 * 1024)).toFixed(2)} MB)\n`);

    // 2. Generate WebM with VP9/VP8 copy + Opus audio
    console.log('2. Muxing WebM with Opus audio...');
    const webmCmd = `"${ffmpegExe}" -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v copy -c:a libopus -b:a 128k -shortest "${outputWebm}" -y`;
    execSync(webmCmd, { stdio: 'inherit' });
    const webmStats = fs.statSync(outputWebm);
    console.log(`✔ WebM generated: ${outputWebm} (${(webmStats.size / (1024 * 1024)).toFixed(2)} MB)\n`);

    // 3. Copy to Artifact Directory
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(outputMp4, artifactMp4);
      console.log(`✔ Copied to Artifact Directory: ${artifactMp4}`);
    }

    // 4. Verify streams
    console.log('\nFinal Stream Verification for MP4:');
    const streams = execSync(`"${ffprobeExe}" -v error -show_entries stream=index,codec_name,codec_type -of default=noprint_wrappers=1 "${outputMp4}"`).toString().trim();
    console.log(streams);

    console.log('\n===============================================================');
    console.log('  🎉 DEMO VIDEO WITH SPOKEN INDIAN ACCENT VOICEOVER IS COMPLETE!');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Error during demo recording:', err);
    await browser.close();
  }
}

recordFullDemo().catch(console.error);
