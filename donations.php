<?php
// ============================================================
// Donations & Philanthropy Management
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Donations & Aid Contributions';
$pageSubtitle = 'Audit Monetary Funds, Material Inflows & Philanthropic Contributions';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $action = $_POST['form_action'] ?? '';

    if ($action === 'create_donor') {
        $donorName = trim($_POST['donor_name'] ?? '');
        $donorType = $_POST['donor_type'] ?? 'Individual';
        $email     = trim($_POST['email'] ?? '');
        $phone     = trim($_POST['phone'] ?? '');
        $address   = trim($_POST['address'] ?? '');

        if (!empty($donorName)) {
            $stmt = $pdo->prepare("
                INSERT INTO donors (donor_name, donor_type, email, phone, address)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$donorName, $donorType, $email ?: null, $phone ?: null, $address ?: null]);
            setFlash('success', "Donor '{$donorName}' registered successfully.");
        } else {
            setFlash('error', 'Donor name is required.');
        }
        header('Location: donations.php');
        exit;
    }

    if ($action === 'create_donation') {
        $donorId      = (int)($_POST['donor_id'] ?? 0);
        $disasterId   = !empty($_POST['disaster_id']) ? (int)$_POST['disaster_id'] : null;
        $donationType = $_POST['donation_type'] ?? 'Monetary';
        $amount       = !empty($_POST['amount']) ? (float)$_POST['amount'] : null;
        $resourceId   = !empty($_POST['resource_id']) ? (int)$_POST['resource_id'] : null;
        $quantity     = !empty($_POST['quantity']) ? (int)$_POST['quantity'] : null;
        $status       = $_POST['status'] ?? 'Received';
        $donationDate = !empty($_POST['donation_date']) ? $_POST['donation_date'] . ' ' . date('H:i:s') : date('Y-m-d H:i:s');

        if ($donorId > 0) {
            $stmt = $pdo->prepare("
                INSERT INTO donations (donor_id, disaster_id, resource_id, amount, quantity, donation_type, donation_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$donorId, $disasterId, $resourceId, $amount, $quantity, $donationType, $donationDate, $status]);
            setFlash('success', "Donation record successfully saved.");
        } else {
            setFlash('error', 'Valid donor must be selected.');
        }
        header('Location: donations.php');
        exit;
    }

    if ($action === 'update_status') {
        $donationId = (int)($_POST['donation_id'] ?? 0);
        $newStatus  = $_POST['status'] ?? 'Received';
        if ($donationId > 0 && in_array($newStatus, ['Pending', 'Verified', 'Received', 'Rejected'])) {
            $stmt = $pdo->prepare("UPDATE donations SET status = ? WHERE donation_id = ?");
            $stmt->execute([$newStatus, $donationId]);
            setFlash('success', "Donation #{$donationId} status updated to {$newStatus}.");
        }
        header('Location: donations.php');
        exit;
    }
}

// Stats
$totalMonetary = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donation_type = 'Monetary' AND status IN ('Verified', 'Received')")->fetchColumn();
$totalMaterialUnits = (int)$pdo->query("SELECT COALESCE(SUM(quantity), 0) FROM donations WHERE donation_type = 'Material' AND status IN ('Verified', 'Received')")->fetchColumn();
$donorCount = (int)$pdo->query("SELECT COUNT(*) FROM donors")->fetchColumn();
$pendingCount = (int)$pdo->query("SELECT COUNT(*) FROM donations WHERE status = 'Pending'")->fetchColumn();

// Dropdowns
$donorsList = $pdo->query("SELECT donor_id, donor_name, donor_type, email FROM donors ORDER BY donor_name ASC")->fetchAll();
$disastersList = $pdo->query("SELECT disaster_id, disaster_name FROM disasters ORDER BY disaster_name ASC")->fetchAll();
$resourcesList = $pdo->query("SELECT resource_id, resource_name, unit FROM resources ORDER BY resource_name ASC")->fetchAll();

$typeFilter = $_GET['donation_type'] ?? '';
$statusFilter = $_GET['status'] ?? '';

$sql = "
    SELECT dn.*, dor.donor_name, dor.donor_type, dor.phone as donor_phone, dor.email as donor_email,
           d.disaster_name, r.resource_name, r.unit
    FROM donations dn
    JOIN donors dor ON dn.donor_id = dor.donor_id
    LEFT JOIN disasters d ON dn.disaster_id = d.disaster_id
    LEFT JOIN resources r ON dn.resource_id = r.resource_id
    WHERE 1=1
