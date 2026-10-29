const db = require('../config/db');

// ── DASHBOARD STATS ──────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [activeDisasters] = await db.execute("SELECT COUNT(*) as count FROM disasters WHERE status IN ('Active','Reported')");
    const [affectedPeople] = await db.execute('SELECT COUNT(*) as count FROM affected_people');
    const [totalInventory] = await db.execute('SELECT COALESCE(SUM(quantity_available),0) as count FROM resource_inventory');
    const [pendingRequests] = await db.execute("SELECT COUNT(*) as count FROM resource_requests WHERE status='Pending'");
    const [activeVolunteers] = await db.execute("SELECT COUNT(*) as count FROM volunteers WHERE availability='Available' OR availability='Assigned'");
    const [activeOps] = await db.execute("SELECT COUNT(*) as count FROM rescue_operations WHERE status='Active'");
    const [reliefCenters] = await db.execute("SELECT COUNT(*) as count FROM relief_centers WHERE status='Active'");
    const [totalDonations] = await db.execute("SELECT COALESCE(SUM(amount),0) as total FROM donations WHERE status IN ('Verified','Received')");
    const [totalDistributed] = await db.execute('SELECT COALESCE(SUM(quantity_distributed),0) as count FROM resource_distribution');

    const [disastersByType] = await db.execute(`
      SELECT dt.type_name, COUNT(d.disaster_id) as count 
      FROM disaster_types dt LEFT JOIN disasters d ON dt.disaster_type_id=d.disaster_type_id 
      GROUP BY dt.disaster_type_id ORDER BY count DESC LIMIT 8`);

    const [recentDisasters] = await db.execute(`
      SELECT d.*, dt.type_name FROM disasters d 
      JOIN disaster_types dt ON d.disaster_type_id=dt.disaster_type_id 
      ORDER BY d.created_at DESC LIMIT 5`);

    const [topInventory] = await db.execute(`
      SELECT r.resource_name, r.unit, r.minimum_stock, COALESCE(SUM(ri.quantity_available),0) as total_qty
      FROM resources r LEFT JOIN resource_inventory ri ON r.resource_id=ri.resource_id
      GROUP BY r.resource_id ORDER BY total_qty ASC LIMIT 8`);

    const [monthlyDistribution] = await db.execute(`
      SELECT DATE_FORMAT(distribution_date,'%b %Y') as month, SUM(quantity_distributed) as total
      FROM resource_distribution GROUP BY month ORDER BY distribution_date ASC LIMIT 12`);

    const [donationTrend] = await db.execute(`
      SELECT DATE_FORMAT(donation_date,'%b %Y') as month, SUM(amount) as total
      FROM donations WHERE donation_type='Monetary' AND status IN ('Verified','Received')
      GROUP BY month ORDER BY donation_date ASC LIMIT 12`);

    res.json({
      success: true,
      stats: {
        activeDisasters: activeDisasters[0].count,
        affectedPeople: affectedPeople[0].count,
        availableResources: parseInt(totalInventory[0].count),
        pendingRequests: pendingRequests[0].count,
        activeVolunteers: activeVolunteers[0].count,
        activeOperations: activeOps[0].count,
        reliefCenters: reliefCenters[0].count,
        totalDonations: parseFloat(totalDonations[0].total),
        totalDistributed: parseInt(totalDistributed[0].count),
      },
      charts: {
        disastersByType,
        recentDisasters,
        topInventory,
        monthlyDistribution,
        donationTrend,
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Error loading dashboard statistics.' });
  }
};

// ── DISASTERS ────────────────────────────────────────────────
const getDisasters = async (req, res) => {
  try {
    const { status, severity, type, search } = req.query;
    let query = `
      SELECT d.*, dt.type_name, u.full_name as reported_by_name 
      FROM disasters d 
      JOIN disaster_types dt ON d.disaster_type_id = dt.disaster_type_id
      LEFT JOIN users u ON d.reported_by = u.user_id
      WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND d.status = ?'; params.push(status); }
    if (severity) { query += ' AND d.severity = ?'; params.push(severity); }
    if (type) { query += ' AND d.disaster_type_id = ?'; params.push(type); }
    if (search) { query += ' AND d.disaster_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY d.created_at DESC';

    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching disasters.' });
  }
};

const getDisaster = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT d.*, dt.type_name FROM disasters d JOIN disaster_types dt ON d.disaster_type_id=dt.disaster_type_id WHERE d.disaster_id=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Disaster not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching disaster.' });
  }
};

const createDisaster = async (req, res) => {
  try {
    const { disaster_type_id, disaster_name, description, start_date, end_date, severity, status } = req.body;
    if (!disaster_type_id || !disaster_name || !start_date || !severity) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }
    const [result] = await db.execute(
      'INSERT INTO disasters (disaster_type_id, disaster_name, description, start_date, end_date, severity, status, reported_by) VALUES (?,?,?,?,?,?,?,?)',
      [disaster_type_id, disaster_name, description || null, start_date, end_date || null, severity, status || 'Reported', req.user.user_id]
    );

    // Send notification
    await db.execute(
      "INSERT INTO notifications (disaster_id, title, message, notification_type) VALUES (?, ?, ?, 'Disaster Alert')",
      [result.insertId, `New Disaster Reported: ${disaster_name}`, `A new ${severity} severity disaster has been reported. Immediate assessment required.`]
    );

    res.status(201).json({ success: true, message: 'Disaster created.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error creating disaster.' });
  }
};

const updateDisaster = async (req, res) => {
  try {
    const { disaster_type_id, disaster_name, description, start_date, end_date, severity, status } = req.body;
    await db.execute(
      'UPDATE disasters SET disaster_type_id=?, disaster_name=?, description=?, start_date=?, end_date=?, severity=?, status=? WHERE disaster_id=?',
      [disaster_type_id, disaster_name, description, start_date, end_date || null, severity, status, req.params.id]
    );
    res.json({ success: true, message: 'Disaster updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating disaster.' });
  }
};

const deleteDisaster = async (req, res) => {
  try {
    await db.execute('DELETE FROM disasters WHERE disaster_id=?', [req.params.id]);
    res.json({ success: true, message: 'Disaster deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting disaster.' });
  }
};

// ── DISASTER TYPES ───────────────────────────────────────────
const getDisasterTypes = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM disaster_types ORDER BY type_name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching disaster types.' });
  }
};

const createDisasterType = async (req, res) => {
  try {
    const { type_name, description } = req.body;
    if (!type_name) return res.status(400).json({ success: false, message: 'Type name is required.' });
    const [result] = await db.execute('INSERT INTO disaster_types (type_name, description) VALUES (?,?)', [type_name, description]);
    res.status(201).json({ success: true, message: 'Disaster type created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Disaster type already exists.' });
    res.status(500).json({ success: false, message: 'Error creating disaster type.' });
  }
};

// ── LOCATIONS ────────────────────────────────────────────────
const getLocations = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM locations ORDER BY location_name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching locations.' });
  }
};

const createLocation = async (req, res) => {
  try {
    const { location_name, address, city, state, pincode, latitude, longitude } = req.body;
    if (!location_name) return res.status(400).json({ success: false, message: 'Location name is required.' });
    const [result] = await db.execute(
      'INSERT INTO locations (location_name, address, city, state, pincode, latitude, longitude) VALUES (?,?,?,?,?,?,?)',
      [location_name, address, city, state, pincode, latitude || null, longitude || null]
    );
    res.status(201).json({ success: true, message: 'Location created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating location.' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { location_name, address, city, state, pincode, latitude, longitude } = req.body;
    await db.execute(
      'UPDATE locations SET location_name=?, address=?, city=?, state=?, pincode=?, latitude=?, longitude=? WHERE location_id=?',
      [location_name, address, city, state, pincode, latitude || null, longitude || null, req.params.id]
    );
    res.json({ success: true, message: 'Location updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating location.' });
  }
};

const deleteLocation = async (req, res) => {
  try {
    await db.execute('DELETE FROM locations WHERE location_id=?', [req.params.id]);
    res.json({ success: true, message: 'Location deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting location.' });
  }
};

// ── AFFECTED PEOPLE ──────────────────────────────────────────
const getAffectedPeople = async (req, res) => {
  try {
    const { disaster_id, injury_status, search } = req.query;
    let query = `SELECT ap.*, d.disaster_name, l.location_name, l.city FROM affected_people ap
      JOIN disasters d ON ap.disaster_id=d.disaster_id
      LEFT JOIN locations l ON ap.location_id=l.location_id WHERE 1=1`;
    const params = [];
    if (disaster_id) { query += ' AND ap.disaster_id=?'; params.push(disaster_id); }
    if (injury_status) { query += ' AND ap.injury_status=?'; params.push(injury_status); }
    if (search) { query += ' AND ap.full_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY ap.registered_at DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching affected people.' });
  }
};

const createAffectedPerson = async (req, res) => {
  try {
    const { disaster_id, location_id, full_name, age, gender, phone, family_size, injury_status, special_needs } = req.body;
    if (!disaster_id || !full_name || !gender) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO affected_people (disaster_id, location_id, full_name, age, gender, phone, family_size, injury_status, special_needs) VALUES (?,?,?,?,?,?,?,?,?)',
      [disaster_id, location_id || null, full_name, age || null, gender, phone || null, family_size || 1, injury_status || 'None', special_needs || null]
    );
    res.status(201).json({ success: true, message: 'Person registered.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error registering affected person.' });
  }
};

const updateAffectedPerson = async (req, res) => {
  try {
    const { disaster_id, location_id, full_name, age, gender, phone, family_size, injury_status, special_needs } = req.body;
    await db.execute(
      'UPDATE affected_people SET disaster_id=?, location_id=?, full_name=?, age=?, gender=?, phone=?, family_size=?, injury_status=?, special_needs=? WHERE person_id=?',
      [disaster_id, location_id || null, full_name, age || null, gender, phone || null, family_size || 1, injury_status, special_needs || null, req.params.id]
    );
    res.json({ success: true, message: 'Record updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating record.' });
  }
};

const deleteAffectedPerson = async (req, res) => {
  try {
    await db.execute('DELETE FROM affected_people WHERE person_id=?', [req.params.id]);
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting record.' });
  }
};

// ── RELIEF CENTERS ───────────────────────────────────────────
const getReliefCenters = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT rc.*, l.location_name, l.city, l.state FROM relief_centers rc JOIN locations l ON rc.location_id=l.location_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND rc.status=?'; params.push(status); }
    if (search) { query += ' AND rc.center_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY rc.center_name';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching relief centers.' });
  }
};

const createReliefCenter = async (req, res) => {
  try {
    const { location_id, center_name, center_type, capacity, current_occupancy, contact_number, status } = req.body;
    if (!location_id || !center_name || !center_type || !capacity) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO relief_centers (location_id, center_name, center_type, capacity, current_occupancy, contact_number, status) VALUES (?,?,?,?,?,?,?)',
      [location_id, center_name, center_type, capacity, current_occupancy || 0, contact_number || null, status || 'Active']
    );
    res.status(201).json({ success: true, message: 'Relief center created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating relief center.' });
  }
};

const updateReliefCenter = async (req, res) => {
  try {
    const { location_id, center_name, center_type, capacity, current_occupancy, contact_number, status } = req.body;
    await db.execute(
      'UPDATE relief_centers SET location_id=?, center_name=?, center_type=?, capacity=?, current_occupancy=?, contact_number=?, status=? WHERE center_id=?',
      [location_id, center_name, center_type, capacity, current_occupancy, contact_number, status, req.params.id]
    );
    res.json({ success: true, message: 'Relief center updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating relief center.' });
  }
};

const deleteReliefCenter = async (req, res) => {
  try {
    await db.execute('DELETE FROM relief_centers WHERE center_id=?', [req.params.id]);
    res.json({ success: true, message: 'Relief center deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting relief center.' });
  }
};

// ── RESOURCES ────────────────────────────────────────────────
const getResources = async (req, res) => {
  try {
    const { category_id, search } = req.query;
    let query = `SELECT r.*, rc.category_name FROM resources r JOIN resource_categories rc ON r.category_id=rc.category_id WHERE 1=1`;
    const params = [];
    if (category_id) { query += ' AND r.category_id=?'; params.push(category_id); }
    if (search) { query += ' AND r.resource_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY rc.category_name, r.resource_name';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching resources.' });
  }
};

const createResource = async (req, res) => {
  try {
    const { category_id, resource_name, unit, description, minimum_stock } = req.body;
    if (!category_id || !resource_name || !unit) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO resources (category_id, resource_name, unit, description, minimum_stock) VALUES (?,?,?,?,?)',
      [category_id, resource_name, unit, description || null, minimum_stock || 0]
    );
    res.status(201).json({ success: true, message: 'Resource created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating resource.' });
  }
};

const updateResource = async (req, res) => {
  try {
    const { category_id, resource_name, unit, description, minimum_stock } = req.body;
    await db.execute(
      'UPDATE resources SET category_id=?, resource_name=?, unit=?, description=?, minimum_stock=? WHERE resource_id=?',
      [category_id, resource_name, unit, description, minimum_stock || 0, req.params.id]
    );
    res.json({ success: true, message: 'Resource updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating resource.' });
  }
};

const deleteResource = async (req, res) => {
  try {
    await db.execute('DELETE FROM resources WHERE resource_id=?', [req.params.id]);
    res.json({ success: true, message: 'Resource deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting resource.' });
  }
};

const getResourceCategories = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM resource_categories ORDER BY category_name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching categories.' });
  }
};

const createResourceCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;
    if (!category_name) return res.status(400).json({ success: false, message: 'Category name is required.' });
    const [result] = await db.execute('INSERT INTO resource_categories (category_name, description) VALUES (?,?)', [category_name, description]);
    res.status(201).json({ success: true, message: 'Category created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Category already exists.' });
    res.status(500).json({ success: false, message: 'Error creating category.' });
  }
};

// ── INVENTORY ────────────────────────────────────────────────
const getInventory = async (req, res) => {
  try {
    const { location_id, category_id, stock_status, search } = req.query;
    let query = `
      SELECT ri.*, r.resource_name, r.unit, r.minimum_stock, r.description, rc.category_name, l.location_name, l.city,
        CASE WHEN ri.quantity_available=0 THEN 'Out of Stock'
             WHEN ri.quantity_available <= r.minimum_stock THEN 'Low Stock'
             ELSE 'Available' END as stock_status
      FROM resource_inventory ri
      JOIN resources r ON ri.resource_id=r.resource_id
      JOIN resource_categories rc ON r.category_id=rc.category_id
      JOIN locations l ON ri.location_id=l.location_id WHERE 1=1`;
    const params = [];
    if (location_id) { query += ' AND ri.location_id=?'; params.push(location_id); }
    if (category_id) { query += ' AND r.category_id=?'; params.push(category_id); }
    if (search) { query += ' AND r.resource_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY rc.category_name, r.resource_name';

    const [rows] = await db.execute(query, params);
    let data = rows;
    if (stock_status) data = rows.filter(r => r.stock_status === stock_status);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching inventory.' });
  }
};

const updateInventory = async (req, res) => {
  try {
    const { quantity_available } = req.body;
    if (quantity_available === undefined || quantity_available < 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity required.' });
    }
    await db.execute('UPDATE resource_inventory SET quantity_available=? WHERE inventory_id=?', [quantity_available, req.params.id]);
    res.json({ success: true, message: 'Inventory updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating inventory.' });
  }
};

const createInventory = async (req, res) => {
  try {
    const { resource_id, location_id, quantity_available } = req.body;
    if (!resource_id || !location_id) return res.status(400).json({ success: false, message: 'Resource and location are required.' });
    const [result] = await db.execute(
      'INSERT INTO resource_inventory (resource_id, location_id, quantity_available) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity_available=quantity_available+VALUES(quantity_available)',
      [resource_id, location_id, quantity_available || 0]
    );
    res.status(201).json({ success: true, message: 'Inventory record created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating inventory record.' });
  }
};

// ── RESOURCE REQUESTS ────────────────────────────────────────
const getResourceRequests = async (req, res) => {
  try {
    const { status, priority, disaster_id, search } = req.query;
    let query = `
      SELECT rr.*, d.disaster_name, r.resource_name, r.unit, u.full_name as requester_name, l.location_name
      FROM resource_requests rr
      JOIN disasters d ON rr.disaster_id=d.disaster_id
      JOIN resources r ON rr.resource_id=r.resource_id
      JOIN users u ON rr.requester_id=u.user_id
      LEFT JOIN locations l ON rr.location_id=l.location_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND rr.status=?'; params.push(status); }
    if (priority) { query += ' AND rr.priority=?'; params.push(priority); }
    if (disaster_id) { query += ' AND rr.disaster_id=?'; params.push(disaster_id); }
    if (search) { query += ' AND (d.disaster_name LIKE ? OR r.resource_name LIKE ? OR u.full_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    query += ' ORDER BY rr.request_date DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching resource requests.' });
  }
};

const createResourceRequest = async (req, res) => {
  try {
    const { disaster_id, resource_id, location_id, quantity_requested, priority } = req.body;
    if (!disaster_id || !resource_id || !quantity_requested) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    if (quantity_requested <= 0) return res.status(400).json({ success: false, message: 'Quantity must be positive.' });

    const [result] = await db.execute(
      'INSERT INTO resource_requests (disaster_id, requester_id, resource_id, location_id, quantity_requested, priority) VALUES (?,?,?,?,?,?)',
      [disaster_id, req.user.user_id, resource_id, location_id || null, quantity_requested, priority || 'Medium']
    );

    const [resourceInfo] = await db.execute('SELECT resource_name FROM resources WHERE resource_id=?', [resource_id]);
    await db.execute(
      "INSERT INTO notifications (title, message, notification_type, disaster_id) VALUES (?, ?, 'Resource Request', ?)",
      [`New Resource Request: ${resourceInfo[0]?.resource_name}`, `${quantity_requested} units of ${resourceInfo[0]?.resource_name} requested. Priority: ${priority || 'Medium'}`, disaster_id]
    );

    res.status(201).json({ success: true, message: 'Request submitted.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating request.' });
  }
};

const updateResourceRequest = async (req, res) => {
  try {
    const { status, priority } = req.body;
    await db.execute('UPDATE resource_requests SET status=?, priority=? WHERE request_id=?', [status, priority, req.params.id]);

    if (status === 'Approved') {
      const [req_data] = await db.execute('SELECT * FROM resource_requests WHERE request_id=?', [req.params.id]);
      if (req_data.length) {
        await db.execute(
          "INSERT INTO notifications (user_id, disaster_id, title, message, notification_type) VALUES (?,?,?,?,'Request Approval')",
          [req_data[0].requester_id, req_data[0].disaster_id, 'Resource Request Approved', `Your resource request has been approved.`]
        );
      }
    }
    res.json({ success: true, message: 'Request updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating request.' });
  }
};

// ── RESOURCE DISTRIBUTION ────────────────────────────────────
const distributeResource = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { resource_id, disaster_id, center_id, quantity_distributed, location_id } = req.body;
    if (!resource_id || !disaster_id || !quantity_distributed) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }
    if (quantity_distributed <= 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Quantity must be positive.' });
    }

    // Check inventory
    const locId = location_id || 10;
    const [inv] = await conn.execute(
      'SELECT * FROM resource_inventory WHERE resource_id=? AND location_id=? FOR UPDATE',
      [resource_id, locId]
    );

    if (!inv.length || inv[0].quantity_available < quantity_distributed) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: `Insufficient inventory. Available: ${inv[0]?.quantity_available || 0}` });
    }

    // Create distribution record
    const [dist] = await conn.execute(
      'INSERT INTO resource_distribution (resource_id, disaster_id, center_id, quantity_distributed, distributed_by) VALUES (?,?,?,?,?)',
      [resource_id, disaster_id, center_id || null, quantity_distributed, req.user.user_id]
    );

    // Deduct inventory
    await conn.execute(
      'UPDATE resource_inventory SET quantity_available=quantity_available-? WHERE resource_id=? AND location_id=?',
      [quantity_distributed, resource_id, locId]
    );

    // Check low stock and notify
    const [updatedInv] = await conn.execute(
      'SELECT ri.quantity_available, r.minimum_stock, r.resource_name FROM resource_inventory ri JOIN resources r ON ri.resource_id=r.resource_id WHERE ri.resource_id=? AND ri.location_id=?',
      [resource_id, locId]
    );
    if (updatedInv.length && updatedInv[0].quantity_available <= updatedInv[0].minimum_stock) {
      await conn.execute(
        "INSERT INTO notifications (title, message, notification_type) VALUES (?, ?, 'Low Inventory')",
        [`Low Stock Alert: ${updatedInv[0].resource_name}`, `Stock is at ${updatedInv[0].quantity_available} units (minimum: ${updatedInv[0].minimum_stock}).`]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'Resources distributed successfully.', id: dist.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'Error distributing resources.' });
  } finally {
    conn.release();
  }
};

