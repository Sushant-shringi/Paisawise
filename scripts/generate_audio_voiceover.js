import fs from 'node:fs';
import path from 'node:path';

const scenes = [
  {
    id: 'scene1_intro',
    title: 'Introduction & Indian Financial Platform',
    text: "Namaste and hello everyone! Welcome to the live demonstration of PaisaWise, an intelligent personal finance management platform tailored for Indian financial habits. Built with React 19, TypeScript, and Express, PaisaWise brings complete control over your money."
  },
  {
    id: 'scene2_auth',
    title: 'Authentication & Gmail OTP Security',
    text: "User security is paramount. When a user registers, PaisaWise executes multi factor authentication. Our backend connects with Gmail SMTP to deliver a single use, six digit OTP verification code straight to the user's email inbox."
  },
  {
    id: 'scene3_dashboard',
    title: 'Financial Cockpit & Indian Rupee Analytics',
    text: "Here is the central dashboard, completely denominated in Indian Rupees. It tracks Total Income, Total Expenses, Net Savings, and an automated Financial Health Score, complete with interactive category breakdowns and daily expense charts."
  },
  {
    id: 'scene4_transactions',
    title: 'Transactions & UPI Expense Logging',
    text: "Under Transactions, users can log daily payments with native support for UPI, Net Banking, and Credit Cards. Every entry is securely saved with decimal financial precision in our Supabase PostgreSQL database."
  },
  {
    id: 'scene5_budgets',
    title: 'Monthly Category Budgets',
    text: "The Budgets module lets you assign category wise spending limits with automated eighty percent warning thresholds to keep expenses disciplined and prevent overspending."
  },
  {
    id: 'scene6_goals',
    title: 'Savings Goals & Milestone Tracking',
    text: "Savings Goals empower users to plan major financial milestones, such as an emergency fund, gadget purchases, or home down payments, with real time progress bars and one click contributions."
  },
  {
    id: 'scene7_recurring',
    title: 'Recurring Commitments & Subscriptions',
    text: "The Subscriptions and Recurring manager tracks fixed commitments like rent, insurance EMIs, and streaming services, ensuring you never miss a billing date."
  },
  {
    id: 'scene8_sheets',
    title: 'Google Sheets Live Cloud Synchronization',
    text: "Now for our highlight feature: Google Sheets Cloud Integration! PaisaWise connects to your spreadsheet, exports structured Tab Separated Values, and when pasted into cell A1, populates all eight columns with zero duplicate rows guaranteed."
  },
  {
    id: 'scene9_production',
    title: 'Live Vercel Production & Conclusion',
    text: "PaisaWise is deployed live in production on Vercel with high availability serverless APIs and Supabase PostgreSQL. Track your money, understand your habits, and build a better financial future with PaisaWise. Thank you so much!"
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

// Split long text into <= 180 char sentences for Google TTS limit
async function generateSpeechForText(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const audioBuffers = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    
    // Chunk if longer than 180 chars
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
    // Small pause between sentences
    await new Promise(r => setTimeout(r, 200));
  }

  return Buffer.concat(audioBuffers);
}

async function main() {
  const audioDir = path.resolve('audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  console.log('===============================================================');
  console.log('   GENERATING NATURAL INDIAN ACCENT VOICEOVER AUDIO TRACKS    ');
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
    // Add 1 second of silence buffer between scenes
    await new Promise(r => setTimeout(r, 400));
  }

  // Concatenate into Master Track
  const masterAudio = Buffer.concat(masterChunks);
  const masterPath = path.join(audioDir, 'PaisaWise_Indian_Voiceover_Master.mp3');
  fs.writeFileSync(masterPath, masterAudio);

  console.log('\n===============================================================');
  console.log(`  🎉 MASTER VOICEOVER GENERATED SUCCESSFULLY!`);
  console.log(`  📁 Location: ${masterPath}`);
  console.log(`  📊 File Size: ${(masterAudio.length / 1024).toFixed(1)} KB`);
  console.log('===============================================================\n');
}

main().catch(console.error);
