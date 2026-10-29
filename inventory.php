<?php
// ============================================================
// Center Resource Inventory Management
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Center Resource Inventory';
$pageSubtitle = 'Real-time Stock Levels, Depletion Alerts & Center Logistics';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create_or_adjust') {
        $locationId = (int)($_POST['location_id'] ?? 0);
        $resourceId = (int)($_POST['resource_id'] ?? 0);
        $qty        = (int)($_POST['quantity_available'] ?? 0);

        if ($locationId && $resourceId && $qty >= 0) {
            $check = $pdo->prepare("SELECT inventory_id FROM resource_inventory WHERE location_id = ? AND resource_id = ?");
            $check->execute([$locationId, $resourceId]);
            $existing = $check->fetchColumn();

            if ($existing) {
                $stmt = $pdo->prepare("
                    UPDATE resource_inventory 
                    SET quantity_available = ?, last_updated = CURRENT_TIMESTAMP
                    WHERE inventory_id = ?
                ");
                $stmt->execute([$qty, $existing]);
                setFlash('success', 'Stock level updated successfully.');
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO resource_inventory (location_id, resource_id, quantity_available)
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$locationId, $resourceId, $qty]);
                setFlash('success', 'Resource inventory entry added for location.');
            }
        } else {
            setFlash('error', 'Location, resource, and valid quantity are required.');
        }
        header('Location: inventory.php');
        exit;
    }

    if ($action === 'quick_adjust') {
        $invId = (int)($_POST['inventory_id'] ?? 0);
        $delta = (int)($_POST['delta'] ?? 0);
        if ($invId && $delta !== 0) {
            $pdo->prepare("
                UPDATE resource_inventory 
                SET quantity_available = GREATEST(0, quantity_available + ?), last_updated = CURRENT_TIMESTAMP
                WHERE inventory_id = ?
            ")->execute([$delta, $invId]);
            setFlash('success', 'Stock quantity adjusted.');
        }
        header('Location: inventory.php');
        exit;
    }
}

// Location filter & Status filter
$locFilter = $_GET['location_id'] ?? '';
$stockFilter = $_GET['stock_status'] ?? '';

$locations = $pdo->query("SELECT location_id, location_name, city, state FROM locations ORDER BY city ASC")->fetchAll();
$allResources = $pdo->query("SELECT resource_id, resource_name, unit, minimum_stock FROM resources ORDER BY resource_name ASC")->fetchAll();

$sql = "
    SELECT ri.*, r.resource_name, r.unit, r.minimum_stock, rc.category_name, l.location_name, l.city, l.state
    FROM resource_inventory ri
    JOIN resources r ON ri.resource_id = r.resource_id
    JOIN resource_categories rc ON r.category_id = rc.category_id
    JOIN locations l ON ri.location_id = l.location_id
    WHERE 1=1
";
$params = [];
if ($locFilter) {
    $sql .= " AND ri.location_id = ?";
    $params[] = $locFilter;
}
if ($stockFilter === 'out') {
    $sql .= " AND ri.quantity_available = 0";
} elseif ($stockFilter === 'low') {
    $sql .= " AND ri.quantity_available > 0 AND ri.quantity_available <= r.minimum_stock";
} elseif ($stockFilter === 'available') {
    $sql .= " AND ri.quantity_available > r.minimum_stock";
}

