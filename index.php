<?php
// ============================================================
// Application Entrypoint
// Disaster Relief & Resource Management System
// ============================================================
require_once __DIR__ . '/config/auth.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
} else {
    header('Location: login.php');
}
exit;
