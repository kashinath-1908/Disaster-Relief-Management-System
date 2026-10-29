<?php
// ============================================================
// Relief Operational Tasks
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Relief Operational Tasks';
$pageSubtitle = 'Field Action Items, Task Delegations & Priority Checklists';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        requireRole(['Admin', 'Disaster Coordinator']);
        $disasterId  = (int)($_POST['disaster_id'] ?? 0);
        $operationId = !empty($_POST['operation_id']) ? (int)$_POST['operation_id'] : null;
        $assignedTo  = !empty($_POST['assigned_to']) ? (int)$_POST['assigned_to'] : null;
        $taskName    = trim($_POST['task_name'] ?? '');
        $desc        = trim($_POST['description'] ?? '');
        $priority    = $_POST['priority'] ?? 'Medium';
        $status      = $assignedTo ? 'Assigned' : 'Pending';
        $deadline    = !empty($_POST['deadline']) ? $_POST['deadline'] : null;

        if ($disasterId && $taskName) {
            $stmt = $pdo->prepare("
                INSERT INTO relief_tasks (disaster_id, operation_id, task_name, description, priority, assigned_to, status, deadline)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$disasterId, $operationId, $taskName, $desc, $priority, $assignedTo, $status, $deadline]);
            setFlash('success', "Relief task '{$taskName}' scheduled.");
        } else {
            setFlash('error', 'Disaster and task name are required.');
        }
        header('Location: relief_tasks.php');
        exit;
    }

    if ($action === 'quick_status') {
        $taskId    = (int)($_POST['task_id'] ?? 0);
        $newStatus = $_POST['new_status'] ?? 'In Progress';
        if ($taskId && in_array($newStatus, ['Pending', 'Assigned', 'In Progress', 'Completed'])) {
            $stmt = $pdo->prepare("UPDATE relief_tasks SET status = ? WHERE task_id = ?");
            $stmt->execute([$newStatus, $taskId]);
            setFlash('success', "Task status updated to '{$newStatus}'.");
        }
        header('Location: relief_tasks.php');
        exit;
    }
}

// Summary Metrics
$totalTasks     = (int)$pdo->query("SELECT COUNT(*) FROM relief_tasks")->fetchColumn();
$inProgressTasks = (int)$pdo->query("SELECT COUNT(*) FROM relief_tasks WHERE status = 'In Progress'")->fetchColumn();
$completedTasks = (int)$pdo->query("SELECT COUNT(*) FROM relief_tasks WHERE status = 'Completed'")->fetchColumn();
$criticalTasks  = (int)$pdo->query("SELECT COUNT(*) FROM relief_tasks WHERE priority IN ('High', 'Critical') AND status != 'Completed'")->fetchColumn();

// Dropdowns
$disasters = $pdo->query("SELECT disaster_id, disaster_name FROM disasters ORDER BY status = 'Active' DESC, disaster_name ASC")->fetchAll();
$operations = $pdo->query("SELECT operation_id, operation_name FROM rescue_operations ORDER BY operation_name ASC")->fetchAll();
$users = $pdo->query("SELECT u.user_id, u.full_name, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.status = 'active' ORDER BY u.full_name ASC")->fetchAll();

$statusFilter = $_GET['status'] ?? '';
$priorityFilter = $_GET['priority'] ?? '';

$sql = "
    SELECT t.*, d.disaster_name, ro.operation_name, u.full_name as assignee_name
    FROM relief_tasks t
    JOIN disasters d ON t.disaster_id = d.disaster_id
    LEFT JOIN rescue_operations ro ON t.operation_id = ro.operation_id
    LEFT JOIN users u ON t.assigned_to = u.user_id
    WHERE 1=1