";
$params = [];
if ($typeFilter) {
    $sql .= " AND dn.donation_type = ?";
    $params[] = $typeFilter;
}
if ($statusFilter) {
    $sql .= " AND dn.status = ?";
    $params[] = $statusFilter;
}
$sql .= " ORDER BY dn.donation_date DESC, dn.donation_id DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$donations = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <!-- Summary Cards -->
  <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Verified Monetary Aid</span>
        <span class="stat-value" style="color: var(--success-600);">₹<?= number_format($totalMonetary, 2) ?></span>
        <span class="stat-subtext">Received & verified funds</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Material Supplies Inflow</span>
        <span class="stat-value"><?= number_format($totalMaterialUnits) ?></span>
        <span class="stat-subtext">Relief units & items donated</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Registered Donors</span>
        <span class="stat-value"><?= $donorCount ?></span>
        <span class="stat-subtext">Foundations & citizens</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Pending Verifications</span>
        <span class="stat-value" style="color: var(--warning-600);"><?= $pendingCount ?></span>
        <span class="stat-subtext">Awaiting receipt confirmation</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <span>Donations Ledger (<?= count($donations) ?>)</span>
        </h3>

        <form method="GET" action="donations.php" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <select name="donation_type" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Contribution Types</option>
            <option value="Monetary" <?= $typeFilter === 'Monetary' ? 'selected' : '' ?>>Monetary Funds</option>
            <option value="Material" <?= $typeFilter === 'Material' ? 'selected' : '' ?>>Material Goods</option>
          </select>

          <select name="status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Statuses</option>
            <option value="Pending" <?= $statusFilter === 'Pending' ? 'selected' : '' ?>>Pending</option>
            <option value="Verified" <?= $statusFilter === 'Verified' ? 'selected' : '' ?>>Verified</option>
            <option value="Received" <?= $statusFilter === 'Received' ? 'selected' : '' ?>>Received</option>
            <option value="Rejected" <?= $statusFilter === 'Rejected' ? 'selected' : '' ?>>Rejected</option>
          </select>
          <?php if ($typeFilter || $statusFilter): ?>
            <a href="donations.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <input type="text" class="table-search" placeholder="Search donors, aid, ref..." style="width: 220px;">
        <button class="btn btn-outline btn-sm" onclick="openModal('addDonorModal')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Register Donor</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="openModal('addDonationModal')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Record Donation</span>
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Donor / Organization</th>
            <th>Type</th>
            <th>Disaster Beneficiary</th>
            <th>Contribution Details</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($donations)): ?>
            <tr>
              <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                No donation records match the selected criteria.
              </td>
            </tr>
          <?php else: ?>
            <?php foreach ($donations as $dn): 
              $badgeClass = 'badge-neutral';
              if ($dn['status'] === 'Received' || $dn['status'] === 'Verified') $badgeClass = 'badge-success';
              elseif ($dn['status'] === 'Pending') $badgeClass = 'badge-warning';
              elseif ($dn['status'] === 'Rejected') $badgeClass = 'badge-danger';
            ?>
              <tr>
                <td><strong>#DN-<?= str_pad($dn['donation_id'], 4, '0', STR_PAD_LEFT) ?></strong></td>
                <td>
                  <div style="font-weight: 600; color: var(--navy-900);"><?= htmlspecialchars($dn['donor_name']) ?></div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    <?= htmlspecialchars($dn['donor_type'] ?? 'Individual') ?>
                    <?php if (!empty($dn['donor_phone'])): ?> &bull; <?= htmlspecialchars($dn['donor_phone']) ?><?php endif; ?>
                  </div>
                </td>
                <td>
                  <?php if ($dn['donation_type'] === 'Monetary'): ?>
                    <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #047857; font-weight: 600;">Monetary</span>
                  <?php else: ?>
                    <span class="badge" style="background: rgba(30, 58, 138, 0.12); color: #1e3a8a; font-weight: 600;">Material</span>
                  <?php endif; ?>
                </td>
                <td>
                  <?= !empty($dn['disaster_name']) ? htmlspecialchars($dn['disaster_name']) : '<span style="color: var(--text-muted); font-style: italic;">General Disaster Fund</span>' ?>
                </td>
                <td>
                  <?php if ($dn['donation_type'] === 'Monetary'): ?>
                    <span style="font-size: 1rem; font-weight: 700; color: var(--success-600);">₹<?= number_format($dn['amount'] ?? 0, 2) ?></span>
                  <?php else: ?>
                    <strong><?= number_format($dn['quantity'] ?? 0) ?></strong> <?= htmlspecialchars($dn['unit'] ?? 'units') ?> of
                    <strong><?= htmlspecialchars($dn['resource_name'] ?? 'Relief Supplies') ?></strong>
                  <?php endif; ?>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">
                  <?= date('M d, Y', strtotime($dn['donation_date'])) ?>
                </td>
                <td>
                  <span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($dn['status']) ?></span>
                </td>
                <td>
                  <form method="POST" action="donations.php" style="display: inline-flex; gap: 0.35rem; align-items: center;">
                    <?= csrfField() ?>
                    <input type="hidden" name="form_action" value="update_status">
                    <input type="hidden" name="donation_id" value="<?= $dn['donation_id'] ?>">
                    <select name="status" class="form-select" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; width: auto;" onchange="this.form.submit()">
                      <option value="Pending" <?= $dn['status'] === 'Pending' ? 'selected' : '' ?>>Pending</option>
                      <option value="Verified" <?= $dn['status'] === 'Verified' ? 'selected' : '' ?>>Verified</option>
                      <option value="Received" <?= $dn['status'] === 'Received' ? 'selected' : '' ?>>Received</option>
                      <option value="Rejected" <?= $dn['status'] === 'Rejected' ? 'selected' : '' ?>>Rejected</option>
                    </select>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal: Register Donor -->
