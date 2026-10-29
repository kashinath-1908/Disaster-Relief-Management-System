<?php
// ============================================================
// System User Management (Admin Only)
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Authorized Users & Access Control';
$pageSubtitle = 'Role-Based Permissions, Personnel Directory & System Security';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireRole('Admin');

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $action = $_POST['form_action'] ?? '';

    if ($action === 'create') {
        $name     = trim($_POST['full_name'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $phone    = trim($_POST['phone'] ?? '');
        $password = $_POST['password'] ?? 'Admin@123';
        $roleId   = (int)($_POST['role_id'] ?? 3);
        $status   = $_POST['status'] ?? 'active';
        $address  = trim($_POST['address'] ?? '');

        if ($name && $email && $password && $roleId) {
            // Check unique email
            $chk = $pdo->prepare("SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)");
            $chk->execute([$email]);
            if ($chk->fetch()) {
                setFlash('error', "User with email '{$email}' already exists.");
            } else {
                $hash = password_hash($password, PASSWORD_BCRYPT);
                $stmt = $pdo->prepare("
                    INSERT INTO users (role_id, full_name, email, phone, password, address, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$roleId, $name, strtolower($email), $phone, $hash, $address, $status]);
                setFlash('success', "User '{$name}' created successfully.");
            }
        } else {
            setFlash('error', 'Name, email, and password are required.');
        }
        header('Location: users.php');
        exit;
    }

    if ($action === 'update') {
        $id     = (int)($_POST['user_id'] ?? 0);
        $name   = trim($_POST['full_name'] ?? '');
        $roleId = (int)($_POST['role_id'] ?? 0);
        $status = $_POST['status'] ?? 'active';
        $phone  = trim($_POST['phone'] ?? '');

        if ($id && $name && $roleId) {
            $stmt = $pdo->prepare("
                UPDATE users 
                SET full_name = ?, role_id = ?, status = ?, phone = ?
                WHERE user_id = ?
            ");
            $stmt->execute([$name, $roleId, $status, $phone, $id]);

            // Optional password reset
            if (!empty($_POST['new_password'])) {
                $hash = password_hash($_POST['new_password'], PASSWORD_BCRYPT);
                $pdo->prepare("UPDATE users SET password = ? WHERE user_id = ?")->execute([$hash, $id]);
            }

            setFlash('success', "User '{$name}' updated.");
        }
        header('Location: users.php');
        exit;
    }

    if ($action === 'delete') {
        $id = (int)($_POST['user_id'] ?? 0);
        if ($id && $id !== $_SESSION['user_id']) {
            try {
                $pdo->prepare("DELETE FROM users WHERE user_id = ?")->execute([$id]);
                setFlash('success', 'User removed from system.');
            } catch (Exception $e) {
                setFlash('error', 'Cannot delete user: user has associated logs or operational assignments.');
            }
        } else {
            setFlash('error', 'Cannot delete your own active session.');
        }
        header('Location: users.php');
        exit;
    }
}

$roles = $pdo->query("SELECT * FROM roles ORDER BY role_id ASC")->fetchAll();
$users = $pdo->query("
    SELECT u.*, r.role_name
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    ORDER BY u.role_id ASC, u.full_name ASC
")->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        <span>Authorized System Accounts (<?= count($users) ?>)</span>
      </h3>

      <div class="card-actions">
        <button type="button" class="btn btn-primary btn-sm" data-modal="modalAddUser">
          + Add New User
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Full Legal Name</th>
            <th>Email Address</th>
            <th>Role Authorization</th>
            <th>Account Status</th>
            <th>Phone</th>
            <th>Registration Date</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($users as $u): ?>
            <?php
              $rBadge = 'badge-neutral';
              if ($u['role_name'] === 'Admin') $rBadge = 'badge-critical';
              elseif ($u['role_name'] === 'Disaster Coordinator') $rBadge = 'badge-info';
              elseif ($u['role_name'] === 'Volunteer') $rBadge = 'badge-success';
              elseif ($u['role_name'] === 'Donor') $rBadge = 'badge-warning';

              $stBadge = $u['status'] === 'active' ? 'badge-success' : 'badge-critical';
            ?>
            <tr>
              <td class="table-cell-bold"><?= escape($u['full_name']) ?></td>
              <td><?= escape($u['email']) ?></td>
              <td>
                <span class="badge <?= $rBadge ?>">
                  <span class="badge-dot"></span>
                  <?= escape($u['role_name']) ?>
                </span>
              </td>
              <td>
                <span class="badge <?= $stBadge ?>"><?= ucfirst(escape($u['status'])) ?></span>
              </td>
              <td><?= escape($u['phone'] ?: 'N/A') ?></td>
              <td style="font-size: 0.78rem;"><?= formatDate($u['created_at']) ?></td>
              <td style="text-align: right; white-space: nowrap;">
                <button type="button" class="btn btn-sm btn-outline"
                        onclick='openEditUser(<?= json_encode($u, JSON_HEX_APOS | JSON_HEX_QUOT) ?>)'>
                  Edit
                </button>
                <?php if ($u['user_id'] !== $_SESSION['user_id']): ?>
                  <form method="POST" action="users.php" style="display: inline;" onsubmit="return confirmDelete('Delete this user account?');">
                    <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
                    <input type="hidden" name="form_action" value="delete">
                    <input type="hidden" name="user_id" value="<?= $u['user_id'] ?>">
                    <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                  </form>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── MODAL: ADD USER ──────────────────────────────────────── -->
  <div class="modal-overlay" id="modalAddUser">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Create System User</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="users.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="create">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Full Legal Name</label>
            <input type="text" name="full_name" class="form-control" required placeholder="e.g. Vikramaditya Rao">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Official Email</label>
              <input type="email" name="email" class="form-control" required placeholder="name@reliefhub.org">
            </div>
            <div class="form-group">
              <label class="form-label required">Password</label>
              <input type="password" name="password" class="form-control" required value="Admin@123">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">System Role</label>
              <select name="role_id" class="form-select" required>
                <?php foreach ($roles as $r): ?>
                  <option value="<?= $r['role_id'] ?>" <?= $r['role_name'] === 'Volunteer' ? 'selected' : '' ?>><?= escape($r['role_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Account Status</label>
              <select name="status" class="form-select" required>
                <option value="active" selected>Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="text" name="phone" class="form-control" placeholder="+91-9876543210">
          </div>

          <div class="form-group">
            <label class="form-label">Official Address</label>
            <input type="text" name="address" class="form-control" placeholder="Office location or headquarters...">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Create User</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ── MODAL: EDIT USER ──────────────────────────────────────── -->
  <div class="modal-overlay" id="modalEditUser">
    <div class="modal-container">
      <div class="modal-header">
        <h4 class="modal-title">Edit User Account & Role</h4>
        <button type="button" class="modal-close-btn" data-close-modal>&times;</button>
      </div>
      <form method="POST" action="users.php">
        <input type="hidden" name="csrf_token" value="<?= csrfToken() ?>">
        <input type="hidden" name="form_action" value="update">
        <input type="hidden" name="user_id" id="edit_user_id">

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label required">Full Name</label>
            <input type="text" name="full_name" id="edit_full_name" class="form-control" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Role</label>
              <select name="role_id" id="edit_role_id" class="form-select" required>
                <?php foreach ($roles as $r): ?>
                  <option value="<?= $r['role_id'] ?>"><?= escape($r['role_name']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Status</label>
              <select name="status" id="edit_status" class="form-select" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="text" name="phone" id="edit_phone" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Reset Password (leave blank to keep current)</label>
            <input type="password" name="new_password" class="form-control" placeholder="New password...">
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-close-modal>Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

<script>
function openEditUser(data) {
  document.getElementById('edit_user_id').value = data.user_id;
  document.getElementById('edit_full_name').value = data.full_name;
  document.getElementById('edit_role_id').value = data.role_id;
  document.getElementById('edit_status').value = data.status;
  document.getElementById('edit_phone').value = data.phone || '';
  openModal('modalEditUser');
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
