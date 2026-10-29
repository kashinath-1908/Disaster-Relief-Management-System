<?php
// ============================================================
// Resources Master Catalog
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Relief Supplies & Resources Catalog';
$pageSubtitle = 'Master Classification, Categories & Specifications for Relief Goods';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $name        = trim($_POST['resource_name'] ?? '');
        $categoryId  = (int)($_POST['category_id'] ?? 0);
        $unit        = trim($_POST['unit_of_measure'] ?? 'Units');
        $perishable  = isset($_POST['is_perishable']) ? 1 : 0;
        $description = trim($_POST['description'] ?? '');

        if ($name && $categoryId) {
            $stmt = $pdo->prepare("
                INSERT INTO resources (category_id, resource_name, unit_of_measure, is_perishable, description)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$categoryId, $name, $unit, $perishable, $description]);
            setFlash('success', "Resource '{$name}' added to catalog.");
        } else {
            setFlash('error', 'Name and category are required.');
        }
        header('Location: resources.php');
        exit;
    }

    if ($action === 'update') {
        $id          = (int)($_POST['resource_id'] ?? 0);
        $name        = trim($_POST['resource_name'] ?? '');
        $categoryId  = (int)($_POST['category_id'] ?? 0);
        $unit        = trim($_POST['unit_of_measure'] ?? 'Units');
        $perishable  = isset($_POST['is_perishable']) ? 1 : 0;
        $description = trim($_POST['description'] ?? '');

        if ($id && $name && $categoryId) {
            $stmt = $pdo->prepare("
                UPDATE resources 
                SET category_id = ?, resource_name = ?, unit_of_measure = ?, is_perishable = ?, description = ?
                WHERE resource_id = ?
            ");
            $stmt->execute([$categoryId, $name, $unit, $perishable, $description, $id]);
            setFlash('success', "Resource '{$name}' updated.");
        }
        header('Location: resources.php');
        exit;
    }

    if ($action === 'delete') {
        requireRole(['Admin']);
        $id = (int)($_POST['resource_id'] ?? 0);
        if ($id) {
            try {
                $stmt = $pdo->prepare("DELETE FROM resources WHERE resource_id = ?");
                $stmt->execute([$id]);
                setFlash('success', 'Resource removed from catalog.');
            } catch (Exception $e) {
                setFlash('error', 'Cannot delete resource: active inventory or distributions reference this item.');
            }
        }
        header('Location: resources.php');
        exit;
    }
}

$categories = $pdo->query("SELECT * FROM resource_categories ORDER BY category_name ASC")->fetchAll();

$catFilter = $_GET['category_id'] ?? '';
$sql = "
    SELECT r.*, rc.category_name,
           (SELECT COALESCE(SUM(ri.quantity_available), 0) FROM resource_inventory ri WHERE ri.resource_id = r.resource_id) as total_stock
    FROM resources r
    JOIN resource_categories rc ON r.category_id = rc.category_id
    WHERE 1=1
