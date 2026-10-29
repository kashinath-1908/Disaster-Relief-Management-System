<?php
// ============================================================
// Geographic Locations Directory
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Jurisdiction Locations Directory';
$pageSubtitle = 'Geographical Points, Pincodes & Disaster Operational Zones';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $locName  = trim($_POST['location_name'] ?? '');
        $state    = trim($_POST['state'] ?? '');
        $city     = trim($_POST['city'] ?? '');
        $address  = trim($_POST['address'] ?? '');
        $pincode  = trim($_POST['pincode'] ?? '');
        $lat      = !empty($_POST['latitude']) ? (float)$_POST['latitude'] : null;
        $lng      = !empty($_POST['longitude']) ? (float)$_POST['longitude'] : null;

        if ($locName && $city && $state) {
            $stmt = $pdo->prepare("
                INSERT INTO locations (location_name, address, city, state, pincode, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$locName, $address, $city, $state, $pincode, $lat, $lng]);
            setFlash('success', "Location '{$locName}' added.");
        } else {
            setFlash('error', 'Location name, city, and state are required.');
        }
        header('Location: locations.php');
        exit;
    }

    if ($action === 'delete') {
        $id = (int)($_POST['location_id'] ?? 0);
        if ($id) {
            try {
                $pdo->prepare("DELETE FROM locations WHERE location_id = ?")->execute([$id]);
                setFlash('success', 'Location deleted.');
            } catch (Exception $e) {
                setFlash('error', 'Cannot delete location: linked to active operations or centers.');
            }
        }
        header('Location: locations.php');
        exit;
    }
}

$locations = $pdo->query("
    SELECT l.*,
           (SELECT COUNT(*) FROM relief_centers rc WHERE rc.location_id = l.location_id) as linked_centers
    FROM locations l
    ORDER BY l.state ASC, l.city ASC
")->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>Jurisdiction Locations (<?= count($locations) ?>)</span>
      </h3>

      <div class="card-actions">
        <?php if (hasRole('Admin')): ?>
          <button type="button" class="btn btn-primary btn-sm" data-modal="modalAddLoc">
            + Add Location
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Location Zone Name</th>
            <th>City / Town</th>
            <th>State</th>
            <th>Postal Code</th>
            <th>GPS Coordinates</th>
            <th>Relief Centers</th>
            <?php if (hasRole('Admin')): ?>
              <th style="text-align: right;">Action</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($locations as $l): ?>
            <tr>
              <td class="table-cell-bold">
                <div><?= escape($l['location_name']) ?></div>
                <?php if ($l['address']): ?>
                  <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($l['address']) ?></div>
                <?php endif; ?>
              </td>
              <td><?= escape($l['city']) ?></td>
              <td><?= escape($l['state']) ?></td>
              <td><code><?= escape($l['pincode'] ?: 'N/A') ?></code></td>
              <td style="font-size: 0.8rem; color: var(--text-muted);">
                <?= $l['latitude'] && $l['longitude'] ? "{$l['latitude']}, {$l['longitude']}" : 'Not pinned' ?>
              </td>
              <td>
                <span class="badge badge-neutral">🏥 <?= $l['linked_centers'] ?> centers</span>
              </td>
              <?php if (hasRole('Admin')): ?>
                <td style="text-align: right;">
                  <form method="POST" action="locations.php" style="display: inline;" onsubmit="return confirmDelete('Delete location?');">
                    <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                    <input type="hidden" name="form_action" value="delete">
                    <input type="hidden" name="location_id" value="<?= $l['location_id'] ?>">
                    <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                  </form>
                </td>
              <?php endif; ?>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── MODAL: ADD LOCATION ──────────────────────────────────── -->
  <div class="modal-overlay" id="modalAddLoc">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Register Jurisdiction Location</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="locations.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Zone / Location Name</label>
            <input type="text" name="location_name" class="form-control" required placeholder="e.g. Kolhapur Central Relief Zone">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">City / Town</label>
              <input type="text" name="city" class="form-control" required placeholder="e.g. Kolhapur">
            </div>
            <div class="form-group">
              <label class="form-label required">State</label>
              <input type="text" name="state" class="form-control" required placeholder="e.g. Maharashtra">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Full Address</label>
            <input type="text" name="address" class="form-control" placeholder="Street or regional boundary description...">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">PIN Code</label>
              <input type="text" name="pincode" class="form-control" placeholder="e.g. 416001">
            </div>
            <div class="form-group">
              <label class="form-label">Latitude</label>
              <input type="number" step="0.0001" name="latitude" class="form-control" placeholder="16.7050">
            </div>
            <div class="form-group">
              <label class="form-label">Longitude</label>
              <input type="number" step="0.0001" name="longitude" class="form-control" placeholder="74.2433">
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Location</button>
        </div>
      </form>
    </div>
  </div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
