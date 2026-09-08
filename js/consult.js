document.addEventListener('DOMContentLoaded', () => {
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

  /* Form submit (client-side mock, no backend) */
  const setupForm = (formId, msgId, label) => {
    const form = document.getElementById(formId);
    const msg = document.getElementById(msgId);
    if (!form || !msg) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const name = form.name.value.trim();
      msg.textContent = `${name}님, ${label}이 접수되었습니다. 빠르게 연락드리겠습니다.`;
      form.reset();
      form.querySelectorAll('.chip.is-active').forEach((chip) => chip.classList.remove('is-active'));
    });
  };
  setupForm('applyForm', 'applyMsg', '상담 신청');
  setupForm('asForm', 'asMsg', 'AS 신청');
});
