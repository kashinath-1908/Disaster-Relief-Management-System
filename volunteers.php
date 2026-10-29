<?php
// ============================================================
// Volunteers Management & Deployment
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Volunteers & Deployments';
$pageSubtitle = 'Volunteer Verification, Skills Directory & Mission Assignments';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    requireRole(['Admin', 'Disaster Coordinator']);

    $action = $_POST['form_action'] ?? '';

    if ($action === 'verify') {
        $volId  = (int)($_POST['volunteer_id'] ?? 0);
        $status = $_POST['verification_status'] ?? 'Verified';
        if ($volId && in_array($status, ['Verified', 'Rejected', 'Pending'])) {
            $stmt = $pdo->prepare("UPDATE volunteers SET verification_status = ? WHERE volunteer_id = ?");
            $stmt->execute([$status, $volId]);
            setFlash('success', "Volunteer verification status set to '{$status}'.");
        }
        header('Location: volunteers.php');
        exit;
    }

    if ($action === 'assign') {
        $volId       = (int)($_POST['volunteer_id'] ?? 0);
        $disasterId  = (int)($_POST['disaster_id'] ?? 0);
        $taskId      = !empty($_POST['task_id']) ? (int)$_POST['task_id'] : null;

        if ($volId && $disasterId) {
            $stmt = $pdo->prepare("
                INSERT INTO volunteer_assignments (volunteer_id, disaster_id, task_id, status)
                VALUES (?, ?, ?, 'Assigned')
            ");
            $stmt->execute([$volId, $disasterId, $taskId]);

            // Update volunteer status
            $pdo->prepare("UPDATE volunteers SET availability = 'Assigned' WHERE volunteer_id = ?")->execute([$volId]);

            setFlash('success', 'Volunteer successfully assigned to disaster operation.');
        } else {
            setFlash('error', 'Volunteer and disaster are required.');
        }
        header('Location: volunteers.php');
        exit;
    }
}

$disasters = $pdo->query("SELECT disaster_id, disaster_name FROM disasters WHERE status = 'Active' ORDER BY disaster_name ASC")->fetchAll();
$tasks = $pdo->query("SELECT task_id, task_name FROM relief_tasks WHERE status != 'Completed' ORDER BY task_name ASC")->fetchAll();