$sql .= " ORDER BY (ri.quantity_available <= r.minimum_stock) DESC, ri.quantity_available ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$inventory = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <span>Inventory Records (<?= count($inventory) ?>)</span>
        </h3>

        <form method="GET" action="inventory.php" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <select name="location_id" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Locations / Warehouses</option>
            <?php foreach ($locations as $l): ?>
              <option value="<?= $l['location_id'] ?>" <?= $locFilter == $l['location_id'] ? 'selected' : '' ?>>
                <?= escape($l['location_name'] ?: ($l['city'] . ', ' . $l['state'])) ?>
              </option>
            <?php endforeach; ?>
          </select>

          <select name="stock_status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Stock Levels</option>
            <option value="out" <?= $stockFilter === 'out' ? 'selected' : '' ?>>Out of Stock</option>
            <option value="low" <?= $stockFilter === 'low' ? 'selected' : '' ?>>Low Stock (Alert)</option>
            <option value="available" <?= $stockFilter === 'available' ? 'selected' : '' ?>>Sufficient Available</option>
          </select>
          <?php if ($locFilter || $stockFilter): ?>
            <a href="inventory.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div class="card-actions">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button type="button" class="btn btn-primary btn-sm" data-modal="modalAddStock">
            + Adjust / Add Stock
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Resource & Category</th>
            <th>Storage Location Hub</th>
            <th>Available Quantity</th>
            <th>Min Threshold</th>
            <th>Stock Status</th>
            <th>Last Updated</th>
            <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
              <th style="text-align: right;">Quick Adjust</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($inventory)): ?>
            <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No inventory records found for selected filters.</td></tr>
          <?php else: ?>
            <?php foreach ($inventory as $item): ?>
              <?php
                $status = 'Available';
                $badgeClass = 'badge-available';
                if ($item['quantity_available'] == 0) {
                    $status = 'Out of Stock';
                    $badgeClass = 'badge-out-of-stock';
                } elseif ($item['quantity_available'] <= $item['minimum_stock']) {
                    $status = 'Low Stock';
                    $badgeClass = 'badge-low-stock';
                }
              ?>
              <tr>
                <td class="table-cell-bold">
                  <div><?= escape($item['resource_name']) ?></div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($item['category_name']) ?></div>
                </td>
                <td>
                  <div><strong><?= escape($item['location_name'] ?: $item['city']) ?></strong></div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($item['city']) ?>, <?= escape($item['state']) ?></div>
                </td>
                <td>
                  <span style="font-size: 1.05rem; font-weight: 700; color: <?= $item['quantity_available'] <= $item['minimum_stock'] ? 'var(--emergency-600)' : 'var(--text-main)' ?>;">
                    <?= number_format($item['quantity_available']) ?>
                  </span>
                  <span style="font-size: 0.75rem; color: var(--text-muted);"><?= escape($item['unit']) ?></span>
                </td>
                <td>
                  <?= number_format($item['minimum_stock']) ?> <?= escape($item['unit']) ?>
                </td>
                <td>
                  <span class="badge <?= $badgeClass ?>">
                    <span class="badge-dot"></span>
                    <?= $status ?>
                  </span>
                </td>
                <td style="font-size: 0.78rem;"><?= formatDateTime($item['last_updated']) ?></td>
                <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                  <td style="text-align: right; white-space: nowrap;">
                    <!-- Quick Increment/Decrement Form -->
                    <form method="POST" action="inventory.php" style="display: inline-flex; gap: 3px; align-items: center;">
                      <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                      <input type="hidden" name="form_action" value="quick_adjust">
                      <input type="hidden" name="inventory_id" value="<?= $item['inventory_id'] ?>">
                      
                      <button type="submit" name="delta" value="-10" class="btn btn-sm btn-outline" title="Subtract 10">-10</button>
                      <button type="submit" name="delta" value="10" class="btn btn-sm btn-outline" title="Add 10">+10</button>
                      <button type="submit" name="delta" value="50" class="btn btn-sm btn-outline" title="Add 50">+50</button>
                    </form>
                  </td>
                <?php endif; ?>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── MODAL: ADD / UPDATE STOCK ────────────────────────────── -->
  <div class="modal-overlay" id="modalAddStock">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Inventory Stock Intake & Adjust</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="inventory.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create_or_adjust">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Warehouse / Location Hub</label>
            <select name="location_id" class="form-select" required>
              <option value="">Select Location...</option>
              <?php foreach ($locations as $l): ?>
                <option value="<?= $l['location_id'] ?>"><?= escape($l['location_name'] ?: ($l['city'] . ', ' . $l['state'])) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Relief Resource Item</label>
            <select name="resource_id" class="form-select" required>
              <option value="">Select Catalog Resource...</option>
              <?php foreach ($allResources as $r): ?>
                <option value="<?= $r['resource_id'] ?>"><?= escape($r['resource_name']) ?> (<?= escape($r['unit']) ?> - Min: <?= $r['minimum_stock'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Total Quantity Available</label>
            <input type="number" name="quantity_available" class="form-control" required min="0" placeholder="e.g. 500">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Inventory</button>
        </div>
      </form>
    </div>
  </div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
