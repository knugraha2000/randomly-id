// lib/socialContent.js
//
// Generator konten buat Agent 2 — SENGAJA pakai prompt yang PERSIS SAMA
// kayak yang udah jalan di q.html (quiz) dan funfact.html (fun fact), biar
// gaya/kualitas kontennya konsisten sama yang pengguna udah kenal di app.
// Bedanya: di sini dipanggil dari server (cron), bukan dari klik user.

const TOPICS_QUIZ = [
  'sejarah dunia', 'sains & alam', 'teknologi', 'budaya & seni', 'musik',
  'geografi', 'tubuh manusia', 'makanan', 'olahraga', 'bahasa', 'ekonomi',
  'psikologi', 'wisata',
];

const TOPICS_FUNFACT = [
  'sejarah manusia', 'teknologi & sains', 'negara & geografi', 'bahasa & budaya',
  'makanan & kuliner', 'musik & seni', 'olahraga & rekor', 'tubuh manusia',
  'luar angkasa', 'ekonomi & uang', 'hukum & politik', 'arkeologi',
  'psikologi', 'matematika', 'transportasi',
];

async function callClaude(prompt, maxTokens) {
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (!claudeKey) throw new Error('ANTHROPIC_API_KEY belum diset');

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(`Claude API error: ${JSON.stringify(data).slice(0, 300)}`);

  const text = data.content?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Response tidak mengandung JSON: ${text.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}

// Berdasar dari fetchOneQuestion() di q.html, TAPI dengan tambahan batas
// panjang teks — beda dari versi in-app karena kartu gambar ukurannya
// tetap (nggak bisa di-scroll kayak UI di app), jadi soal yang kepanjangan
// bisa "meluber" keluar kartu. Ini sempat kejadian di post pertama.
async function generateQuiz() {
  const topic = TOPICS_QUIZ[Math.floor(Math.random() * TOPICS_QUIZ.length)];
  const seed = Math.floor(Math.random() * 999999);

  const prompt = `Buat 1 soal kuis pilihan ganda yang aneh, counterintuitive, dan bikin orang mikir keras. Topik: ${topic}. Seed: ${seed}.

FILOSOFI: Jawaban harus bikin orang bilang "hah, beneran?" setelah tau. Bukan hafalan biasa.

ATURAN WAJIB:
1. Semua pilihan harus sama-sama terasa masuk akal
2. Jawaban benar harus counterintuitive atau mengejutkan
3. Hindari soal hafalan yang predictable
4. Semua pilihan harus tipe data yang sama (semua angka / semua negara / semua nama)
5. Bahasa Indonesia casual
6. PENTING — batas panjang (kartu gambar ukurannya tetap, teks kepanjangan akan terpotong):
   - "question" MAKSIMAL 90 karakter
   - tiap item "choices" (termasuk "A. " dst) MAKSIMAL 38 karakter
   - "explanation" MAKSIMAL 120 karakter

Balas HANYA JSON object tanpa backtick:
{"question":"pertanyaan","choices":["A. ..","B. ..","C. ..","D. .."],"answer":"A","explanation":"penjelasan singkat kenapa itu jawabannya, casual dan sedikit mengejutkan"}`;

  const payload = await callClaude(prompt, 400);
  return { topic, payload };
}

// Sama persis dengan cabang "tanpa seedText" di funfact.html (karena post
// otomatis harian nggak punya konteks user seperti di app).
async function generateFunFact() {
  const domain = TOPICS_FUNFACT[Math.floor(Math.random() * TOPICS_FUNFACT.length)];
  const seed = Math.floor(Math.random() * 999999);

  const prompt = `Berikan 1 fakta mengejutkan dari domain: ${domain}.

Tulis field "alasan" seperti ini — 1 kalimat pendek, ngobrol, kayak nulis caption atau tweet:

CONTOH YANG BENAR:
"kamu udah buang 6 bulan hidup cuma buat nunggu loading doang"
"otak manusia sebenernya ga bisa multitasking, yang ada cuma pura-pura bisa"
"uang kertas yang kamu pegang udah disentuh ribuan orang yang ga cuci tangan"

CONTOH YANG SALAH:
"Penelitian menunjukkan bahwa rata-rata manusia menghabiskan waktu yang signifikan..."

Aturan: jangan pakai emoji, jangan formal, 1 kalimat saja, Bahasa Indonesia casual. Seed: ${seed}. Balas HANYA JSON tanpa backtick:
{"emoji":"(1 emoji)","nama":"(JUDUL FAKTA KAPITAL, maks 5 kata)","alasan":"(penjelasan 3 kalimat, ada angka/data konkret, mengejutkan)","fun_fact":"","tags":["tag1","tag2","tag3"]}`;

  const payload = await callClaude(prompt, 500);
  return { topic: domain, payload };
}

module.exports = { generateQuiz, generateFunFact, TOPICS_QUIZ, TOPICS_FUNFACT };