// Fetch Volunteers with user details
$volunteers = $pdo->query("
    SELECT v.*, u.full_name, u.email, u.phone, u.address,
           (SELECT COUNT(*) FROM volunteer_assignments va WHERE va.volunteer_id = v.volunteer_id) as total_missions,
           (SELECT d.disaster_name FROM volunteer_assignments va JOIN disasters d ON va.disaster_id = d.disaster_id WHERE va.volunteer_id = v.volunteer_id AND va.status IN ('Assigned', 'Active') ORDER BY va.assignment_id DESC LIMIT 1) as current_disaster,
           (SELECT rt.task_name FROM volunteer_assignments va LEFT JOIN relief_tasks rt ON va.task_id = rt.task_id WHERE va.volunteer_id = v.volunteer_id AND va.status IN ('Assigned', 'Active') ORDER BY va.assignment_id DESC LIMIT 1) as current_task
    FROM volunteers v
    JOIN users u ON v.user_id = u.user_id
    ORDER BY FIELD(v.verification_status, 'Pending', 'Verified', 'Rejected'), u.full_name ASC
")->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span>Registered Volunteers Corps (<?= count($volunteers) ?>)</span>
      </h3>

      <div class="card-actions">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button type="button" class="btn btn-primary btn-sm" data-modal="modalDeployVolunteer">
            + Deploy Volunteer on Mission
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Volunteer Name</th>
            <th>Specialized Skills</th>
            <th>Availability</th>
            <th>Verification</th>
            <th>Active Deployment</th>
            <th>Contact Phone</th>
            <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
              <th style="text-align: right;">Action</th>
            <?php endif; ?>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($volunteers)): ?>
            <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No volunteers registered yet.</td></tr>
          <?php else: ?>
            <?php foreach ($volunteers as $v): ?>
              <?php
                $verClass = 'badge-neutral';
                if ($v['verification_status'] === 'Verified') $verClass = 'badge-success';
                elseif ($v['verification_status'] === 'Rejected') $verClass = 'badge-critical';
                elseif ($v['verification_status'] === 'Pending') $verClass = 'badge-warning';

                $availClass = 'badge-neutral';
                if ($v['availability'] === 'Available') $availClass = 'badge-success';
                elseif ($v['availability'] === 'Assigned') $availClass = 'badge-info';
                elseif ($v['availability'] === 'Unavailable') $availClass = 'badge-critical';
              ?>
              <tr>
                <td class="table-cell-bold">
                  <div><?= escape($v['full_name']) ?></div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($v['email']) ?></div>
                </td>
                <td>
                  <span style="font-size: 0.85rem; font-weight: 500; color: var(--primary-800);">
                    <?= escape($v['skills'] ?: 'General Logistics Support') ?>
                  </span>
                </td>
                <td>
                  <span class="badge <?= $availClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($v['availability']) ?>
                  </span>
                </td>
                <td>
                  <span class="badge <?= $verClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($v['verification_status']) ?>
                  </span>
                </td>
                <td>
                  <?php if ($v['current_disaster']): ?>
                    <div><strong><?= escape($v['current_disaster']) ?></strong></div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);"><?= escape($v['current_task'] ?: 'Active mission') ?></div>
                  <?php else: ?>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Standby (<?= $v['total_missions'] ?> past missions)</span>
                  <?php endif; ?>
                </td>
                <td><?= escape($v['phone'] ?: 'N/A') ?></td>
                <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
                  <td style="text-align: right; white-space: nowrap;">
                    <?php if ($v['verification_status'] === 'Pending'): ?>
                      <form method="POST" action="volunteers.php" style="display: inline;">
                        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                        <input type="hidden" name="form_action" value="verify">
                        <input type="hidden" name="volunteer_id" value="<?= $v['volunteer_id'] ?>">
                        <button type="submit" name="verification_status" value="Verified" class="btn btn-sm btn-success">Verify</button>
                        <button type="submit" name="verification_status" value="Rejected" class="btn btn-sm btn-danger">Reject</button>
                      </form>
                    <?php else: ?>
                      <button type="button" class="btn btn-sm btn-outline" 
                              onclick='openDeployModal(<?= $v['volunteer_id'] ?>, "<?= escape($v['full_name']) ?>")'>
                        Deploy
                      </button>
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

  <!-- ── MODAL: DEPLOY VOLUNTEER ──────────────────────────────── -->
  <div class="modal-overlay" id="modalDeployVolunteer">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Deploy Volunteer to Relief Operation</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="volunteers.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="assign">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Volunteer Member</label>
            <select name="volunteer_id" id="deploy_volunteer_id" class="form-select" required>
              <option value="">Select Volunteer...</option>
              <?php foreach ($volunteers as $v): ?>
                <option value="<?= $v['volunteer_id'] ?>"><?= escape($v['full_name']) ?> (Skills: <?= escape($v['skills']) ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Active Disaster Operation</label>
            <select name="disaster_id" class="form-select" required>
              <option value="">Select Disaster...</option>
              <?php foreach ($disasters as $dis): ?>
                <option value="<?= $dis['disaster_id'] ?>"><?= escape($dis['disaster_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Linked Relief Task (Optional)</label>
            <select name="task_id" class="form-select">
              <option value="">General Support / No Specific Task</option>
              <?php foreach ($tasks as $t): ?>
                <option value="<?= $t['task_id'] ?>"><?= escape($t['task_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Deploy Volunteer</button>
        </div>
      </form>
    </div>
  </div>

<script>
function openDeployModal(volId, name) {
  const sel = document.getElementById('deploy_volunteer_id');
  if (sel) sel.value = volId;
  openModal('modalDeployVolunteer');
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
