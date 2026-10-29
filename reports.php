<?php
// ============================================================
// Operational Analytics & Reports
// Disaster Relief & Resource Management System
// ============================================================
$pageTitle = 'Operational Analytics & Reports';
$pageSubtitle = 'Comprehensive Relational Aggregate Metrics, Audits & Official Briefings';

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/auth.php';
requireLogin();

$pdo = getDB();

// ── AGGREGATE SUMMARY ─────────────────────────────────────────
$totalDisasters     = (int)$pdo->query("SELECT COUNT(*) FROM disasters")->fetchColumn();
$activeDisasters    = (int)$pdo->query("SELECT COUNT(*) FROM disasters WHERE status = 'Active'")->fetchColumn();
$totalAffected       = (int)$pdo->query("SELECT COUNT(*) FROM affected_people")->fetchColumn();
$totalRescued        = (int)$pdo->query("SELECT COALESCE(SUM(people_rescued), 0) FROM rescue_operations")->fetchColumn();
$totalDistributions  = (int)$pdo->query("SELECT COALESCE(SUM(quantity_distributed), 0) FROM resource_distribution")->fetchColumn();
$monetaryTotal       = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM donations WHERE donation_type = 'Monetary' AND status IN ('Verified', 'Received')")->fetchColumn();

// ── REPORT 1: DISASTER IMPACT & RELIEF BREAKDOWN ──────────────
$disasterBreakdown = $pdo->query("
    SELECT d.disaster_id, d.disaster_name, dt.type_name, d.severity, d.status, d.start_date,
           (SELECT COUNT(*) FROM affected_people ap WHERE ap.disaster_id = d.disaster_id) as total_affected,
           (SELECT COUNT(*) FROM affected_people ap WHERE ap.disaster_id = d.disaster_id AND ap.injury_status = 'Critical') as critical_injuries,
           (SELECT COALESCE(SUM(people_rescued), 0) FROM rescue_operations ro WHERE ro.disaster_id = d.disaster_id) as people_rescued,
           (SELECT COUNT(*) FROM relief_tasks rt WHERE rt.disaster_id = d.disaster_id) as task_count
    FROM disasters d
    LEFT JOIN disaster_types dt ON d.disaster_type_id = dt.disaster_type_id
    ORDER BY d.start_date DESC
")->fetchAll();

// ── REPORT 2: CENTER LOGISTICS & INVENTORY SUMMARY ─────────────
$centerLogistics = $pdo->query("
    SELECT rc.center_id, rc.center_name, rc.capacity, rc.current_occupancy, rc.status,
           l.location_name, l.city, l.state
    FROM relief_centers rc
    JOIN locations l ON rc.location_id = l.location_id
    ORDER BY rc.center_name ASC
")->fetchAll();

// ── REPORT 3: DONATION AUDIT SUMMARY ──────────────────────────
$donorAudit = $pdo->query("
    SELECT dor.donor_id, dor.donor_name, dor.donor_type, dor.phone,
           COUNT(dn.donation_id) as total_donations_count,
           COALESCE(SUM(CASE WHEN dn.donation_type = 'Monetary' AND dn.status IN ('Verified', 'Received') THEN dn.amount ELSE 0 END), 0) as monetary_sum,
           COALESCE(SUM(CASE WHEN dn.donation_type = 'Material' AND dn.status IN ('Verified', 'Received') THEN dn.quantity ELSE 0 END), 0) as material_sum
    FROM donors dor
    LEFT JOIN donations dn ON dor.donor_id = dn.donor_id
    GROUP BY dor.donor_id, dor.donor_name, dor.donor_type, dor.phone
    ORDER BY monetary_sum DESC, total_donations_count DESC
")->fetchAll();

// ── REPORT 4: CRITICAL STOCK ALERT AUDIT ───────────────────────
$stockAlerts = $pdo->query("
    SELECT r.resource_name, r.unit, r.minimum_stock,
           l.location_name, l.city,
           ri.quantity_available
    FROM resource_inventory ri
    JOIN resources r ON ri.resource_id = r.resource_id
    JOIN locations l ON ri.location_id = l.location_id
    WHERE ri.quantity_available <= r.minimum_stock
    ORDER BY ri.quantity_available ASC
")->fetchAll();

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
?>

<div class="main-wrapper">
  <?php require_once __DIR__ . '/includes/topbar.php'; ?>

  <!-- Report Header Action -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
    <div>
      <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--navy-950);">Comprehensive Operations Audit Report</h2>
      <p style="font-size: 0.8rem; color: var(--text-muted);">Live relational aggregation snapshot as of <?= date('F d, Y \a\t h:i A') ?></p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <button type="button" class="btn btn-outline" onclick="window.print()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <span>Print Audit Dossier</span>
      </button>
    </div>
  </div>

  <!-- Key Aggregate Metrics -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Disasters Managed</span>
        <span class="stat-value"><?= $totalDisasters ?></span>
        <span class="stat-subtext"><?= $activeDisasters ?> active emergencies</span>
      </div>
      <div class="stat-icon red">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Impacted Citizens</span>
        <span class="stat-value"><?= number_format($totalAffected) ?></span>
        <span class="stat-subtext">Registered in relief rolls</span>
      </div>
      <div class="stat-icon orange">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Extricated / Rescued</span>
        <span class="stat-value" style="color: var(--success-600);"><?= number_format($totalRescued) ?></span>
        <span class="stat-subtext">Confirmed lives rescued</span>
      </div>
      <div class="stat-icon green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-content">
        <span class="stat-title">Aid Dispersed</span>
        <span class="stat-value"><?= number_format($totalDistributions) ?></span>
        <span class="stat-subtext">Supply units distributed</span>
      </div>
      <div class="stat-icon blue">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>
      </div>
    </div>
  </div>

  <!-- REPORT 1: Disaster Impact & Casualties Table -->
  <div class="card" style="margin-bottom: 2rem;">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/></svg>
        <span>1. Disaster Incident Analytics & Mission Performance</span>
      </h3>
    </div>
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Disaster Incident</th>
            <th>Type</th>
            <th>Severity</th>
            <th>Start Date</th>
            <th>Affected</th>
            <th>Critical Injuries</th>
            <th>People Rescued</th>
            <th>Tasks Logged</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($disasterBreakdown as $db): 
            $sevBadge = 'badge-neutral';
            if ($db['severity'] === 'Critical') $sevBadge = 'badge-danger';
            elseif ($db['severity'] === 'High') $sevBadge = 'badge-warning';
            elseif ($db['severity'] === 'Medium') $sevBadge = 'badge-info';
          ?>
            <tr>
              <td><strong><?= htmlspecialchars($db['disaster_name']) ?></strong></td>
              <td><?= htmlspecialchars($db['type_name'] ?? 'Disaster') ?></td>
              <td><span class="badge <?= $sevBadge ?>"><?= htmlspecialchars($db['severity']) ?></span></td>
              <td><?= date('M d, Y', strtotime($db['start_date'])) ?></td>
              <td><strong><?= number_format($db['total_affected']) ?></strong></td>
              <td>
                <span style="color: <?= $db['critical_injuries'] > 0 ? 'var(--emergency-600)' : 'var(--text-muted)' ?>; font-weight: <?= $db['critical_injuries'] > 0 ? '700' : '400' ?>;">
                  <?= number_format($db['critical_injuries']) ?>
                </span>
              </td>
              <td><strong style="color: var(--success-600);"><?= number_format($db['people_rescued']) ?></strong></td>
              <td><?= (int)$db['task_count'] ?> tasks</td>
              <td>
                <span class="badge <?= $db['status'] === 'Active' ? 'badge-danger' : 'badge-success' ?>">
                  <?= htmlspecialchars($db['status']) ?>
                </span>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- REPORT 2: Relief Center Logistics & Capacity -->
  <div class="card" style="margin-bottom: 2rem;">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span>2. Relief Shelter Centers & Capacity Utilization</span>
      </h3>
    </div>
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Relief Center</th>
            <th>Location</th>
            <th>Total Capacity</th>
            <th>Occupancy</th>
            <th>Free Space</th>
            <th>Utilization Rate</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($centerLogistics as $cl): 
            $pct = $cl['capacity'] > 0 ? round(($cl['current_occupancy'] / $cl['capacity']) * 100) : 0;
            $free = max(0, $cl['capacity'] - $cl['current_occupancy']);
          ?>
            <tr>
              <td><strong><?= htmlspecialchars($cl['center_name']) ?></strong></td>
              <td><?= htmlspecialchars($cl['location_name']) ?> (<?= htmlspecialchars($cl['city']) ?>)</td>
              <td><?= number_format($cl['capacity']) ?> beds</td>
              <td><strong><?= number_format($cl['current_occupancy']) ?></strong> accommodated</td>
              <td><span style="color: var(--success-600); font-weight: 600;"><?= number_format($free) ?> free</span></td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div style="flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; min-width: 60px;">
                    <div style="width: <?= min(100, $pct) ?>%; height: 100%; background: <?= $pct >= 90 ? 'var(--emergency-600)' : ($pct >= 70 ? 'var(--warning-500)' : 'var(--success-500)') ?>;"></div>
                  </div>
                  <span style="font-size: 0.75rem; font-weight: 600;"><?= $pct ?>%</span>
                </div>
              </td>
              <td>
                <span class="badge <?= $cl['status'] === 'Active' ? 'badge-success' : 'badge-neutral' ?>">
                  <?= htmlspecialchars($cl['status']) ?>
                </span>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- REPORT 3: Stock Depletion & Critical Deficit Audit -->
  <?php if (!empty($stockAlerts)): ?>
    <div class="card" style="margin-bottom: 2rem; border-left: 4px solid var(--emergency-600);">
      <div class="card-header">
        <h3 class="card-title" style="color: var(--emergency-700);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>3. Critical Stock Depletion & Warehouse Deficit Audit (<?= count($stockAlerts) ?> Items)</span>
        </h3>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Resource Commodity</th>
              <th>Sector / Depot Location</th>
              <th>Current On-Hand Stock</th>
              <th>Safety Threshold</th>
              <th>Shortage Deficit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($stockAlerts as $sa): 
              $deficit = max(0, $sa['minimum_stock'] - $sa['quantity_available']);
            ?>
              <tr>
                <td><strong><?= htmlspecialchars($sa['resource_name']) ?></strong></td>
                <td><?= htmlspecialchars($sa['location_name']) ?> (<?= htmlspecialchars($sa['city']) ?>)</td>
                <td>
                  <span style="font-weight: 700; color: <?= $sa['quantity_available'] == 0 ? 'var(--emergency-600)' : 'var(--warning-600)' ?>;">
                    <?= number_format($sa['quantity_available']) ?> <?= htmlspecialchars($sa['unit']) ?>
                  </span>
                </td>
                <td><?= number_format($sa['minimum_stock']) ?> <?= htmlspecialchars($sa['unit']) ?></td>
                <td>
                  <strong style="color: var(--emergency-600);">−<?= number_format($deficit) ?> <?= htmlspecialchars($sa['unit']) ?></strong>
                </td>
                <td>
                  <span class="badge <?= $sa['quantity_available'] == 0 ? 'badge-danger' : 'badge-warning' ?>">
                    <?= $sa['quantity_available'] == 0 ? 'Out of Stock' : 'Low Stock Alert' ?>
                  </span>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  <?php endif; ?>

  <!-- REPORT 4: Donors & Financial Audit -->
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span>4. Philanthropic Contributor Inflow Audit</span>
      </h3>
    </div>
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Donor / Organization</th>
            <th>Type</th>
            <th>Contact Phone</th>
            <th>Contributions Count</th>
            <th>Total Financial Aid (INR)</th>
            <th>Material Goods Donated</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($donorAudit as $da): ?>
            <tr>
              <td><strong><?= htmlspecialchars($da['donor_name']) ?></strong></td>
              <td><span class="badge badge-info"><?= htmlspecialchars($da['donor_type']) ?></span></td>
              <td><?= htmlspecialchars($da['phone'] ?? 'N/A') ?></td>
              <td><?= (int)$da['total_donations_count'] ?> records</td>
              <td>
                <span style="font-weight: 700; color: var(--success-600); font-size: 0.95rem;">
                  ₹<?= number_format($da['monetary_sum'], 2) ?>
                </span>
              </td>
              <td>
                <strong><?= number_format($da['material_sum']) ?></strong> units
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
