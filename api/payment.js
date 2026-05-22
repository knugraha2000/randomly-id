import crypto from 'crypto';

const ARRANET_URL = 'https://vision.arranetwork.com:45065/api/multibiller';
const MERCHANT_ID = 'RND0001';
const PRODUCT = '882002';

function generateSignature(amount, refnum, merchantId, billerCode, custId, secretKey) {
  const raw = `${amount}${refnum}${merchantId}${billerCode}${custId}${secretKey}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRefnum() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, amount, cust_id, refnum: adviceRefnum, partner_ref } = req.body;
  const secretKey = process.env.ARNQ_RIS;

  if (!secretKey) return res.status(500).json({ error: 'Payment config missing' });

  // ── INQUIRY — Generate QRIS ──
  if (action === 'inquiry') {
    const amountStr = (amount || '5000').toString();
    const custId = cust_id || 'rnd000000';
    const refnum = generateRefnum();
    const signature = generateSignature(amountStr, refnum, MERCHANT_ID, PRODUCT, custId, secretKey);

    const payload = {
      tran_type: 'inquiry',
      amount_tran: amountStr,
      merchant_id: MERCHANT_ID,
      refnum: refnum,
      signature: signature,
      product: PRODUCT,
      cust_id: custId,
      private_data: {
        ipAddress: '127.0.0.1',
        qrType: '03',
        subMerchantId: '88100000000000',
        merchantid: null,
        terminalId: 'RANDOMLY001',
        storeId: 'RANDOMLY001',
        validTime: '300',
        tip: 'False'
      },
      admin_fee: '0'
    };

    try {
      const response = await fetch(ARRANET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.resp_code?.rc === '0000') {
        return res.status(200).json({
          success: true,
          refnum: refnum,
          qr_content: data.private_data?.qrContent,
          partner_ref: data.private_data?.partnerReferenceNo
        });
      } else {
        return res.status(200).json({
          success: false,
          error: data.resp_code?.msg || 'Gagal generate QR'
        });
      }
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // ── ADVICE — Cek status pembayaran ──
  if (action === 'advice') {
    const amountStr = (amount || '5000').toString();
    const custId = cust_id || 'rnd000000';
    const refnum = adviceRefnum || generateRefnum();
    const signature = generateSignature(amountStr, refnum, MERCHANT_ID, PRODUCT, custId, secretKey);

    const payload = {
      tran_type: 'advice',
      amount_tran: amountStr,
      merchant_id: MERCHANT_ID,
      refnum: refnum,
      signature: signature,
      product: PRODUCT,
      cust_id: custId,
      private_data: {
        ipAddress: '127.0.0.1',
        originalPartnerReferenceNo: partner_ref,
        merchantId: null,
        subMerchantId: '88100000000000',
        terminalId: null,
        storeId: 'RANDOMLY001'
      },
      admin_fee: '0'
    };

    try {
      const response = await fetch(ARRANET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.resp_code?.rc === '0000') {
        const paid = data.private_data?.paidTime != null;
        return res.status(200).json({
          success: true,
          paid: paid,
          paid_time: data.private_data?.paidTime,
          issuer_id: data.private_data?.issuerId,
          nett_amount: data.private_data?.nettAmount
        });
      } else {
        return res.status(200).json({
          success: false,
          paid: false,
          error: data.resp_code?.msg
        });
      }
    } catch (e) {
      return res.status(500).json({ success: false, paid: false, error: e.message });
    }
  }

  // ── CALLBACK — Terima push dari Arranet ──
  if (action === 'callback') {
    // Nanti implement unlock logic di sini
    console.log('Callback received:', JSON.stringify(req.body));
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