const getDistributions = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT rd.*, r.resource_name, r.unit, d.disaster_name, rc.center_name, u.full_name as distributed_by_name
      FROM resource_distribution rd
      JOIN resources r ON rd.resource_id=r.resource_id
      JOIN disasters d ON rd.disaster_id=d.disaster_id
      LEFT JOIN relief_centers rc ON rd.center_id=rc.center_id
      LEFT JOIN users u ON rd.distributed_by=u.user_id
      ORDER BY rd.distribution_date DESC`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching distributions.' });
  }
};

// ── VOLUNTEERS ───────────────────────────────────────────────
const getVolunteers = async (req, res) => {
  try {
    const { availability, verification_status, search } = req.query;
    let query = `
      SELECT v.*, u.full_name, u.email, u.phone, u.address FROM volunteers v
      JOIN users u ON v.user_id=u.user_id WHERE 1=1`;
    const params = [];
    if (availability) { query += ' AND v.availability=?'; params.push(availability); }
    if (verification_status) { query += ' AND v.verification_status=?'; params.push(verification_status); }
    if (search) { query += ' AND u.full_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY u.full_name';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching volunteers.' });
  }
};

const updateVolunteer = async (req, res) => {
  try {
    const { skills, availability, verification_status } = req.body;
    await db.execute(
      'UPDATE volunteers SET skills=?, availability=?, verification_status=? WHERE volunteer_id=?',
      [skills, availability, verification_status, req.params.id]
    );
    res.json({ success: true, message: 'Volunteer updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating volunteer.' });
  }
};

const getVolunteerAssignments = async (req, res) => {
  try {
    const { volunteer_id, disaster_id, status } = req.query;
    let query = `
      SELECT va.*, u.full_name as volunteer_name, d.disaster_name, t.task_name
      FROM volunteer_assignments va
      JOIN volunteers v ON va.volunteer_id=v.volunteer_id
      JOIN users u ON v.user_id=u.user_id
      JOIN disasters d ON va.disaster_id=d.disaster_id
      LEFT JOIN relief_tasks t ON va.task_id=t.task_id WHERE 1=1`;
    const params = [];
    if (volunteer_id) { query += ' AND va.volunteer_id=?'; params.push(volunteer_id); }
    if (disaster_id) { query += ' AND va.disaster_id=?'; params.push(disaster_id); }
    if (status) { query += ' AND va.status=?'; params.push(status); }
    query += ' ORDER BY va.assigned_date DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching assignments.' });
  }
};

const createVolunteerAssignment = async (req, res) => {
  try {
    const { volunteer_id, disaster_id, task_id, start_time, end_time } = req.body;
    if (!volunteer_id || !disaster_id) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO volunteer_assignments (volunteer_id, disaster_id, task_id, start_time, end_time) VALUES (?,?,?,?,?)',
      [volunteer_id, disaster_id, task_id || null, start_time || null, end_time || null]
    );
    await db.execute("UPDATE volunteers SET availability='Assigned' WHERE volunteer_id=?", [volunteer_id]);
    res.status(201).json({ success: true, message: 'Volunteer assigned.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating assignment.' });
  }
};

// ── DONORS & DONATIONS ───────────────────────────────────────
const getDonors = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM donors WHERE 1=1';
    const params = [];
    if (search) { query += ' AND (donor_name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY donor_name';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching donors.' });
  }
};

const createDonor = async (req, res) => {
  try {
    const { donor_name, donor_type, email, phone, address } = req.body;
    if (!donor_name) return res.status(400).json({ success: false, message: 'Donor name is required.' });
    const [result] = await db.execute(
      'INSERT INTO donors (donor_name, donor_type, email, phone, address) VALUES (?,?,?,?,?)',
      [donor_name, donor_type || 'Individual', email || null, phone || null, address || null]
    );
    res.status(201).json({ success: true, message: 'Donor created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating donor.' });
  }
};

const getDonations = async (req, res) => {
  try {
    const { status, donation_type, disaster_id, search } = req.query;
    let query = `
      SELECT dn.*, d.donor_name, d.donor_type, dis.disaster_name, r.resource_name
      FROM donations dn
      JOIN donors d ON dn.donor_id=d.donor_id
      LEFT JOIN disasters dis ON dn.disaster_id=dis.disaster_id
      LEFT JOIN resources r ON dn.resource_id=r.resource_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND dn.status=?'; params.push(status); }
    if (donation_type) { query += ' AND dn.donation_type=?'; params.push(donation_type); }
    if (disaster_id) { query += ' AND dn.disaster_id=?'; params.push(disaster_id); }
    if (search) { query += ' AND d.donor_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY dn.donation_date DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching donations.' });
  }
};

