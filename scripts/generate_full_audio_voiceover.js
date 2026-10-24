import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const scenes = [
  {
    id: 'scene1_intro',
    title: 'Introduction & Indian Financial Platform',
    caption: 'Namaste and hello everyone! Welcome to the full live walkthrough of PaisaWise, an intelligent personal finance platform tailored for Indian financial habits. PaisaWise brings complete clarity to your daily income, expenses, and long term wealth.',
    badge: '🇮🇳 Brand Introduction',
    feature: 'React 19, TypeScript, Tailwind CSS, Express, and Supabase PostgreSQL',
    text: "Namaste and hello everyone! Welcome to the full live walkthrough of PaisaWise, an intelligent personal finance platform tailored for Indian financial habits. PaisaWise brings complete clarity to your daily income, expenses, and long term wealth."
  },
  {
    id: 'scene2_auth',
    title: 'Authentication & Gmail OTP Security',
    caption: 'Let us examine our secure authentication system. Users can register with their legal name, email, and password. With Bcrypt encryption and verified Gmail SMTP integration, single-use six digit OTP codes are dispatched directly to the user\'s inbox.',
    badge: '🔐 Multi-Factor Auth',
    feature: 'Bcrypt Password Hashing & Real-time Gmail SMTP OTP verification',
    text: "Let us examine our secure authentication system. Users can register with their legal name, email, and password. With Bcrypt encryption and verified Gmail SMTP integration, single use six digit OTP codes are dispatched directly to the user's inbox for high security onboarding."
  },
  {
    id: 'scene3_dashboard',
    title: 'Financial Cockpit & Indian Rupee Analytics',
    caption: 'Stepping into the main Financial Cockpit! Everything is tracked in Indian Rupees. We see real time cards for Total Income, Total Expenses, Net Savings, and our algorithmic Financial Health Score, along with dynamic charts.',
    badge: '📊 Financial Cockpit',
    feature: 'Total Income, Expenses, Net Savings, and Algorithmic Health Score in ₹ INR',
    text: "Stepping into the main Financial Cockpit! Everything is tracked in Indian Rupees. We see real time cards for Total Income, Total Expenses, Net Savings, and our algorithmic Financial Health Score. Recharts power our dynamic category donut and daily spending trends."
  },
  {
    id: 'scene4_transactions',
    title: 'Transactions & UPI Expense Logging',
    caption: 'Next is the Transactions module. Users can search and filter across UPI, Net Banking, and Credit Cards. Let us add a new transaction: a grocery expense of ₹2,450 paid via UPI, which immediately updates the ledger.',
    badge: '💳 UPI & Cards Ledger',
    feature: 'Categorized transaction ledger with date filters and live UPI expense logging',
    text: "Next is the Transactions module. Users can search and filter across UPI, Net Banking, and Credit Cards. Let us add a new transaction: a grocery expense of ₹2,450 paid via UPI. Once submitted, it appears immediately in the ledger and updates all balance calculations."
  },
  {
    id: 'scene5_budgets',
    title: 'Monthly Category Budgets & 80% Threshold Warnings',
    caption: 'Under Budgets, you can set spending limits for groceries, rent, and shopping. PaisaWise provides visual progress bars and automated eighty percent threshold warnings to safeguard against overspending.',
    badge: '🎯 Budget Discipline',
    feature: 'Category spending caps with dynamic 80% warning triggers',
    text: "Under Budgets, you can set spending limits for groceries, rent, and shopping. PaisaWise provides visual progress bars and automated eighty percent threshold warnings to safeguard against overspending."
  },
  {
    id: 'scene6_goals',
    title: 'Savings Goals & Live 1-Click Contribution',
    caption: 'The Savings Goals module helps users plan for milestone targets like an Emergency Fund or electronics. Here, we contribute ₹5,000 to our Emergency Fund with one click, updating the target progress bar.',
    badge: '🏆 Milestone Goals',
    feature: 'Target tracking, countdown to deadline, and 1-click fund contribution',
    text: "The Savings Goals module helps users plan for milestone targets like an Emergency Fund or electronics. Here, we can contribute ₹5,000 to our Emergency Fund with one click, immediately updating the target progress bar."
  },
  {
    id: 'scene7_recurring',
    title: 'Recurring Commitments & Subscriptions Tracker',
    caption: 'Our Recurring Expenses and Subscriptions tracker organizes monthly fixed obligations such as rent, broadband, insurance EMIs, and streaming services, ensuring you never miss a billing date.',
    badge: '🔄 Subscriptions & EMIs',
    feature: 'Automated recurring expense calculations & payment schedule tracking',
    text: "Our Recurring Expenses and Subscriptions tracker organizes monthly fixed obligations such as rent, broadband, insurance EMIs, and streaming services, ensuring you never miss a billing date."
  },
  {
    id: 'scene8_analytics',
    title: 'Analytics & Financial Health Reports',
    caption: 'Under Analytics and Reports, PaisaWise visualizes income versus expense velocity, savings rate trends, and monthly breakdown statements that can be exported directly for tax and financial planning.',
    badge: '📈 Visual Analytics',
    feature: 'Cash flow velocity curves, savings rate trends, and exportable reports',
    text: "Under Analytics and Reports, PaisaWise visualizes income versus expense velocity, savings rate trends, and monthly breakdown statements that can be exported directly for tax and financial planning."
  },
  {
    id: 'scene9_sheets',
    title: 'Google Sheets Cloud Integration (Core Requirement)',
    caption: 'Now for our core feature: Google Sheets Cloud Integration! PaisaWise connects directly to your Google Spreadsheet. With one click on "Copy All Data", all rows format into eight standardized columns with zero duplicates. Simply paste into cell A1.',
    badge: '📊 Cloud Sheets Sync',
    feature: 'Direct Google Sheets sync, TSV clipboard copy, and RFC-4180 zero-duplicate export',
    text: "Now for our core feature: Google Sheets Cloud Integration! PaisaWise connects directly to your Google Spreadsheet. With one click on 'Copy All Data', our engine formats every transaction into eight standardized columns with zero duplicate rows. Simply click cell A1 in Google Sheets and press Ctrl+V to populate your spreadsheet instantly."
  },
  {
    id: 'scene10_theme',
    title: 'Personalized UI & Light / Dark Mode Toggle',
    caption: 'PaisaWise is built with personalized user experience. You can switch smoothly between dark mode and light mode with a single click, providing seamless readability across all daylight conditions.',
    badge: '🌓 Theme Customization',
    feature: 'One-click high-contrast Dark Mode and crisp Light Mode toggle',
    text: "PaisaWise is built with personalized user experience. You can switch smoothly between dark mode and light mode with a single click, providing seamless readability across all daylight conditions."
  },
  {
    id: 'scene11_production',
    title: 'Live Vercel Production & Concluding Summary',
    caption: 'Finally, PaisaWise is deployed live in production on Vercel with high availability serverless APIs and Supabase PostgreSQL. Thank you for watching the PaisaWise demonstration!',
    badge: '🚀 Vercel Production Live',
    feature: 'Status 200 OK — Express 5 Serverless API + Supabase PostgreSQL on Vercel',
    text: "Finally, PaisaWise is deployed live in production on Vercel with high availability serverless APIs and Supabase PostgreSQL. Thank you for watching the PaisaWise demonstration! Track your money, understand your habits, and build a better financial future."
  }
];

