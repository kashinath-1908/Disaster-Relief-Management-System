<?php
// ============================================================
// Operations Command Dashboard
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Operations Command Dashboard';
$pageSubtitle = 'Real-time Emergency Monitoring, Resource Allocation & Incident Control';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

// ── 1. REAL-TIME STATS FROM DATABASE ──────────────────────────
// Active Disasters
$activeDisasters = (int)$pdo->query("SELECT COUNT(*) FROM disasters WHERE status = 'Active'")->fetchColumn();
$totalDisasters = (int)$pdo->query("SELECT COUNT(*) FROM disasters")->fetchColumn();

// Affected People
$affectedPeopleCount = (int)$pdo->query("SELECT COUNT(*) FROM affected_people")->fetchColumn();
$criticalInjuries = (int)$pdo->query("SELECT COUNT(*) FROM affected_people WHERE injury_status IN ('Critical', 'Severe')")->fetchColumn();

// Relief Centers & Capacity
$stmt = $pdo->query("SELECT COUNT(*) as centers, COALESCE(SUM(current_occupancy),0) as occupants, COALESCE(SUM(capacity),0) as total_cap FROM relief_centers WHERE status != 'Closed'");
$centerStats = $stmt->fetch();
$activeCenters = (int)$centerStats['centers'];
$occupancyRate = $centerStats['total_cap'] > 0 ? round(($centerStats['occupants'] / $centerStats['total_cap']) * 100) : 0;