const createDonation = async (req, res) => {
  try {
    const { donor_id, disaster_id, resource_id, amount, quantity, donation_type } = req.body;
    if (!donor_id || !donation_type) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    if (donation_type === 'Monetary' && (!amount || amount <= 0)) return res.status(400).json({ success: false, message: 'Valid amount required for monetary donation.' });
    if (donation_type === 'Material' && (!resource_id || !quantity || quantity <= 0)) return res.status(400).json({ success: false, message: 'Resource and quantity required for material donation.' });

    const [result] = await db.execute(
      'INSERT INTO donations (donor_id, disaster_id, resource_id, amount, quantity, donation_type) VALUES (?,?,?,?,?,?)',
      [donor_id, disaster_id || null, resource_id || null, amount || null, quantity || null, donation_type]
    );
    res.status(201).json({ success: true, message: 'Donation recorded.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error recording donation.' });
  }
};

const updateDonation = async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE donations SET status=? WHERE donation_id=?', [status, req.params.id]);
    res.json({ success: true, message: 'Donation status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating donation.' });
  }
};

// ── RESCUE OPERATIONS ────────────────────────────────────────
const getRescueOperations = async (req, res) => {
  try {
    const { status, disaster_id, search } = req.query;
    let query = `
      SELECT ro.*, d.disaster_name, l.location_name, l.city, u.full_name as coordinator_name
      FROM rescue_operations ro
      JOIN disasters d ON ro.disaster_id=d.disaster_id
      LEFT JOIN locations l ON ro.location_id=l.location_id
      LEFT JOIN users u ON ro.coordinator_id=u.user_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND ro.status=?'; params.push(status); }
    if (disaster_id) { query += ' AND ro.disaster_id=?'; params.push(disaster_id); }
    if (search) { query += ' AND ro.operation_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY ro.created_at DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching rescue operations.' });
  }
};

const createRescueOperation = async (req, res) => {
  try {
    const { disaster_id, location_id, operation_name, description, start_time, end_time, status } = req.body;
    if (!disaster_id || !operation_name) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO rescue_operations (disaster_id, location_id, operation_name, description, start_time, end_time, status, coordinator_id) VALUES (?,?,?,?,?,?,?,?)',
      [disaster_id, location_id || null, operation_name, description || null, start_time || null, end_time || null, status || 'Planned', req.user.user_id]
    );
    res.status(201).json({ success: true, message: 'Rescue operation created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating rescue operation.' });
  }
};

const updateRescueOperation = async (req, res) => {
  try {
    const { disaster_id, location_id, operation_name, description, start_time, end_time, people_rescued, status } = req.body;
    await db.execute(
      'UPDATE rescue_operations SET disaster_id=?, location_id=?, operation_name=?, description=?, start_time=?, end_time=?, people_rescued=?, status=? WHERE operation_id=?',
      [disaster_id, location_id || null, operation_name, description, start_time || null, end_time || null, people_rescued || 0, status, req.params.id]
    );
    res.json({ success: true, message: 'Operation updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating operation.' });
  }
};

const deleteRescueOperation = async (req, res) => {
  try {
    await db.execute('DELETE FROM rescue_operations WHERE operation_id=?', [req.params.id]);
    res.json({ success: true, message: 'Operation deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting operation.' });
  }
};

// ── RELIEF TASKS ─────────────────────────────────────────────
const getReliefTasks = async (req, res) => {
  try {
    const { status, priority, disaster_id, assigned_to, search } = req.query;
    let query = `
      SELECT rt.*, d.disaster_name, ro.operation_name, u.full_name as assigned_to_name
      FROM relief_tasks rt
      JOIN disasters d ON rt.disaster_id=d.disaster_id
      LEFT JOIN rescue_operations ro ON rt.operation_id=ro.operation_id
      LEFT JOIN users u ON rt.assigned_to=u.user_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND rt.status=?'; params.push(status); }
    if (priority) { query += ' AND rt.priority=?'; params.push(priority); }
    if (disaster_id) { query += ' AND rt.disaster_id=?'; params.push(disaster_id); }
    if (assigned_to) { query += ' AND rt.assigned_to=?'; params.push(assigned_to); }
    if (search) { query += ' AND rt.task_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY FIELD(rt.priority,"Critical","High","Medium","Low"), rt.deadline ASC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching tasks.' });
  }
};