<div id="addDonorModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Register New Philanthropist / Donor</h3>
      <button class="modal-close" onclick="closeModal('addDonorModal')">&times;</button>
    </div>
    <form method="POST" action="donations.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create_donor">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Donor / Organization Name</label>
          <input type="text" name="donor_name" class="form-input" required placeholder="e.g. Tata Trusts, Reliance Foundation, Dr. John Doe">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Donor Classification</label>
            <select name="donor_type" class="form-select" required>
              <option value="Individual">Individual Citizen</option>
              <option value="Organization">Non-Governmental Org (NGO)</option>
              <option value="Corporate">Corporate / CSR Entity</option>
              <option value="Government">Government / Public Agency</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" name="phone" class="form-input" placeholder="+91 98765 43210">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" name="email" class="form-input" placeholder="contributions@domain.org">
        </div>
        <div class="form-group">
          <label class="form-label">Official Address / Headquarters</label>
          <textarea name="address" class="form-textarea" rows="2" placeholder="Street, City, Pin"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addDonorModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Donor</button>
      </div>
    </form>
  </div>
</div>

<!-- Modal: Record Donation -->
<div id="addDonationModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Record Aid Contribution</h3>
      <button class="modal-close" onclick="closeModal('addDonationModal')">&times;</button>
    </div>
    <form method="POST" action="donations.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create_donation">
      <div class="modal-body">
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Select Donor</label>
            <select name="donor_id" class="form-select" required>
              <option value="">-- Choose Registered Donor --</option>
              <?php foreach ($donorsList as $d): ?>
                <option value="<?= $d['donor_id'] ?>"><?= htmlspecialchars($d['donor_name']) ?> (<?= $d['donor_type'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Disaster (Optional)</label>
            <select name="disaster_id" class="form-select">
              <option value="">-- General Disaster Pool --</option>
              <?php foreach ($disastersList as $dis): ?>
                <option value="<?= $dis['disaster_id'] ?>"><?= htmlspecialchars($dis['disaster_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Contribution Nature</label>
            <select name="donation_type" id="donationTypeSelect" class="form-select" required onchange="toggleDonationFields(this.value)">
              <option value="Monetary">Monetary Funds (INR ₹)</option>
              <option value="Material">Material Relief Supplies</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Initial Status</label>
            <select name="status" class="form-select" required>
              <option value="Received">Received & Deposited</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending Audit</option>
            </select>
          </div>
        </div>

        <!-- Monetary Fields -->
        <div id="monetaryFields" class="form-group">
          <label class="form-label required">Contribution Amount (₹ INR)</label>
          <input type="number" step="0.01" name="amount" id="amountInput" class="form-input" placeholder="e.g. 250000.00">
        </div>

        <!-- Material Fields -->
        <div id="materialFields" class="grid grid-2" style="display: none;">
          <div class="form-group">
            <label class="form-label">Resource Item</label>
            <select name="resource_id" class="form-select">
              <option value="">-- Select Donated Resource --</option>
              <?php foreach ($resourcesList as $res): ?>
                <option value="<?= $res['resource_id'] ?>"><?= htmlspecialchars($res['resource_name']) ?> (<?= $res['unit'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input type="number" name="quantity" class="form-input" placeholder="e.g. 500">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Donation Date</label>
          <input type="date" name="donation_date" class="form-input" value="<?= date('Y-m-d') ?>">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addDonationModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Donation</button>
      </div>
    </form>
  </div>
</div>

<script>
function toggleDonationFields(type) {
  const mFields = document.getElementById('monetaryFields');
  const matFields = document.getElementById('materialFields');
  if (type === 'Monetary') {
    mFields.style.display = 'block';
    matFields.style.display = 'none';
  } else {
    mFields.style.display = 'none';
    matFields.style.display = 'grid';
  }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
