// lib/renderCardImage.js
//
// Render kartu quiz/fun fact jadi PNG asli (dibutuhkan Instagram API — dia
// nggak nerima HTML, cuma nerima URL gambar). Pakai satori (bikin SVG dari
// pohon elemen mirip React, tanpa perlu JSX/build step) + resvg (SVG -> PNG).
//
// PENTING soal jawaban kuis: gambar ini SENGAJA tidak menampilkan jawaban
// benar — itu ditaruh di caption instagram, biar orang penasaran dan mau
// komentar/klik ke randomly.id.

const fs = require('fs');
const path = require('path');

let satoriFn;
let ResvgClass;
let fontRegular;
let fontBold;

function loadDeps() {
  if (!satoriFn) satoriFn = require('satori').default;
  if (!ResvgClass) ResvgClass = require('@resvg/resvg-js').Resvg;
  if (!fontRegular) {
    fontRegular = fs.readFileSync(path.join(__dirname, '..', 'assets', 'fonts', 'PlusJakartaSans-Regular.ttf'));
  }
  if (!fontBold) {
    fontBold = fs.readFileSync(path.join(__dirname, '..', 'assets', 'fonts', 'PlusJakartaSans-Bold.ttf'));
  }
}

function badge(text) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        background: '#0D0D0D',
        color: '#FFD60A',
        padding: '10px 20px',
        borderRadius: 999,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: 1,
      },
      children: text,
    },
  };
}

function buildTree(post) {
  const isQuiz = post.type === 'quiz';
  const p = post.payload || {};

  const headerRow = {
    type: 'div',
    props: {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      children: [
        badge(isQuiz ? 'KUIS RANDOM' : 'FUN FACT'),
        { type: 'div', props: { style: { fontSize: 28, fontWeight: 800, color: '#0D0D0D' }, children: 'randomly.id' } },
      ],
    },
  };

  const bodyChildren = isQuiz
    ? [
        { type: 'div', props: { style: { fontSize: 56, fontWeight: 800, color: '#0D0D0D', lineHeight: 1.25 }, children: p.question || '' } },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 },
            children: (p.choices || []).map((c) => ({
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  background: '#fff',
                  border: '3px solid #0D0D0D',
                  borderRadius: 16,
                  padding: '18px 24px',
                  fontSize: 30,
                  fontWeight: 400,
                  color: '#0D0D0D',
                },
                children: c,
              },
            })),
          },
        },
      ]
    : [
        { type: 'div', props: { style: { fontSize: 60, fontWeight: 800, color: '#0D0D0D', lineHeight: 1.2 }, children: p.nama || '' } },
        { type: 'div', props: { style: { fontSize: 34, fontWeight: 400, color: '#0D0D0D', lineHeight: 1.4, marginTop: 8 }, children: p.alasan || '' } },
      ];

  const footerText = isQuiz
    ? 'jawabannya ada di caption — atau cek randomly.id'
    : 'lebih banyak fakta random di randomly.id';

  return {
    type: 'div',
    props: {
      style: {
        width: '1080px',
        height: '1080px',
        background: '#F5F0E6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Plus Jakarta Sans',
      },
      children: {
        type: 'div',
        props: {
          style: {
            width: '952px',
            height: '952px',
            background: '#FFD60A',
            border: '6px solid #0D0D0D',
            borderRadius: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 64,
          },
          children: [
            headerRow,
            { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', gap: 32 }, children: bodyChildren } },
            { type: 'div', props: { style: { fontSize: 26, fontWeight: 400, color: '#0D0D0D' }, children: footerText } },
          ],
        },
      },
    },
  };
}

async function renderCardImage(post) {
  loadDeps();
  const svg = await satoriFn(buildTree(post), {
    width: 1080,
    height: 1080,
    fonts: [
      { name: 'Plus Jakarta Sans', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Plus Jakarta Sans', data: fontBold, weight: 800, style: 'normal' },
    ],
  });
  const resvg = new ResvgClass(svg, { fitTo: { mode: 'width', value: 1080 } });
  return resvg.render().asPng(); // Buffer
}

module.exports = { renderCardImage };