const createReliefTask = async (req, res) => {
  try {
    const { disaster_id, operation_id, task_name, description, priority, assigned_to, status, deadline } = req.body;
    if (!disaster_id || !task_name) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO relief_tasks (disaster_id, operation_id, task_name, description, priority, assigned_to, status, deadline) VALUES (?,?,?,?,?,?,?,?)',
      [disaster_id, operation_id || null, task_name, description || null, priority || 'Medium', assigned_to || null, status || 'Pending', deadline || null]
    );
    res.status(201).json({ success: true, message: 'Task created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating task.' });
  }
};

const updateReliefTask = async (req, res) => {
  try {
    const { disaster_id, operation_id, task_name, description, priority, assigned_to, status, deadline } = req.body;
    await db.execute(
      'UPDATE relief_tasks SET disaster_id=?, operation_id=?, task_name=?, description=?, priority=?, assigned_to=?, status=?, deadline=? WHERE task_id=?',
      [disaster_id, operation_id || null, task_name, description, priority, assigned_to || null, status, deadline || null, req.params.id]
    );
    res.json({ success: true, message: 'Task updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating task.' });
  }
};

const deleteReliefTask = async (req, res) => {
  try {
    await db.execute('DELETE FROM relief_tasks WHERE task_id=?', [req.params.id]);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting task.' });
  }
};