// Resources Stock Summary
$totalInventoryQty = (int)$pdo->query("SELECT COALESCE(SUM(quantity_available), 0) FROM resource_inventory")->fetchColumn();
$lowStockCount = (int)$pdo->query("
    SELECT COUNT(*) 
    FROM resource_inventory ri 
    JOIN resources r ON ri.resource_id = r.resource_id 
    WHERE ri.quantity_available <= r.minimum_stock
")->fetchColumn();

// Pending Aid Requests
$pendingRequests = (int)$pdo->query("SELECT COUNT(*) FROM resource_requests WHERE status = 'Pending'")->fetchColumn();
$urgentRequests = (int)$pdo->query("SELECT COUNT(*) FROM resource_requests WHERE priority IN ('Critical', 'High') AND status = 'Pending'")->fetchColumn();

// Volunteers Active
$activeVolunteers = (int)$pdo->query("SELECT COUNT(*) FROM volunteers WHERE verification_status = 'Verified' AND availability = 'Available'")->fetchColumn();

// Rescue Operations Active
$activeRescues = (int)$pdo->query("SELECT COUNT(*) FROM rescue_operations WHERE status = 'Active'")->fetchColumn();
$totalRescued = (int)$pdo->query("SELECT COALESCE(SUM(people_rescued), 0) FROM rescue_operations")->fetchColumn();

// Donations Total (Monetary)
$monetaryTotal = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donation_type = 'Monetary' AND status = 'Received'")->fetchColumn();

// ── 2. ACTIVE DISASTERS LIST ──────────────────────────────────
$disastersQuery = "
    SELECT d.*, dt.type_name,
           (SELECT GROUP_CONCAT(DISTINCT CONCAT(l.city, ', ', l.state) SEPARATOR '; ') 
            FROM affected_areas aa 
            JOIN locations l ON aa.location_id = l.location_id 
            WHERE aa.disaster_id = d.disaster_id) as locations_list
    FROM disasters d
    LEFT JOIN disaster_types dt ON d.disaster_type_id = dt.disaster_type_id
    WHERE d.status = 'Active'
    ORDER BY FIELD(d.severity, 'Critical', 'High', 'Medium', 'Low'), d.start_date DESC
    LIMIT 5
";
$activeDisasterList = $pdo->query($disastersQuery)->fetchAll();

// ── 3. CRITICAL INVENTORY ALERTS ──────────────────────────────
$inventoryAlertsQuery = "
    SELECT ri.*, r.resource_name, r.unit, r.minimum_stock, l.location_name, l.city, l.state
    FROM resource_inventory ri
    JOIN resources r ON ri.resource_id = r.resource_id
    JOIN locations l ON ri.location_id = l.location_id
    WHERE ri.quantity_available <= r.minimum_stock
    ORDER BY ri.quantity_available ASC
    LIMIT 5
";
$lowStockList = $pdo->query($inventoryAlertsQuery)->fetchAll();

// ── 4. URGENT RESOURCE REQUESTS ───────────────────────────────
$requestsQuery = "
    SELECT rr.*, r.resource_name, r.unit, d.disaster_name, u.full_name as requester_name
    FROM resource_requests rr
    JOIN resources r ON rr.resource_id = r.resource_id
    JOIN disasters d ON rr.disaster_id = d.disaster_id
    LEFT JOIN users u ON rr.requester_id = u.user_id
    WHERE rr.status = 'Pending'
    ORDER BY FIELD(rr.priority, 'Critical', 'High', 'Medium', 'Low'), rr.request_date DESC
    LIMIT 5
";
$pendingRequestsList = $pdo->query($requestsQuery)->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <!-- ── 8 KEY METRIC STATS CARDS ─────────────────────────────── -->
  <div class="stats-grid">
    <!-- Active Disasters -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Active Disasters</span>
        <span class="stat-value" style="color: var(--emergency-600);"><?= $activeDisasters ?></span>
        <span class="stat-subtext"><?= $totalDisasters ?> cumulative incidents</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
    </div>

    <!-- Affected People -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Affected People</span>
        <span class="stat-value"><?= number_format($affectedPeopleCount) ?></span>
        <span class="stat-subtext"><?= $criticalInjuries ?> severe / critical cases</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
    </div>

    <!-- Active Relief Centers -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Relief Centers</span>
        <span class="stat-value"><?= $activeCenters ?></span>
        <span class="stat-subtext"><?= $centerStats['occupants'] ?> / <?= $centerStats['total_cap'] ?> beds (<?= $occupancyRate ?>%)</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
    </div>

    <!-- Available Stock Items -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Inventory Stock</span>
        <span class="stat-value"><?= number_format($totalInventoryQty) ?></span>
        <span class="stat-subtext"><?= $lowStockCount ?> low/depleted items</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>
      </div>
    </div>

    <!-- Pending Requests -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Pending Requests</span>
        <span class="stat-value"><?= $pendingRequests ?></span>
        <span class="stat-subtext"><?= $urgentRequests ?> critical priority</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
    </div>

    <!-- Active Volunteers -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Available Volunteers</span>
        <span class="stat-value"><?= $activeVolunteers ?></span>
        <span class="stat-subtext">Mobilized on standby</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
    </div>

    <!-- Rescue Operations -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Active Rescues</span>
        <span class="stat-value"><?= $activeRescues ?></span>
        <span class="stat-subtext"><?= $totalRescued ?> citizens evacuated</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
      </div>
    </div>

    <!-- Monetary Donations -->
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Donations Received</span>
        <span class="stat-value" style="color: var(--success-700);">₹<?= number_format($monetaryTotal) ?></span>
        <span class="stat-subtext">Monetary relief funds</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
    </div>
  </div>

  <!-- ── QUICK ACTION TOOLBAR ─────────────────────────────────── -->
  <div class="card" style="margin-bottom: 1.5rem;">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>Rapid Incident Action Hub</span>
      </h3>
      <div class="card-actions">
        <?php if (hasRole(['Admin', 'Disaster Coordinator'])): ?>
          <a href="disasters.php?action=new" class="btn btn-sm btn-emergency">+ Declare Disaster</a>
          <a href="affected_people.php?action=new" class="btn btn-sm btn-primary">+ Register Affected Person</a>
          <a href="resource_requests.php?action=new" class="btn btn-sm btn-outline">+ Request Supplies</a>
        <?php endif; ?>
        <a href="donations.php?action=new" class="btn btn-sm btn-success">+ Record Donation</a>
      </div>
    </div>
  </div>

  <!-- ── 2-COLUMN OPERATIONAL SUMMARY ─────────────────────────── -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 1.5rem;">
    <!-- Active Disasters Incident Board -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emergency-600)" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Active Disasters Requiring Response</span>
        </h3>
        <a href="disasters.php" class="btn btn-sm btn-outline">View All (<?= $totalDisasters ?>)</a>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Disaster</th>
              <th>Type</th>
              <th>Affected Area</th>
              <th>Severity</th>
              <th>Declared</th>
            </tr>
          </thead>
          <tbody>
            <?php if (empty($activeDisasterList)): ?>
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No active disasters currently logged.</td></tr>
            <?php else: ?>
              <?php foreach ($activeDisasterList as $d): ?>
                <?php
                  $sevClass = 'badge-low';
                  if ($d['severity'] === 'Critical') $sevClass = 'badge-critical';
                  elseif ($d['severity'] === 'High') $sevClass = 'badge-high';
                  elseif ($d['severity'] === 'Medium') $sevClass = 'badge-medium';
                ?>
                <tr>
                  <td class="table-cell-bold">
                    <a href="disasters.php"><?= escape($d['disaster_name']) ?></a>
                  </td>
                  <td><?= escape($d['type_name']) ?></td>
                  <td><?= escape($d['locations_list'] ?: 'Region-wide') ?></td>
                  <td>
                    <span class="badge <?= $sevClass ?>">
                      <span class="badge-dot"></span>
                      <?= escape($d['severity']) ?>
                    </span>
                  </td>
                  <td><?= formatDate($d['start_date']) ?></td>
                </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Critical Inventory Stock Alert -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning-600)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Critical Stock Depletion Alert</span>
        </h3>
        <a href="inventory.php" class="btn btn-sm btn-outline">Full Inventory</a>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Depot Location</th>
              <th>Available</th>
              <th>Min Threshold</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <?php if (empty($lowStockList)): ?>
              <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">All centers report sufficient stock levels.</td></tr>
            <?php else: ?>
              <?php foreach ($lowStockList as $inv): ?>
                <?php
                  $stockClass = $inv['quantity_available'] == 0 ? 'badge-out-of-stock' : 'badge-low-stock';
                  $stockLabel = $inv['quantity_available'] == 0 ? 'Out of Stock' : 'Low Stock';
                ?>
                <tr>
                  <td class="table-cell-bold"><?= escape($inv['resource_name']) ?></td>
                  <td><?= escape($inv['location_name'] ?: ($inv['city'] . ', ' . $inv['state'])) ?></td>
                  <td style="color: var(--emergency-600); font-weight: 700;">
                    <?= number_format($inv['quantity_available']) ?> <?= escape($inv['unit']) ?>
                  </td>
                  <td><?= number_format($inv['minimum_stock']) ?> <?= escape($inv['unit']) ?></td>
                  <td>
                    <span class="badge <?= $stockClass ?>">
                      <span class="badge-dot"></span>
                      <?= $stockLabel ?>
                    </span>
                  </td>
                </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ── RECENT PENDING AID REQUESTS ──────────────────────────── -->
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>Pending Resource Requests Awaiting Authorization</span>
      </h3>
      <a href="resource_requests.php" class="btn btn-sm btn-outline">Review All Requests</a>
    </div>
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Req ID</th>
            <th>Disaster Operation</th>
            <th>Requested By</th>
            <th>Resource Needed</th>
            <th>Quantity</th>
            <th>Priority</th>
            <th>Requested Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php if (empty($pendingRequestsList)): ?>
            <tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No pending aid requests awaiting approval.</td></tr>
          <?php else: ?>
            <?php foreach ($pendingRequestsList as $req): ?>
              <?php
                $priClass = 'badge-low';
                if ($req['priority'] === 'Critical') $priClass = 'badge-critical';
                elseif ($req['priority'] === 'High') $priClass = 'badge-high';
                elseif ($req['priority'] === 'Medium') $priClass = 'badge-medium';
              ?>
              <tr>
                <td>#REQ-<?= $req['request_id'] ?></td>
                <td class="table-cell-bold"><?= escape($req['disaster_name']) ?></td>
                <td><?= escape($req['requester_name'] ?? 'Relief Staff') ?></td>
                <td><?= escape($req['resource_name']) ?></td>
                <td><strong><?= number_format($req['quantity_requested']) ?></strong> <?= escape($req['unit']) ?></td>
                <td>
                  <span class="badge <?= $priClass ?>">
                    <span class="badge-dot"></span>
                    <?= escape($req['priority']) ?>
                  </span>
                </td>
                <td><?= formatDate($req['request_date']) ?></td>
                <td>
                  <a href="resource_requests.php" class="btn btn-sm btn-outline">Review</a>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
