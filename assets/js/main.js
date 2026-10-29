// ============================================================
// Disaster Relief & Resource Management System
// Vanilla JavaScript Client Interactions (No Frameworks)
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  // ── Mobile Sidebar Toggle ──────────────────────────────────
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const sidebar = document.getElementById('sidebar');

  if (menuToggleBtn && sidebar) {
    menuToggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuToggleBtn) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ── Modal Handlers ─────────────────────────────────────────
  // Open modal buttons: data-modal="modalId"
  document.querySelectorAll('[data-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      const modalId = this.getAttribute('data-modal');
      openModal(modalId);
    });
  });

  // Close modal buttons: data-close-modal
  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Click outside modal container to close
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });

  // ── Client-side Quick Table Search ─────────────────────────
  const quickSearch = document.getElementById('tableQuickSearch');
  if (quickSearch) {
    quickSearch.addEventListener('input', function () {
      const query = this.value.toLowerCase().trim();
      const table = document.querySelector('.data-table tbody');
      if (!table) return;

      const rows = table.querySelectorAll('tr');
      rows.forEach(function (row) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // ── Demo Credential Pill Clickers ──────────────────────────
  document.querySelectorAll('.demo-account-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      const email = this.getAttribute('data-email');
      const pass = this.getAttribute('data-pass') || 'Admin@123';
      const emailInput = document.getElementById('email');
      const passInput = document.getElementById('password');
      if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = pass;
      }
    });
  });

  // ── Auto-dismiss Flash Alerts ──────────────────────────────
  document.querySelectorAll('.alert').forEach(function (alert) {
    setTimeout(function () {
      alert.style.transition = 'opacity 0.4s ease';
      alert.style.opacity = '0';
      setTimeout(function () {
        alert.remove();
      }, 400);
    }, 5000);
  });
});

// Global Modal Control Functions
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    // autofocus first input inside modal
    const firstInput = el.querySelector('input:not([type=hidden]), select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// Confirm Delete Dialog
function confirmDelete(message, formId) {
  if (confirm(message || 'Are you sure you want to delete this record? This action cannot be undone.')) {
    if (formId) {
      document.getElementById(formId).submit();
    }
    return true;
  }
  return false;
}