// ── TRANSPORTATION ───────────────────────────────────────────
const getVehicles = async (req, res) => {
  try {
    const { availability_status, search } = req.query;
    let query = 'SELECT * FROM transportation WHERE 1=1';
    const params = [];
    if (availability_status) { query += ' AND availability_status=?'; params.push(availability_status); }
    if (search) { query += ' AND (vehicle_number LIKE ? OR driver_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY vehicle_number';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching vehicles.' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, capacity, driver_name, driver_phone, availability_status } = req.body;
    if (!vehicle_number || !vehicle_type) return res.status(400).json({ success: false, message: 'Vehicle number and type are required.' });
    const [result] = await db.execute(
      'INSERT INTO transportation (vehicle_number, vehicle_type, capacity, driver_name, driver_phone, availability_status) VALUES (?,?,?,?,?,?)',
      [vehicle_number.toUpperCase(), vehicle_type, capacity || null, driver_name || null, driver_phone || null, availability_status || 'Available']
    );
    res.status(201).json({ success: true, message: 'Vehicle added.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Vehicle number already exists.' });
    res.status(500).json({ success: false, message: 'Error adding vehicle.' });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { vehicle_number, vehicle_type, capacity, driver_name, driver_phone, availability_status } = req.body;
    await db.execute(
      'UPDATE transportation SET vehicle_number=?, vehicle_type=?, capacity=?, driver_name=?, driver_phone=?, availability_status=? WHERE vehicle_id=?',
      [vehicle_number, vehicle_type, capacity, driver_name, driver_phone, availability_status, req.params.id]
    );
    res.json({ success: true, message: 'Vehicle updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating vehicle.' });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    await db.execute('DELETE FROM transportation WHERE vehicle_id=?', [req.params.id]);
    res.json({ success: true, message: 'Vehicle deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting vehicle.' });
  }
};

const getTransportAssignments = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT ta.*, t.vehicle_number, t.vehicle_type, t.driver_name, ro.operation_name
      FROM transport_assignments ta
      JOIN transportation t ON ta.vehicle_id=t.vehicle_id
      LEFT JOIN rescue_operations ro ON ta.operation_id=ro.operation_id
      ORDER BY ta.assigned_date DESC`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching transport assignments.' });
  }
};

const createTransportAssignment = async (req, res) => {
  try {
    const { vehicle_id, operation_id, source_location, destination_location, departure_time, arrival_time, status } = req.body;
    if (!vehicle_id || !source_location || !destination_location) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO transport_assignments (vehicle_id, operation_id, source_location, destination_location, departure_time, arrival_time, status) VALUES (?,?,?,?,?,?,?)',
      [vehicle_id, operation_id || null, source_location, destination_location, departure_time || null, arrival_time || null, status || 'Scheduled']
    );
    await db.execute("UPDATE transportation SET availability_status='In Use' WHERE vehicle_id=?", [vehicle_id]);
    res.status(201).json({ success: true, message: 'Transport assignment created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating transport assignment.' });
  }
};

// ── MEDICAL ──────────────────────────────────────────────────
const getMedicalFacilities = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `SELECT mf.*, l.location_name, l.city, l.state FROM medical_facilities mf LEFT JOIN locations l ON mf.location_id=l.location_id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND mf.status=?'; params.push(status); }
    if (search) { query += ' AND mf.facility_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY mf.facility_name';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching medical facilities.' });
  }
};

