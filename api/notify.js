const ALLOWED_ORIGIN = 'https://epsond0234-cpu.github.io';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function refreshAccessToken() {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.KAKAO_CLIENT_ID,
    client_secret: process.env.KAKAO_CLIENT_SECRET,
    refresh_token: process.env.KAKAO_REFRESH_TOKEN,
  });
  const res = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to refresh Kakao access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

function buildMessage(body) {
  const type = body.type === 'as' ? 'AS 신청' : '상담 신청';
  const lines = [`[오피뉴디자인] 새로운 ${type}이 접수됐습니다.`, ''];

  if (body.name) lines.push(`이름: ${body.name}`);
  if (body.phone) lines.push(`연락처: ${body.phone}`);
  if (body.region) lines.push(`지역: ${body.region}`);
  if (body.pyeong) lines.push(`평형: ${body.pyeong}평`);
  if (body.apartment) lines.push(`아파트: ${body.apartment}`);
  if (body.startDate) lines.push(`공사 시작일: ${body.startDate}`);
  if (body.address) lines.push(`주소: ${body.address} ${body.addressDetail || ''}`.trim());
  if (body.scope) lines.push(`희망범위: ${body.scope}`);
  if (body.budget) lines.push(`예산: ${body.budget}만원`);
  if (body.asType) lines.push(`AS 유형: ${body.asType}`);
  if (body.visitDate) lines.push(`방문 희망일: ${body.visitDate}`);
  if (body.message) lines.push(`내용: ${body.message}`);

  return lines.join('\n');
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const accessToken = await refreshAccessToken();
    const text = buildMessage(req.body || {});

    const sendParams = new URLSearchParams({
      template_object: JSON.stringify({
        object_type: 'text',
        text,
        link: {
          web_url: 'https://epsond0234-cpu.github.io/-/consult.html',
          mobile_web_url: 'https://epsond0234-cpu.github.io/-/consult.html',
        },
      }),
    });

    const sendRes = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sendParams,
    });
    const sendData = await sendRes.json();

    if (sendData.result_code !== 0) {
      throw new Error('Kakao send failed: ' + JSON.stringify(sendData));
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