";
$params = [];
if ($statusFilter) {
    $sql .= " AND t.status = ?";
    $params[] = $statusFilter;
}
if ($priorityFilter) {
    $sql .= " AND t.priority = ?";
    $params[] = $priorityFilter;
}
$sql .= " ORDER BY FIELD(t.priority, 'Critical', 'High', 'Medium', 'Low'), t.deadline ASC, t.task_id DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$tasks = $stmt->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <!-- Summary KPI Cards -->
  <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Total Tasks</span>
        <span class="stat-value"><?= $totalTasks ?></span>
        <span class="stat-subtext">Action items registered</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">In Progress</span>
        <span class="stat-value" style="color: var(--primary-600);"><?= $inProgressTasks ?></span>
        <span class="stat-subtext">Currently executing</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Critical / High Urgency</span>
        <span class="stat-value" style="color: var(--emergency-600);"><?= $criticalTasks ?></span>
        <span class="stat-subtext">Requires immediate intervention</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Completed Tasks</span>
        <span class="stat-value" style="color: var(--success-600);"><?= $completedTasks ?></span>
        <span class="stat-subtext">Successfully concluded</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <h3 class="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span>Relief Tasks Ledger (<?= count($tasks) ?>)</span>
        </h3>

        <form method="GET" action="relief_tasks.php" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <select name="status" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Statuses</option>
            <option value="Pending" <?= $statusFilter === 'Pending' ? 'selected' : '' ?>>Pending</option>
            <option value="Assigned" <?= $statusFilter === 'Assigned' ? 'selected' : '' ?>>Assigned</option>
            <option value="In Progress" <?= $statusFilter === 'In Progress' ? 'selected' : '' ?>>In Progress</option>
            <option value="Completed" <?= $statusFilter === 'Completed' ? 'selected' : '' ?>>Completed</option>
          </select>

          <select name="priority" class="form-select" style="width: auto; padding: 0.35rem 0.65rem; font-size: 0.8rem;" onchange="this.form.submit()">
            <option value="">All Priorities</option>
            <option value="Critical" <?= $priorityFilter === 'Critical' ? 'selected' : '' ?>>Critical</option>
            <option value="High" <?= $priorityFilter === 'High' ? 'selected' : '' ?>>High</option>
            <option value="Medium" <?= $priorityFilter === 'Medium' ? 'selected' : '' ?>>Medium</option>
            <option value="Low" <?= $priorityFilter === 'Low' ? 'selected' : '' ?>>Low</option>
          </select>
          <?php if ($statusFilter || $priorityFilter): ?>
            <a href="relief_tasks.php" class="btn btn-sm btn-outline">Clear</a>
          <?php endif; ?>
        </form>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="text" class="table-search" placeholder="Search tasks, agents..." style="width: 220px;">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <button class="btn btn-primary btn-sm" onclick="openModal('addTaskModal')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Assign New Task</span>
          </button>
        <?php endif; ?>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Task Description</th>
            <th>Disaster & Mission</th>
            <th>Priority</th>
            <th>Assigned Responder</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($tasks)): ?>
            <tr>
              <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                No relief action items found.
              </td>
            </tr>
          <?php else: ?>
            <?php foreach ($tasks as $t): 
              $prioClass = 'badge-neutral';
              if ($t['priority'] === 'Critical') $prioClass = 'badge-danger';
              elseif ($t['priority'] === 'High') $prioClass = 'badge-warning';
              elseif ($t['priority'] === 'Medium') $prioClass = 'badge-info';

              $statusClass = 'badge-neutral';
              if ($t['status'] === 'Completed') $statusClass = 'badge-success';
              elseif ($t['status'] === 'In Progress') $statusClass = 'badge-info';
              elseif ($t['status'] === 'Assigned') $statusClass = 'badge-warning';
            ?>
              <tr>
                <td>
                  <div style="font-weight: 600; color: var(--navy-900);"><?= htmlspecialchars($t['task_name']) ?></div>
                  <?php if (!empty($t['description'])): ?>
                    <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      <?= htmlspecialchars($t['description']) ?>
                    </div>
                  <?php endif; ?>
                </td>
                <td>
                  <div style="font-weight: 600; color: var(--navy-800);"><?= htmlspecialchars($t['disaster_name']) ?></div>
                  <?php if (!empty($t['operation_name'])): ?>
                    <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($t['operation_name']) ?></div>
                  <?php endif; ?>
                </td>
                <td>
                  <span class="badge <?= $prioClass ?>"><?= htmlspecialchars($t['priority']) ?></span>
                </td>
                <td>
                  <?= !empty($t['assignee_name']) ? htmlspecialchars($t['assignee_name']) : '<span style="color: var(--text-muted); font-style: italic;">Unassigned Queue</span>' ?>
                </td>
                <td style="font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap;">
                  <?= !empty($t['deadline']) ? date('M d, Y H:i', strtotime($t['deadline'])) : 'Open Ended' ?>
                </td>
                <td>
                  <span class="badge <?= $statusClass ?>"><?= htmlspecialchars($t['status']) ?></span>
                </td>
                <td>
                  <form method="POST" action="relief_tasks.php" style="display: inline-flex; gap: 0.35rem; align-items: center;">
                    <?= csrfField() ?>
                    <input type="hidden" name="form_action" value="quick_status">
                    <input type="hidden" name="task_id" value="<?= $t['task_id'] ?>">
                    <select name="new_status" class="form-select" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; width: auto;" onchange="this.form.submit()">
                      <option value="Pending" <?= $t['status'] === 'Pending' ? 'selected' : '' ?>>Pending</option>
                      <option value="Assigned" <?= $t['status'] === 'Assigned' ? 'selected' : '' ?>>Assigned</option>
                      <option value="In Progress" <?= $t['status'] === 'In Progress' ? 'selected' : '' ?>>In Progress</option>
                      <option value="Completed" <?= $t['status'] === 'Completed' ? 'selected' : '' ?>>Completed</option>
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