const createMedicalFacility = async (req, res) => {
  try {
    const { location_id, facility_name, facility_type, contact_number, available_beds, emergency_available, status } = req.body;
    if (!facility_name || !facility_type) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO medical_facilities (location_id, facility_name, facility_type, contact_number, available_beds, emergency_available, status) VALUES (?,?,?,?,?,?,?)',
      [location_id || null, facility_name, facility_type, contact_number || null, available_beds || 0, emergency_available ? 1 : 0, status || 'Active']
    );
    res.status(201).json({ success: true, message: 'Facility created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating facility.' });
  }
};

const updateMedicalFacility = async (req, res) => {
  try {
    const { location_id, facility_name, facility_type, contact_number, available_beds, emergency_available, status } = req.body;
    await db.execute(
      'UPDATE medical_facilities SET location_id=?, facility_name=?, facility_type=?, contact_number=?, available_beds=?, emergency_available=?, status=? WHERE facility_id=?',
      [location_id || null, facility_name, facility_type, contact_number, available_beds, emergency_available ? 1 : 0, status, req.params.id]
    );
    res.json({ success: true, message: 'Facility updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating facility.' });
  }
};

const getMedicalCases = async (req, res) => {
  try {
    const { case_status, disaster_id, search } = req.query;
    let query = `
      SELECT mc.*, ap.full_name as person_name, ap.age, ap.gender, mf.facility_name, d.disaster_name
      FROM medical_cases mc
      LEFT JOIN affected_people ap ON mc.person_id=ap.person_id
      LEFT JOIN medical_facilities mf ON mc.facility_id=mf.facility_id
      LEFT JOIN disasters d ON mc.disaster_id=d.disaster_id WHERE 1=1`;
    const params = [];
    if (case_status) { query += ' AND mc.case_status=?'; params.push(case_status); }
    if (disaster_id) { query += ' AND mc.disaster_id=?'; params.push(disaster_id); }
    if (search) { query += ' AND ap.full_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY mc.admission_date DESC';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching medical cases.' });
  }
};

const createMedicalCase = async (req, res) => {
  try {
    const { person_id, facility_id, disaster_id, case_type, injury_description, treatment, case_status } = req.body;
    if (!case_type) return res.status(400).json({ success: false, message: 'Case type is required.' });
    const [result] = await db.execute(
      'INSERT INTO medical_cases (person_id, facility_id, disaster_id, case_type, injury_description, treatment, case_status) VALUES (?,?,?,?,?,?,?)',
      [person_id || null, facility_id || null, disaster_id || null, case_type, injury_description || null, treatment || null, case_status || 'Admitted']
    );
    res.status(201).json({ success: true, message: 'Medical case created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating medical case.' });
  }
};

const updateMedicalCase = async (req, res) => {
  try {
    const { case_type, injury_description, treatment, case_status, discharge_date } = req.body;
    await db.execute(
      'UPDATE medical_cases SET case_type=?, injury_description=?, treatment=?, case_status=?, discharge_date=? WHERE case_id=?',
      [case_type, injury_description, treatment, case_status, discharge_date || null, req.params.id]
    );
    res.json({ success: true, message: 'Case updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating case.' });
  }
};

// ── EMERGENCY CONTACTS ───────────────────────────────────────
const getEmergencyContacts = async (req, res) => {
  try {
    const { service_type, location_id, search } = req.query;
    let query = `SELECT ec.*, l.location_name, l.city, l.state FROM emergency_contacts ec LEFT JOIN locations l ON ec.location_id=l.location_id WHERE 1=1`;
    const params = [];
    if (service_type) { query += ' AND ec.service_type=?'; params.push(service_type); }
    if (location_id) { query += ' AND ec.location_id=?'; params.push(location_id); }
    if (search) { query += ' AND ec.service_name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY ec.service_type, ec.service_name';
    const [rows] = await db.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching emergency contacts.' });
  }
};

const createEmergencyContact = async (req, res) => {
  try {
    const { location_id, service_name, service_type, contact_number, address, availability } = req.body;
    if (!service_name || !service_type || !contact_number) return res.status(400).json({ success: false, message: 'Required fields missing.' });
    const [result] = await db.execute(
      'INSERT INTO emergency_contacts (location_id, service_name, service_type, contact_number, address, availability) VALUES (?,?,?,?,?,?)',
      [location_id || null, service_name, service_type, contact_number, address || null, availability || '24/7']
    );
    res.status(201).json({ success: true, message: 'Emergency contact created.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating emergency contact.' });
  }
};

const updateEmergencyContact = async (req, res) => {
  try {
    const { location_id, service_name, service_type, contact_number, address, availability } = req.body;
    await db.execute(
      'UPDATE emergency_contacts SET location_id=?, service_name=?, service_type=?, contact_number=?, address=?, availability=? WHERE contact_id=?',
      [location_id || null, service_name, service_type, contact_number, address, availability, req.params.id]
    );
    res.json({ success: true, message: 'Contact updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating contact.' });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    await db.execute('DELETE FROM emergency_contacts WHERE contact_id=?', [req.params.id]);
    res.json({ success: true, message: 'Contact deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting contact.' });
  }
};

// ── NOTIFICATIONS ────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [rows] = await db.execute(
      `SELECT n.*, d.disaster_name FROM notifications n LEFT JOIN disasters d ON n.disaster_id=d.disaster_id
       WHERE n.user_id=? OR n.user_id IS NULL ORDER BY n.created_at DESC LIMIT 50`,
      [userId]
    );
    const [unreadCount] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE (user_id=? OR user_id IS NULL) AND is_read=0',
      [userId]
    );
    res.json({ success: true, data: rows, unreadCount: unreadCount[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching notifications.' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read=1 WHERE notification_id=?', [req.params.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating notification.' });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read=1 WHERE user_id=? OR user_id IS NULL', [req.user.user_id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating notifications.' });
  }
};

const createNotification = async (req, res) => {
  try {
    const { user_id, disaster_id, title, message, notification_type } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message are required.' });
    const [result] = await db.execute(
      'INSERT INTO notifications (user_id, disaster_id, title, message, notification_type) VALUES (?,?,?,?,?)',
      [user_id || null, disaster_id || null, title, message, notification_type || 'General']
    );
    res.status(201).json({ success: true, message: 'Notification sent.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating notification.' });
  }
};

// ── USERS ────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT u.user_id, u.full_name, u.email, u.phone, u.status, u.address, u.created_at, r.role_name FROM users u JOIN roles r ON u.role_id=r.role_id ORDER BY u.created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { full_name, email, phone, address, status, role_id } = req.body;
    await db.execute(
      'UPDATE users SET full_name=?, email=?, phone=?, address=?, status=?, role_id=? WHERE user_id=?',
      [full_name, email, phone, address, status, role_id, req.params.id]
    );
    res.json({ success: true, message: 'User updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating user.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id == req.user.user_id) return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    await db.execute('DELETE FROM users WHERE user_id=?', [req.params.id]);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
};

const getRoles = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM roles');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching roles.' });
  }
};

