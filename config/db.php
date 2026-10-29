<?php
// ============================================================
// Database Connection Configuration (PDO MySQL)
// Disaster Relief & Resource Management System
// ============================================================

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'dbms_project');
define('DB_USER', 'root');
define('DB_PASS', '');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("Database Connection Error: " . htmlspecialchars($e->getMessage()));
        }
    }
    return $pdo;
}

// Global DB instance
$pdo = getDB();

// Helper functions for output escaping and formatting
function escape($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

function formatDate($dateStr, $format = 'M d, Y') {
    if (!$dateStr) return '-';
    $t = strtotime($dateStr);
    return $t ? date($format, $t) : '-';
}

function formatDateTime($dateStr, $format = 'M d, Y h:i A') {
    if (!$dateStr) return '-';
    $t = strtotime($dateStr);
    return $t ? date($format, $t) : '-';
}
