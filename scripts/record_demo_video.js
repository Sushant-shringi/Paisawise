import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// Helper to show styled Indian Presenter caption overlay in video
async function showPresenterCaption(page, speakerText, technicalNote, durationMs = 4500) {
  await page.evaluate(({ speakerText, technicalNote }) => {
    let overlay = document.getElementById('presenter-caption-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'presenter-caption-overlay';
      overlay.style.position = 'fixed';
      overlay.style.bottom = '24px';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.width = '90%';
      overlay.style.maxWidth = '960px';
      overlay.style.background = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(9, 13, 22, 0.98))';
      overlay.style.backdropFilter = 'blur(16px)';
      overlay.style.color = '#ffffff';
      overlay.style.padding = '16px 24px';
      overlay.style.borderRadius = '20px';
      overlay.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.25)';
      overlay.style.border = '1.5px solid rgba(16, 185, 129, 0.45)';
      overlay.style.fontFamily = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
      overlay.style.zIndex = '9999999';
      overlay.style.pointerEvents = 'none';
      overlay.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 14px;">
        <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #06b6d4); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
          🎙️
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #34d399; background: rgba(16, 185, 129, 0.15); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.3);">
                🇮🇳 Presenter Narrative (Indian Accent)
              </span>
              <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">
                PaisaWise Live Walkthrough
              </span>
            </div>
            <span style="font-size: 11px; font-family: monospace; color: #10b981; font-weight: 800; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 4px;">
              ₹ INR FINANCES
            </span>
          </div>
          <div style="font-size: 15px; font-weight: 600; line-height: 1.45; color: #f8fafc; margin-bottom: 3px;">
            "${speakerText}"
          </div>
          ${technicalNote ? `
            <div style="font-size: 11.5px; color: #a7f3d0; font-weight: 500; display: flex; align-items: center; gap: 5px;">
              <span>⚡ Key Feature:</span> <span>${technicalNote}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }, { speakerText, technicalNote });

  await page.waitForTimeout(durationMs);
}

// Cursor movement helper
async function smoothScroll(page, distance, steps = 15) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy(0, d), distance / steps);
    await page.waitForTimeout(40);
  }
}

async function recordPaisaWiseDemo() {
  console.log('===============================================================');
  console.log('   STARTING AUTOMATED VIDEO DEMO RECORDING (INDIAN ACCENT)    ');
  console.log('===============================================================\n');

  const outputDir = path.resolve('recordings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Launch Edge browser in headless mode with video recording enabled
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
    // -------------------------------------------------------------------------
    // SCENE 1: Introduction & Brand Presentation
    // -------------------------------------------------------------------------
    console.log('▶ [Scene 1/7] Recording Introduction & Brand Presentation...');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await showPresenterCaption(
      page,
      "Namaste and hello everyone! Welcome to the live demonstration of PaisaWise — an intelligent personal finance platform tailored for Indian financial habits.",
      "React 19, TypeScript, Tailwind CSS, Express, and Supabase PostgreSQL",
      5000
    );

    await showPresenterCaption(
      page,
      "PaisaWise is deployed live in production on Vercel, featuring multi-factor Email OTP authentication and bidirectional Google Sheets synchronization.",
      "Production URL: paisawise-two.vercel.app",
      4500
    );

    // -------------------------------------------------------------------------
    // SCENE 2: Authentication & Email OTP Security
    // -------------------------------------------------------------------------
    console.log('▶ [Scene 2/7] Recording Authentication & Email OTP Security...');
    const createAccountTab = page.locator('button:has-text("Create Account")').first();
    if (await createAccountTab.isVisible()) {
      await createAccountTab.click();
      await page.waitForTimeout(1000);
    }

    await showPresenterCaption(
      page,
      "Let us look at secure onboarding. Users register with their legal name, email, and password, protected by enterprise-grade Bcrypt hashing.",
      "Bcrypt encryption + 6-digit expiring Email OTP verification",
      4500
    );

    // Fill registration form if visible
    const nameInput = page.locator('input[placeholder="Legal Name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Sushant Shringi');
      await page.waitForTimeout(400);
      await page.locator('input[placeholder="Email Address"]').fill('sushantshringi444@gmail.com');
      await page.waitForTimeout(400);
      await page.locator('input[placeholder="Password (min 6 characters)"]').fill('PaisaWise@2026!');
      await page.waitForTimeout(400);

      const tos = page.locator('#tos');
      if (await tos.isVisible()) {
        await tos.check();
        await page.waitForTimeout(500);
      }
    }

    await showPresenterCaption(
      page,
      "PaisaWise integrates directly with Gmail SMTP to deliver real, single-use 6-digit OTP codes straight to your email inbox.",
      "Verified Gmail SMTP delivery with automated fallback handling",
      4500
    );

    // Switch to explore with demo records to see full populated dashboard
    const demoLink = page.locator('button:has-text("Explore with pre-seeded demo records")');
    if (await demoLink.isVisible()) {
      await demoLink.click();
      await page.waitForTimeout(2500);
    } else {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    // -------------------------------------------------------------------------
    // SCENE 3: Main Financial Dashboard & Metrics
    // -------------------------------------------------------------------------
    console.log('▶ [Scene 3/7] Recording Financial Dashboard & Charts...');
    await showPresenterCaption(
      page,
      "Here is the central financial dashboard! All metrics are strictly tracked in Indian Rupees (₹) with real-time financial health analytics.",
      "Total Income, Total Expenses, Net Savings, and algorithmic Health Score",
      5000
    );

    await smoothScroll(page, 280);
    await page.waitForTimeout(1200);

    await showPresenterCaption(
      page,
      "Our interactive charts display category breakdowns and daily spending trends with granular insights for groceries, rent, and UPI payments.",
      "Interactive Recharts visualization with decimal financial precision",
      4500
    );

    await smoothScroll(page, -280);
    await page.waitForTimeout(1000);

    // -------------------------------------------------------------------------
    // SCENE 4: Transactions Management & UPI Logging
    // -------------------------------------------------------------------------
    console.log('▶ [Scene 4/7] Recording Transactions Management...');
    await page.goto(`${baseUrl}/transactions`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await showPresenterCaption(
      page,
      "Under Transactions, users can log daily expenses with full support for Indian payment methods like UPI, Net Banking, and Credit Cards.",
      "Categorised transaction ledger with date filters and search",
      4500
    );

    await smoothScroll(page, 200);
    await page.waitForTimeout(1000);
    await smoothScroll(page, -200);

    // -------------------------------------------------------------------------
    // SCENE 5: Budgets & Savings Goals
    // -------------------------------------------------------------------------
    console.log('▶ [Scene 5/7] Recording Budgets & Savings Goals...');
    await page.goto(`${baseUrl}/budgets`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await showPresenterCaption(
      page,
      "In the Budgets module, users set monthly spending limits with automated 80% threshold warnings to keep finances disciplined.",
      "Multi-category budget limits with real-time percentage progress",
      4500
    );

    await page.goto(`${baseUrl}/goals`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await showPresenterCaption(
      page,
      "Savings Goals allow Indian families and young professionals to plan major milestones — like buying a laptop, car, or building an emergency fund.",
      "Automated milestone tracking with 1-click goal contributions",
      4500
    );

    // -------------------------------------------------------------------------
    // SCENE 6: Google Sheets Cloud Integration ⭐
    // -------------------------------------------------------------------------
    console.log('▶ [Scene 6/7] Recording Google Sheets Cloud Integration...');
    await page.goto(`${baseUrl}/sheets`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await showPresenterCaption(
      page,
      "Now for our key integration requirement: Google Sheets Cloud Synchronization! Here is our connected spreadsheet URL.",
      "Target Sheet ID: 1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA",
      5000
    );

    // Click Sync button
    const syncButton = page.locator('button:has-text("Connect & Sync with Google Sheet")');
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await page.waitForTimeout(1800);
    }

    await showPresenterCaption(
      page,
      "With one click on 'Copy All Data', our engine prepares Tab-Separated Values with 8 standardized columns, preventing any duplicate rows in Google Sheets.",
      "Zero duplicates guaranteed via unique Transaction Reference IDs",
      5000
    );

    // Click Copy button
    const copyButton = page.locator('button:has-text("Copy All Data for Google Sheets (Ctrl+V)")');
    if (await copyButton.isVisible()) {
      await copyButton.click();
      await page.waitForTimeout(1500);
    }

    // Toggle Direct TSV preview box
    const toggleTsvBtn = page.locator('button:has-text("Show Direct TSV Data Box")');
    if (await toggleTsvBtn.isVisible()) {
      await toggleTsvBtn.click();
      await page.waitForTimeout(2000);
    }

    await smoothScroll(page, 220);
    await page.waitForTimeout(1200);

    await showPresenterCaption(
      page,
      "Users can simply single-click cell A1 in Google Sheets and press Ctrl+V to populate all columns instantly across Transaction ID, Date, Amount, and Notes.",
      "Seamless clipboard and RFC-4180 CSV export capability",
      5000
    );

    // -------------------------------------------------------------------------
    // SCENE 7: Vercel Production & Concluding Summary
    // -------------------------------------------------------------------------
    console.log('▶ [Scene 7/7] Recording Production Health & Conclusion...');
    await page.goto(`${baseUrl}/api/health`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    await showPresenterCaption(
      page,
      "The entire PaisaWise system is running live in production on Vercel with healthy endpoints, high availability, and secure PostgreSQL connectivity.",
      "Status 200 OK — Express 5 Serverless API + Supabase PostgreSQL",
      5000
    );

    // Return to dashboard for final hero shot
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await showPresenterCaption(
      page,
      "Thank you for watching the PaisaWise demonstration! Track Your Money, Understand Your Habits, and Build a Better Financial Future.",
      "PaisaWise — Empowering Financial Health across India",
      5000
    );

    console.log('✔ All scenes recorded successfully! Finalizing video file...');
    await page.waitForTimeout(1000);

    // Close page and context to trigger video finalization
    await page.close();
    await context.close();
    await browser.close();

    // Find the generated video file in recordings/ and rename to a clean filename
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.webm'));
    if (files.length > 0) {
      // Find newest file
      const newestFile = files.sort((a, b) => {
        return fs.statSync(path.join(outputDir, b)).mtimeMs - fs.statSync(path.join(outputDir, a)).mtimeMs;
      })[0];

      const finalPath = path.join(outputDir, 'PaisaWise_Live_Demo_Walkthrough.webm');
      if (fs.existsSync(finalPath)) {
        fs.unlinkSync(finalPath);
      }
      fs.renameSync(path.join(outputDir, newestFile), finalPath);

      const stats = fs.statSync(finalPath);
      console.log('\n===============================================================');
      console.log(`  🎉 DEMO VIDEO RECORDED SUCCESSFULLY!`);
      console.log(`  📁 Location: ${finalPath}`);
      console.log(`  📊 File Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
      console.log('===============================================================\n');
    }
  } catch (err) {
    console.error('Recording error:', err);
    await browser.close();
  }
}

recordPaisaWiseDemo();