// ── REPORTS ──────────────────────────────────────────────────
const getReports = async (req, res) => {
  try {
    const { report_type, disaster_id, start_date, end_date } = req.query;
    let data = [];

    if (report_type === 'disaster_statistics') {
      const [rows] = await db.execute(`
        SELECT d.disaster_name, dt.type_name, d.severity, d.status, d.start_date, d.end_date,
          (SELECT COUNT(*) FROM affected_people WHERE disaster_id=d.disaster_id) as affected_count,
          (SELECT COUNT(*) FROM rescue_operations WHERE disaster_id=d.disaster_id) as operation_count,
          (SELECT COALESCE(SUM(amount),0) FROM donations WHERE disaster_id=d.disaster_id AND status IN ('Verified','Received')) as total_donations
        FROM disasters d JOIN disaster_types dt ON d.disaster_type_id=dt.disaster_type_id
        ${disaster_id ? 'WHERE d.disaster_id=?' : ''} ORDER BY d.start_date DESC`,
        disaster_id ? [disaster_id] : []
      );
      data = rows;
    } else if (report_type === 'resource_inventory') {
      const [rows] = await db.execute(`
        SELECT r.resource_name, rc.category_name, r.unit, r.minimum_stock,
          COALESCE(SUM(ri.quantity_available),0) as total_quantity,
          CASE WHEN COALESCE(SUM(ri.quantity_available),0)=0 THEN 'Out of Stock'
               WHEN COALESCE(SUM(ri.quantity_available),0)<=r.minimum_stock THEN 'Low Stock'
               ELSE 'Available' END as stock_status
        FROM resources r JOIN resource_categories rc ON r.category_id=rc.category_id
        LEFT JOIN resource_inventory ri ON r.resource_id=ri.resource_id
        GROUP BY r.resource_id ORDER BY stock_status, rc.category_name, r.resource_name`);
      data = rows;
    } else if (report_type === 'donations') {
      const [rows] = await db.execute(`
        SELECT d2.donor_name, d2.donor_type, dn.donation_type, dn.amount, dn.quantity,
          r.resource_name, dis.disaster_name, dn.status, dn.donation_date
        FROM donations dn JOIN donors d2 ON dn.donor_id=d2.donor_id
        LEFT JOIN resources r ON dn.resource_id=r.resource_id
        LEFT JOIN disasters dis ON dn.disaster_id=dis.disaster_id
        ${disaster_id ? 'WHERE dn.disaster_id=?' : ''} ORDER BY dn.donation_date DESC`,
        disaster_id ? [disaster_id] : []
      );
      data = rows;
    } else if (report_type === 'volunteers') {
      const [rows] = await db.execute(`
        SELECT u.full_name, v.skills, v.availability, v.verification_status, v.registration_date,
          COUNT(va.assignment_id) as total_assignments
        FROM volunteers v JOIN users u ON v.user_id=u.user_id
        LEFT JOIN volunteer_assignments va ON v.volunteer_id=va.volunteer_id
        GROUP BY v.volunteer_id ORDER BY u.full_name`);
      data = rows;
    } else if (report_type === 'rescue_operations') {
      const [rows] = await db.execute(`
        SELECT ro.operation_name, d.disaster_name, l.location_name, ro.status,
          ro.start_time, ro.end_time, ro.people_rescued, u.full_name as coordinator
        FROM rescue_operations ro JOIN disasters d ON ro.disaster_id=d.disaster_id
        LEFT JOIN locations l ON ro.location_id=l.location_id
        LEFT JOIN users u ON ro.coordinator_id=u.user_id
        ${disaster_id ? 'WHERE ro.disaster_id=?' : ''} ORDER BY ro.start_time DESC`,
        disaster_id ? [disaster_id] : []
      );
      data = rows;
    }

    res.json({ success: true, data, report_type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error generating report.' });
  }
};

// ── AFFECTED AREAS ───────────────────────────────────────────
const getAffectedAreas = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT aa.*, d.disaster_name, l.location_name, l.city, l.state, l.latitude, l.longitude
      FROM affected_areas aa JOIN disasters d ON aa.disaster_id=d.disaster_id
      JOIN locations l ON aa.location_id=l.location_id ORDER BY aa.created_at DESC`);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching affected areas.' });
  }
};

module.exports = {
  getDashboardStats,
  getDisasters, getDisaster, createDisaster, updateDisaster, deleteDisaster,
  getDisasterTypes, createDisasterType,
  getLocations, createLocation, updateLocation, deleteLocation,
  getAffectedPeople, createAffectedPerson, updateAffectedPerson, deleteAffectedPerson,
  getReliefCenters, createReliefCenter, updateReliefCenter, deleteReliefCenter,
  getResources, createResource, updateResource, deleteResource,
  getResourceCategories, createResourceCategory,
  getInventory, updateInventory, createInventory,
  getResourceRequests, createResourceRequest, updateResourceRequest,
  distributeResource, getDistributions,
  getVolunteers, updateVolunteer, getVolunteerAssignments, createVolunteerAssignment,
  getDonors, createDonor, getDonations, createDonation, updateDonation,
  getRescueOperations, createRescueOperation, updateRescueOperation, deleteRescueOperation,
  getReliefTasks, createReliefTask, updateReliefTask, deleteReliefTask,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getTransportAssignments, createTransportAssignment,
  getMedicalFacilities, createMedicalFacility, updateMedicalFacility,
  getMedicalCases, createMedicalCase, updateMedicalCase,
  getEmergencyContacts, createEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
  getNotifications, markNotificationRead, markAllNotificationsRead, createNotification,
  getUsers, updateUser, deleteUser, getRoles,
  getReports, getAffectedAreas,
};