<!-- Modal: Assign New Task -->
<div id="addTaskModal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title">Schedule New Relief Action Task</h3>
      <button class="modal-close" onclick="closeModal('addTaskModal')">&times;</button>
    </div>
    <form method="POST" action="relief_tasks.php">
      <?= csrfField() ?>
      <input type="hidden" name="form_action" value="create">
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label required">Task Title / Directive</label>
          <input type="text" name="task_name" class="form-input" required placeholder="e.g. Set up emergency triage tents, Dispatch water purifying kits">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Disaster Context</label>
            <select name="disaster_id" class="form-select" required>
              <option value="">-- Select Disaster --</option>
              <?php foreach ($disasters as $dis): ?>
                <option value="<?= $dis['disaster_id'] ?>"><?= htmlspecialchars($dis['disaster_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Related Mission (Optional)</label>
            <select name="operation_id" class="form-select">
              <option value="">-- Standalone Task --</option>
              <?php foreach ($operations as $op): ?>
                <option value="<?= $op['operation_id'] ?>"><?= htmlspecialchars($op['operation_name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label required">Operational Priority</label>
            <select name="priority" class="form-select" required>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Assignee Responder</label>
            <select name="assigned_to" class="form-select">
              <option value="">-- Unassigned / General Pool --</option>
              <?php foreach ($users as $u): ?>
                <option value="<?= $u['user_id'] ?>"><?= htmlspecialchars($u['full_name']) ?> (<?= $u['role_name'] ?>)</option>
              <?php endforeach; ?>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Target Completion Deadline</label>
          <input type="datetime-local" name="deadline" class="form-input" value="<?= date('Y-m-d\TH:i', strtotime('+24 hours')) ?>">
        </div>
        <div class="form-group">
          <label class="form-label">Task Instructions & Directives</label>
          <textarea name="description" class="form-textarea" rows="3" placeholder="Specify tactical guidelines, contact numbers, and delivery target locations..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline" onclick="closeModal('addTaskModal')">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Task</button>
      </div>
    </form>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
