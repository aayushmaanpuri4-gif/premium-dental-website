/* ==========================================================================
   Puri Dental Clinic — interactions
   Sections: config · image slots · edit mode · lightbox · treatment modals
             nav · reveal · hours · form · misc
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------- 1. Config ---------------- */
  var CLINIC = {
    phone: '9837633549',
    phoneIntl: '919837633549',
    name: 'Puri Dental Clinic',
    address: 'Saharanpur Rd, Sewla Kalan, Majra, Dehradun, Shewala Kala, Uttarakhand 248171'
  };
  var STORE_PREFIX = 'pdc.photo.';
  var MAX_EDGE = 1700;           // longest edge kept when a photo is uploaded
  var JPEG_QUALITY = 0.82;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function icon(id, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true"><use href="#' + id + '"/></svg>';
  }

  /* ---------------- 2. Image slots ----------------
     Each .ph slot resolves its photo in this order:
       1. an owner upload saved in this browser  (localStorage)
       2. a file committed to the repo           (data-src)
       3. the elegant empty-state placeholder
     Nothing is ever invented — an unfilled slot simply stays a placeholder. */
  var slots = [];

  function storeKey(slot) { return STORE_PREFIX + slot; }

  function paint(fig, src) {
    var img = $('img', fig);
    if (!img || !src) return;
    // A generation token keeps a slow reply from an earlier src (a 404 probe, say)
    // from undoing the photo that replaced it.
    var gen = fig._gen = (fig._gen || 0) + 1;
    // An uploaded photo carries no network cost, so it must not wait for lazy-loading
    // to bring the slot into view before it appears.
    if (src.indexOf('data:') === 0) img.loading = 'eager';

    var onLoad = function () {
      if (fig._gen !== gen) return;
      fig.classList.add('has-image');
      // The Upload/Replace wording depends on the slot being filled, and a data URL
      // finishes decoding after syncSlotControls has already run once.
      if (fig.dataset.slot) syncSlotControls(fig);
    };
    var onError = function () {
      if (fig._gen !== gen) return;
      // A missing repo file must never leave a broken image behind.
      fig.classList.remove('has-image');
      img.removeAttribute('src');
    };

    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
    img.src = src;
    if (img.complete && img.naturalWidth > 0) onLoad();
  }

  /* Repo-hosted photos are probed only as a slot nears the viewport, so a clinic
     that has not added its pictures yet does not fire dozens of doomed requests. */
  var probeIO = null;
  function probeWhenNear(fig, src) {
    if (!('IntersectionObserver' in window)) { paint(fig, src); return; }
    if (!probeIO) {
      probeIO = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          obs.unobserve(en.target);
          var pending = en.target._pendingSrc;
          if (pending) { delete en.target._pendingSrc; paint(en.target, pending); }
        });
      }, { rootMargin: '400px 0px' });
    }
    fig._pendingSrc = src;
    probeIO.observe(fig);
  }

  function clearSlot(fig) {
    var img = $('img', fig);
    fig.classList.remove('has-image');
    if (img) img.removeAttribute('src');
  }

  function initSlots() {
    slots = $$('.ph');
    slots.forEach(function (fig) {
      var name = fig.dataset.slot;
      var ratio = fig.dataset.ratio;
      if (ratio) fig.style.setProperty('--ar', ratio.replace(':', '/'));
      if (fig.dataset.pos) fig.style.setProperty('--pos', fig.dataset.pos);

      var img = $('img', fig);
      if (img && !img.getAttribute('alt')) img.setAttribute('alt', fig.dataset.alt || '');

      var saved = null;
      try { saved = name ? localStorage.getItem(storeKey(name)) : null; } catch (e) { saved = null; }
      if (saved) paint(fig, saved);
      else if (fig.dataset.src) {
        if (fig.hasAttribute('data-eager')) paint(fig, fig.dataset.src);
        else probeWhenNear(fig, fig.dataset.src);
      }

      if (fig.hasAttribute('data-lightbox') && !$('.ph-zoom', fig)) {
        var zoom = document.createElement('span');
        zoom.className = 'ph-zoom';
        zoom.innerHTML = icon('icon-expand');
        fig.appendChild(zoom);
      }
      if (name) buildSlotControls(fig);
    });
  }

  /* ---------------- 3. Owner edit mode ---------------- */
  function buildSlotControls(fig) {
    var wrap = document.createElement('div');
    wrap.className = 'ph-actions';

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.className = 'sr-only';
    input.id = 'file-' + fig.dataset.slot;

    var pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'ph-btn';
    pick.innerHTML = icon('icon-upload') + '<span>Upload photo</span>';
    pick.addEventListener('click', function (e) { e.stopPropagation(); input.click(); });

    var remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'ph-btn danger';
    remove.innerHTML = icon('icon-trash') + '<span>Remove</span>';
    remove.addEventListener('click', function (e) {
      e.stopPropagation();
      try { localStorage.removeItem(storeKey(fig.dataset.slot)); } catch (err) {}
      clearSlot(fig);
      if (fig.dataset.src) paint(fig, fig.dataset.src);
      syncSlotControls(fig);
      toast('Photo removed.');
    });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) { toast('Please choose an image file.', true); return; }
      pick.querySelector('span').textContent = 'Processing…';
      compress(file, function (dataUrl, err) {
        pick.querySelector('span').textContent = 'Replace photo';
        if (err) { toast('That image could not be read.', true); return; }
        try {
          localStorage.setItem(storeKey(fig.dataset.slot), dataUrl);
        } catch (e2) {
          toast('Browser storage is full — remove a photo or add images to assets/images/ instead.', true);
          return;
        }
        clearSlot(fig);
        paint(fig, dataUrl);
        syncSlotControls(fig);
        toast('Photo updated.');
      });
      input.value = '';
    });

    wrap.appendChild(input);
    wrap.appendChild(pick);
    wrap.appendChild(remove);
    fig.appendChild(wrap);
    syncSlotControls(fig);
  }

  function syncSlotControls(fig) {
    var actions = $('.ph-actions', fig);
    if (!actions) return;
    var has = fig.classList.contains('has-image');
    var pick = actions.querySelectorAll('button')[0];
    var remove = actions.querySelectorAll('button')[1];
    if (pick) pick.querySelector('span').textContent = has ? 'Replace photo' : 'Upload photo';
    var stored = false;
    try { stored = !!localStorage.getItem(storeKey(fig.dataset.slot)); } catch (e) {}
    if (remove) remove.style.display = stored ? '' : 'none';
  }

  /* Downscale + re-encode so a 6 MB phone photo does not blow the page up. */
  function compress(file, done) {
    var reader = new FileReader();
    reader.onerror = function () { done(null, true); };
    reader.onload = function () {
      var img = new Image();
      img.onerror = function () { done(null, true); };
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, MAX_EDGE / Math.max(w, h));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        var type = /png$/i.test(file.type) ? 'image/png' : 'image/jpeg';
        try {
          done(canvas.toDataURL(type, JPEG_QUALITY));
        } catch (e) {
          done(String(reader.result));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function setEditMode(on) {
    document.body.classList.toggle('edit-mode', on);
    var btn = $('#editToggle');
    if (btn) btn.setAttribute('aria-pressed', String(on));
    try { on ? sessionStorage.setItem('pdc.edit', '1') : sessionStorage.removeItem('pdc.edit'); } catch (e) {}
    if (on) slots.forEach(syncSlotControls);
  }

  function initEditMode() {
    var params = new URLSearchParams(location.search);
    var active = params.get('edit') === '1';
    try { active = active || sessionStorage.getItem('pdc.edit') === '1'; } catch (e) {}

    $$('[data-edit-toggle]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        setEditMode(!document.body.classList.contains('edit-mode'));
        if (document.body.classList.contains('edit-mode')) {
          toast('Photo mode on — upload a picture into any highlighted frame.');
        }
      });
    });

    var done = $('#editDone');
    if (done) done.addEventListener('click', function () { setEditMode(false); });

    var clearAll = $('#editClear');
    if (clearAll) clearAll.addEventListener('click', function () {
      if (!window.confirm('Remove every photo you have uploaded in this browser?')) return;
      slots.forEach(function (fig) {
        if (!fig.dataset.slot) return;
        try { localStorage.removeItem(storeKey(fig.dataset.slot)); } catch (e) {}
        clearSlot(fig);
        if (fig.dataset.src) paint(fig, fig.dataset.src);
        syncSlotControls(fig);
      });
      toast('All uploaded photos removed.');
    });

    if (active) setEditMode(true);
  }

  /* ---------------- 4. Toast ---------------- */
  var toastTimer;
  function toast(msg, isError) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 4200);
  }

  /* ---------------- 5. Lightbox ---------------- */
  var lb = {}, lbItems = [], lbIndex = 0, lbLastFocus = null;

  function collectLightboxItems() {
    return $$('.ph[data-lightbox].has-image');
  }

  function openLightbox(fig) {
    lbItems = collectLightboxItems();
    lbIndex = lbItems.indexOf(fig);
    if (lbIndex < 0) return;
    lbLastFocus = document.activeElement;
    renderLightbox();
    lb.root.classList.add('open');
    lb.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    lb.close.focus();
  }

  function renderLightbox() {
    var fig = lbItems[lbIndex];
    if (!fig) return;
    var img = $('img', fig);
    lb.img.src = img.currentSrc || img.src;
    lb.img.alt = img.alt || '';
    lb.cap.textContent = fig.dataset.alt || img.alt || '';
    lb.count.textContent = (lbIndex + 1) + ' / ' + lbItems.length;
    var many = lbItems.length > 1;
    lb.prev.hidden = !many;
    lb.next.hidden = !many;
    lb.count.hidden = !many;
  }

  function stepLightbox(dir) {
    if (!lbItems.length) return;
    lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
    lb.img.style.opacity = '0';
    renderLightbox();
    requestAnimationFrame(function () { lb.img.style.opacity = ''; });
  }

  function closeLightbox() {
    lb.root.classList.remove('open');
    lb.root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lbLastFocus) lbLastFocus.focus();
  }

  function initLightbox() {
    lb.root = $('#lightbox');
    if (!lb.root) return;
    lb.img = $('#lbImage');
    lb.cap = $('#lbCaption');
    lb.count = $('#lbCount');
    lb.close = $('.lb-close', lb.root);
    lb.prev = $('.lb-prev', lb.root);
    lb.next = $('.lb-next', lb.root);

    lb.close.addEventListener('click', closeLightbox);
    lb.prev.addEventListener('click', function () { stepLightbox(-1); });
    lb.next.addEventListener('click', function () { stepLightbox(1); });
    lb.root.addEventListener('click', function (e) { if (e.target === lb.root) closeLightbox(); });

    document.addEventListener('click', function (e) {
      var fig = e.target.closest ? e.target.closest('.ph[data-lightbox]') : null;
      if (!fig || document.body.classList.contains('edit-mode')) return;
      if (!fig.classList.contains('has-image')) return;
      if (e.target.closest('.ph-actions')) return;
      openLightbox(fig);
    });

    document.addEventListener('keydown', function (e) {
      if (!lb.root.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }

  /* ---------------- 6. Treatment modals ---------------- */
  var modalLastFocus = null;

  function openModal(id) {
    var scrim = $('#treatModal');
    var tpl = document.getElementById(id);
    if (!scrim || !tpl) return;
    modalLastFocus = document.activeElement;
    var body = $('#modalContent');
    body.innerHTML = '';
    body.appendChild(tpl.content.cloneNode(true));
    initSlotsWithin(body);
    scrim.classList.add('open');
    scrim.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    $('.modal', scrim).scrollTop = 0;
    $('.modal-close', scrim).focus();
  }

  function initSlotsWithin(root) {
    $$('.ph', root).forEach(function (fig) {
      if (slots.indexOf(fig) === -1) slots.push(fig);
      var ratio = fig.dataset.ratio;
      if (ratio) fig.style.setProperty('--ar', ratio.replace(':', '/'));
      var img = $('img', fig);
      if (img && !img.getAttribute('alt')) img.setAttribute('alt', fig.dataset.alt || '');
      var saved = null;
      try { saved = localStorage.getItem(storeKey(fig.dataset.slot)); } catch (e) {}
      paint(fig, saved || fig.dataset.src || '');
      if (fig.dataset.slot && !$('.ph-actions', fig)) buildSlotControls(fig);
    });
  }

  function closeModal() {
    var scrim = $('#treatModal');
    if (!scrim) return;
    scrim.classList.remove('open');
    scrim.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (modalLastFocus) modalLastFocus.focus();
    setTimeout(function () {
      if (!scrim.classList.contains('open')) $('#modalContent').innerHTML = '';
    }, 400);
  }

  function initModals() {
    var scrim = $('#treatModal');
    if (!scrim) return;

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest ? e.target.closest('[data-modal]') : null;
      if (trigger) { e.preventDefault(); openModal(trigger.dataset.modal); return; }
      if (e.target.closest && e.target.closest('[data-close-modal]')) { closeModal(); return; }
      if (e.target === scrim) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scrim.classList.contains('open')) closeModal();
      if (e.key !== 'Tab' || !scrim.classList.contains('open')) return;
      var focusables = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', scrim)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------------- 7. Navigation ---------------- */
  function initNav() {
    var header = $('#siteHeader');
    var toggle = $('#menuToggle');
    var drawer = $('#mobileNav');
    var scrim = $('#navScrim');

    function setDrawer(open) {
      if (!drawer) return;
      drawer.classList.toggle('open', open);
      scrim.classList.toggle('open', open);
      document.body.classList.toggle('no-scroll', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) { var f = $('a,button', drawer); if (f) f.focus(); }
    }

    if (toggle) toggle.addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
    if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
    var closeBtn = $('#mobileNavClose');
    if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
    $$('#mobileNav a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) setDrawer(false);
    });

    var onScroll = function () {
      var y = window.scrollY;
      if (header) header.classList.toggle('scrolled', y > 24);
      var top = $('#toTop');
      if (top) top.classList.toggle('show', y > 700);
      var bar = $('#mobileBar');
      if (bar) bar.classList.toggle('show', y > 420);
      var floats = $('#floatStack');
      if (floats) floats.classList.toggle('show', y > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Active link tracking
    var sections = $$('section[id]');
    var links = $$('.nav-links a[href^="#"]');
    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id;
          links.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------------- 8. Reveal on scroll ---------------- */
  function initReveal() {
    var items = $$('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Count up — only ever used on figures the clinic actually supplied. */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      nums.forEach(function (el) { el.textContent = el.dataset.count; });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.dataset.count, 10), start = null;
        (function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1100, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- 9. Opening hours status ----------------
     Mon–Sat, 10:00–13:00 and 17:00–20:00. Closed at all other times. */
  var SESSIONS = [[600, 780], [1020, 1200]]; // minutes from midnight

  function clinicStatus(now) {
    var day = now.getDay();                       // 0 = Sunday
    var mins = now.getHours() * 60 + now.getMinutes();
    if (day === 0) return { open: false, label: 'Closed today — opens Monday 10:00 AM' };
    for (var i = 0; i < SESSIONS.length; i++) {
      if (mins >= SESSIONS[i][0] && mins < SESSIONS[i][1]) {
        return { open: true, label: 'Open now — until ' + fmt(SESSIONS[i][1]) };
      }
    }
    for (var j = 0; j < SESSIONS.length; j++) {
      if (mins < SESSIONS[j][0]) return { open: false, label: 'Closed — opens at ' + fmt(SESSIONS[j][0]) };
    }
    return { open: false, label: day === 6 ? 'Closed — opens Monday 10:00 AM' : 'Closed — opens tomorrow 10:00 AM' };
  }

  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60;
    var ap = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12 === 0 ? 12 : h % 12;
    return hh + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap;
  }

  function initHours() {
    var status = clinicStatus(new Date());
    $$('[data-hours-status]').forEach(function (el) {
      el.classList.toggle('closed', !status.open);
      var txt = $('[data-hours-label]', el);
      (txt || el).textContent = status.label;
      if (!txt) el.innerHTML = '<span class="dot"></span>' + status.label;
    });
    $$('[data-hours-dot]').forEach(function (el) { el.classList.toggle('closed', !status.open); });
    $$('[data-hours-text]').forEach(function (el) { el.textContent = status.label; });
  }

  /* ---------------- 10. Appointment form ----------------
     No server is attached to this static site, so a validated submission is
     handed to the clinic's WhatsApp with every detail pre-filled, and the
     phone number stays visible as the direct alternative. */
  function initForm() {
    var form = $('#apptForm');
    if (!form) return;
    var success = $('#formSuccess');
    var alertBox = $('#formAlert');
    var submit = $('#apptSubmit');

    var dateInput = $('#f-date');
    if (dateInput) {
      var today = new Date();
      dateInput.min = today.toISOString().split('T')[0];
    }

    function fieldOf(input) { return input.closest('.field'); }

    function validate(input) {
      var field = fieldOf(input);
      if (!field) return true;
      var v = input.value.trim();
      var ok = true, msg = '';

      if (input.required && !v) {
        ok = false;
        msg = 'This field is required.';
      } else if (input.id === 'f-name' && v && v.length < 2) {
        ok = false;
        msg = 'Please enter your full name.';
      } else if (input.id === 'f-phone' && v) {
        var digits = v.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 13) {
          ok = false;
          msg = 'Please enter a valid phone number.';
        }
      } else if (input.id === 'f-date' && v) {
        var picked = new Date(v + 'T00:00:00');
        var floor = new Date(); floor.setHours(0, 0, 0, 0);
        if (picked < floor) { ok = false; msg = 'Please choose today or a later date.'; }
        else if (picked.getDay() === 0) { ok = false; msg = 'The clinic is closed on Sundays.'; }
      }

      field.classList.toggle('invalid', !ok);
      var err = $('.err-msg span', field);
      if (err && msg) err.textContent = msg;
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    }

    $$('input,select,textarea', form).forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value.trim() || input.required) validate(input); });
      input.addEventListener('input', function () {
        var field = fieldOf(input);
        if (field && field.classList.contains('invalid')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = $$('input,select,textarea', form);
      var valid = true;
      inputs.forEach(function (i) { if (!validate(i)) valid = false; });

      if (!valid) {
        alertBox.classList.add('show');
        var firstBad = $('.field.invalid input,.field.invalid select,.field.invalid textarea', form);
        if (firstBad) firstBad.focus();
        return;
      }
      alertBox.classList.remove('show');
      submit.classList.add('loading');
      submit.disabled = true;

      var name = $('#f-name').value.trim();
      var phone = $('#f-phone').value.trim();
      var date = $('#f-date').value;
      var treatment = $('#f-treatment').value;
      var message = $('#f-message').value.trim();

      var lines = [
        'Appointment request — ' + CLINIC.name,
        '',
        'Name: ' + name,
        'Phone: ' + phone,
        'Preferred date: ' + (date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'),
        'Treatment: ' + (treatment || 'Not sure yet')
      ];
      if (message) lines.push('Message: ' + message);

      var url = 'https://wa.me/' + CLINIC.phoneIntl + '?text=' + encodeURIComponent(lines.join('\n'));

      setTimeout(function () {
        submit.classList.remove('loading');
        submit.disabled = false;
        window.open(url, '_blank', 'noopener');
        $('#successName').textContent = name.split(' ')[0] || 'there';
        success.classList.add('show');
        form.reset();
        $$('.field', form).forEach(function (f) { f.classList.remove('invalid'); });
      }, 650);
    });

    var again = $('#formAgain');
    if (again) again.addEventListener('click', function () {
      success.classList.remove('show');
      $('#f-name').focus();
    });
  }

  /* ---------------- 11. Misc ---------------- */
  function initMisc() {
    var top = $('#toTop');
    if (top) top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });

    // Offset in-page jumps so the sticky header never covers a heading.
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = (document.querySelector('.site-header') || {}).offsetHeight || 70;
      var y = target.getBoundingClientRect().top + window.scrollY - offset - 14;
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });

    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    // Map: load the embed only when the visitor asks for it.
    var facade = $('#mapFacade');
    if (facade) facade.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = facade.dataset.embed;
      frame.title = 'Google Map showing the location of ' + CLINIC.name + ', Dehradun';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.allowFullscreen = true;
      facade.parentNode.appendChild(frame);
      facade.remove();
    });
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    initSlots();
    initEditMode();
    initLightbox();
    initModals();
    initNav();
    initReveal();
    initCounters();
    initHours();
    initForm();
    initMisc();
    setInterval(initHours, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