async function downloadTtsChunk(text) {
  const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=en-IN&client=tw-ob&q=' + encodeURIComponent(text);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) {
    throw new Error(`TTS failed with HTTP ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function generateSpeechForText(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const audioBuffers = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    if (trimmed.length > 180) {
      const words = trimmed.split(' ');
      let currentChunk = '';
      for (const word of words) {
        if ((currentChunk + ' ' + word).length > 180) {
          const buf = await downloadTtsChunk(currentChunk.trim());
          audioBuffers.push(buf);
          currentChunk = word;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }
      if (currentChunk.trim()) {
        const buf = await downloadTtsChunk(currentChunk.trim());
        audioBuffers.push(buf);
      }
    } else {
      const buf = await downloadTtsChunk(trimmed);
      audioBuffers.push(buf);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  return Buffer.concat(audioBuffers);
}

async function main() {
  const audioDir = path.resolve(__dirname, '..', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  console.log('===============================================================');
  console.log('   GENERATING EXHAUSTIVE INDIAN VOICEOVER AUDIO TRACKS         ');
  console.log('===============================================================\n');

  const masterChunks = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`[${i + 1}/${scenes.length}] Generating Indian voiceover for: ${scene.title}...`);
    const audio = await generateSpeechForText(scene.text);
    const sceneFilePath = path.join(audioDir, `${scene.id}.mp3`);
    fs.writeFileSync(sceneFilePath, audio);
    console.log(`  ✓ Saved: ${sceneFilePath} (${(audio.length / 1024).toFixed(1)} KB)`);
    masterChunks.push(audio);
    await new Promise(r => setTimeout(r, 400));
  }

  const masterAudio = Buffer.concat(masterChunks);
  const masterPath = path.join(audioDir, 'PaisaWise_Indian_Voiceover_Master.mp3');
  fs.writeFileSync(masterPath, masterAudio);

  console.log('\n===============================================================');
  console.log(`  🎉 MASTER VOICEOVER GENERATED SUCCESSFULLY!`);
  console.log(`  📁 Location: ${masterPath}`);
  console.log(`  📊 File Size: ${(masterAudio.length / 1024).toFixed(1)} KB`);
  console.log('===============================================================\n');
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('generate_full_audio_voiceover.js')) {
  main().catch(console.error);
}
