<?php
// ============================================================
// Layout Header Component
// Disaster Relief & Resource Management System
// ============================================================
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';

// Default page title
$pageTitle = $pageTitle ?? 'Command Center';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= escape($pageTitle) ?> — Relief Hub Disaster Operations</title>
  <meta name="description" content="Centralized Disaster Relief & Resource Management System">
  <!-- Emergency Operations Vanilla CSS -->
  <link rel="stylesheet" href="assets/css/style.css">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23dc2626'><path d='M12 2L1 21h22L12 2zm0 3.5L20.5 19H3.5L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z'/></svg>">
</head>
<body>
<div class="app-container">
