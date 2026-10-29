<?php
// ============================================================
// Secure Operations Sign In
// Disaster Relief & Resource Management System
// ============================================================
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        $error = 'Please enter both email address and password.';
    } else {
        try {
            $stmt = getDB()->prepare("
                SELECT u.*, r.role_name 
                FROM users u 
                JOIN roles r ON u.role_id = r.role_id 
                WHERE LOWER(u.email) = LOWER(?)
                LIMIT 1
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                if ($user['status'] !== 'active') {
                    $error = 'Your account has been deactivated. Please contact an administrator.';
                } else {
                    // Set Session
                    $_SESSION['user_id']   = $user['user_id'];
                    $_SESSION['full_name'] = $user['full_name'];
                    $_SESSION['email']     = $user['email'];
                    $_SESSION['role_id']   = $user['role_id'];
                    $_SESSION['role_name'] = $user['role_name'];

                    setFlash('success', 'Welcome back, ' . $user['full_name'] . ' (' . $user['role_name'] . ')');
                    header('Location: dashboard.php');
                    exit;
                }
            } else {
                $error = 'Invalid email credentials or password.';
            }
        } catch (Exception $e) {
            $error = 'System connection error: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In — Relief Hub Emergency Operations</title>
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23dc2626'><path d='M12 2L1 21h22L12 2zm0 3.5L20.5 19H3.5L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z'/></svg>">
</head>
<body>
<div class="auth-wrapper">
  <div class="auth-card">
    <div class="auth-brand">
      <div class="auth-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <h2 class="auth-title">RELIEF HUB</h2>
      <p class="auth-desc">Disaster Relief & Resource Management Command</p>
    </div>

    <?php if ($error): ?>
      <div class="alert alert-error">
        <span><?= escape($error) ?></span>
      </div>
    <?php endif; ?>

    <?php if ($msg = getFlash('success')): ?>
      <div class="alert alert-success">
        <span><?= escape($msg) ?></span>
      </div>
    <?php endif; ?>

    <form method="POST" action="login.php">
      <div class="form-group">
        <label class="form-label required" for="email">Official Email</label>
        <input type="email" id="email" name="email" class="form-control" required placeholder="name@reliefhub.org" value="<?= escape($_POST['email'] ?? '') ?>" autofocus>
      </div>

      <div class="form-group">
        <label class="form-label required" for="password">Password</label>
        <input type="password" id="password" name="password" class="form-control" required placeholder="••••••••">
      </div>

      <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        <span>Authorize & Enter</span>
      </button>
    </form>

    <div class="demo-credentials-box">
      <div class="demo-credentials-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Demo Credentials (1-Click Fill)</span>
      </div>
      <div>
        <span class="demo-account-pill" data-email="admin@reliefhub.org" data-pass="Admin@123">
          <strong>Admin:</strong> admin@reliefhub.org
        </span>
        <span class="demo-account-pill" data-email="coordinator1@reliefhub.org" data-pass="Admin@123">
          <strong>Coordinator:</strong> coordinator1@reliefhub.org
        </span>
        <span class="demo-account-pill" data-email="volunteer1@reliefhub.org" data-pass="Admin@123">
          <strong>Volunteer:</strong> volunteer1@reliefhub.org
        </span>
        <span class="demo-account-pill" data-email="donor@tatafoundation.org" data-pass="Admin@123">
          <strong>Donor:</strong> donor@tatafoundation.org
        </span>
      </div>
      <div style="margin-top: 6px; color: var(--text-muted); font-size: 0.72rem;">
        Universal demo password: <code>Admin@123</code>
      </div>
    </div>
  </div>
</div>

<script src="assets/js/main.js"></script>
</body>
</html>