";
$params = [];
if ($catFilter) {
    $sql .= " AND r.category_id = ?";
    $params[] = $catFilter;
}
$sql .= " ORDER BY rc.category_name ASC, r.resource_name ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$resources = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <span>Supplies Catalog (<?= count($resources) ?> items)</span>
        </h3>

        <form method="GET" action="resources.php">
          <select name="category_id" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Categories</option>
            <?php foreach ($categories as $cat): ?>
              <option value="<?= $cat['category_id'] ?>" <?= $catFilter == $cat['category_id'] ? 'selected' : '' ?>><?= escape($cat['category_name']) ?></option>
            <?php endforeach; ?>
          </select>
        </form>
      </div>

      <div class="card-actions">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button type="button" class="btn btn-primary btn-sm" data-modal="modalAddResource">
            + New Catalog Item
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Resource Name</th>
            <th>Category</th>
            <th>Unit of Measure</th>
            <th>Perishable?</th>
            <th>Total Available in Centers</th>
            <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
              <th style="text-align: right;">Actions</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($resources)): ?>
            <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No catalog items match filter.</td></tr>
          <?php else: ?>
            <?php foreach ($resources as $res): ?>
              <tr>
                <td class="table-cell-bold">
                  <div><?= escape($res['resource_name']) ?></div>
                  <?php if (!empty($res['description'])): ?>
                    <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($res['description']) ?></div>
                  <?php endif; ?>
                </td>
                <td>
                  <span class="badge badge-info"><?= escape($res['category_name']) ?></span>
                </td>
                <td><?= escape($res['unit_of_measure']) ?></td>
                <td>
                  <?php if ($res['is_perishable']): ?>
                    <span class="badge badge-warning">Perishable</span>
                  <?php else: ?>
                    <span class="badge badge-neutral">Non-perishable</span>
                  <?php endif; ?>
                </td>
                <td>
                  <strong style="color: <?= $res['total_stock'] > 0 ? 'var(--success-700)' : 'var(--emergency-600)' ?>;">
                    <?= number_format($res['total_stock']) ?> <?= escape($res['unit_of_measure']) ?>
                  </strong>
                </td>
                <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                  <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn btn-sm btn-outline"
                            onclick='openEditResource(<?= json_encode($res, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'>
                      Edit
                    </button>
                    <?php if (hasRole('Admin')): ?>
                      <form method="POST" action="resources.php" style="display: inline;" onsubmit="return confirmDelete('Delete resource item?');">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="delete">
                        <input type="hidden" name="resource_id" value="<?= $res['resource_id'] ?>">
                        <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                      </form>
                    <?php endif; ?>
                  </td>
                <?php endif; ?>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── MODAL: ADD RESOURCE ──────────────────────────────────── -->
  <div class="modal-overlay" id="modalAddResource">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Add Resource Catalog Item</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="resources.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Resource Name</label>
            <input type="text" name="resource_name" class="form-control" required placeholder="e.g. Purified Drinking Water (1L)">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Category</label>
              <select name="category_id" class="form-select" required>
                <option value="">Select Category...</option>
                <?php foreach ($categories as $cat): ?>
                  <option value="<?= $cat['category_id'] ?>"><?= escape($cat['category_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Unit of Measure</label>
              <input type="text" name="unit_of_measure" class="form-control" required placeholder="e.g. Bottles, Boxes, Kits, Kg">
            </div>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
            <input type="checkbox" name="is_perishable" id="is_perishable" value="1" style="width: 18px; height: 18px;">
            <label for="is_perishable" style="font-size: 0.88rem; cursor: pointer;">This supply item is perishable (Requires temperature/shelf-life control)</label>
          </div>

          <div class="form-group">
            <label class="form-label">Description & Handling Instructions</label>
            <textarea name="description" class="form-control" placeholder="Specifications, pack details, storage rules..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Add Item</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ── MODAL: EDIT RESOURCE ──────────────────────────────────── -->
  <div class="modal-overlay" id="modalEditResource">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Edit Resource Catalog Item</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="resources.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="update">
        <input type="hidden" name="resource_id" id="edit_resource_id">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Resource Name</label>
            <input type="text" name="resource_name" id="edit_resource_name" class="form-control" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Category</label>
              <select name="category_id" id="edit_category_id" class="form-select" required>
                <?php foreach ($categories as $cat): ?>
                  <option value="<?= $cat['category_id'] ?>"><?= escape($cat['category_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Unit of Measure</label>
              <input type="text" name="unit_of_measure" id="edit_unit_of_measure" class="form-control" required>
            </div>
          </div>

          <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
            <input type="checkbox" name="is_perishable" id="edit_is_perishable" value="1" style="width: 18px; height: 18px;">
            <label for="edit_is_perishable" style="font-size: 0.88rem; cursor: pointer;">Perishable Supply</label>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea name="description" id="edit_description" class="form-control"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Update Item</button>
        </div>
      </form>
    </div>
  </div>

<script>
function openEditResource(data) {
  document.getElementById('edit_resource_id').value = data.resource_id;
  document.getElementById('edit_resource_name').value = data.resource_name;
  document.getElementById('edit_category_id').value = data.category_id;
  document.getElementById('edit_unit_of_measure').value = data.unit_of_measure;
  document.getElementById('edit_is_perishable').checked = (data.is_perishable == 1);
  document.getElementById('edit_description').value = data.description || '';
  openModal('modalEditResource');
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
