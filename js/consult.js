document.addEventListener('DOMContentLoaded', () => {
  /* TODO: replace with your real Vercel deployment URL after setup, e.g.
     'https://opnew-design-site.vercel.app/api/notify' */
  const NOTIFY_API_URL = 'https://opnew-design-site.vercel.app/api/notify';

  /* Tab switching */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = {
    apply: document.getElementById('panel-apply'),
    as: document.getElementById('panel-as'),
  };
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      Object.values(panels).forEach((p) => p.classList.remove('is-active'));
      panels[btn.dataset.tab].classList.add('is-active');
    });
  });

  /* 희망범위 multi-select chips */
  const scopeChips = document.getElementById('scopeChips');
  if (scopeChips) {
    scopeChips.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-active');
      });
    });
  }

  /* Address search (Daum Postcode API) */
  document.querySelectorAll('[data-address-search]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const form = btn.closest('form');
      const zonecode = form.querySelector('[name="zonecode"]');
      const address = form.querySelector('[name="address"]');
      const detail = form.querySelector('[name="addressDetail"]');

      if (typeof daum === 'undefined' || !daum.Postcode) {
        alert('주소 검색 서비스를 불러올 수 없습니다. 기본주소/상세주소를 직접 입력해 주세요.');
        if (address) address.removeAttribute('readonly');
        if (zonecode) zonecode.removeAttribute('readonly');
        return;
      }

      new daum.Postcode({
        oncomplete(data) {
          zonecode.value = data.zonecode;
          address.value = data.roadAddress || data.jibunAddress;
          if (detail) detail.focus();
        },
      }).open();
    });
  });

  function collectApplyPayload(form) {
    const scope = Array.from(form.querySelectorAll('.chip.is-active')).map((c) => c.dataset.value).join(', ');
    return {
      type: 'apply',
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      region: form.region.options[form.region.selectedIndex]?.text || '',
      pyeong: form.pyeong.value.trim(),
      apartment: form.apartment.value.trim(),
      startDate: form.startDate.value,
      address: form.address.value.trim(),
      addressDetail: form.addressDetail.value.trim(),
      scope,
      budget: form.budget.value.trim(),
      message: form.message.value.trim(),
    };
  }

  function collectAsPayload(form) {
    return {
      type: 'as',
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      addressDetail: form.addressDetail.value.trim(),
      asType: form.asType.options[form.asType.selectedIndex]?.text || '',
      visitDate: form.visitDate.value,
      message: form.message.value.trim(),
    };
  }

  /* Form submit -> Kakao notify relay (falls back to local-only message if the relay is unreachable) */
  const setupForm = (formId, msgId, label, collectPayload) => {
    const form = document.getElementById(formId);
    const msg = document.getElementById(msgId);
    if (!form || !msg) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      const name = form.name.value.trim();
      if (submitBtn) submitBtn.disabled = true;

      try {
        await fetch(NOTIFY_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectPayload(form)),
        });
      } catch (err) {
        console.error('notify relay failed', err);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }

      msg.textContent = `${name}님, ${label}이 접수되었습니다. 빠르게 연락드리겠습니다.`;
      form.reset();
      form.querySelectorAll('.chip.is-active').forEach((chip) => chip.classList.remove('is-active'));
    });
  };
  setupForm('applyForm', 'applyMsg', '상담 신청', collectApplyPayload);
  setupForm('asForm', 'asMsg', 'AS 신청', collectAsPayload);
});
