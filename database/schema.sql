-- ============================================================
-- Disaster Relief & Resource Management System
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS dbms_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dbms_project;

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    address TEXT,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
);

-- ============================================================
-- 3. DISASTER TYPES
-- ============================================================
CREATE TABLE IF NOT EXISTS disaster_types (
    disaster_type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ============================================================
-- 4. LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
    location_id INT PRIMARY KEY AUTO_INCREMENT,
    location_name VARCHAR(150) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- ============================================================
-- 5. DISASTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS disasters (
    disaster_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_type_id INT NOT NULL,
    disaster_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    severity ENUM('Low', 'Moderate', 'High', 'Critical') NOT NULL DEFAULT 'Moderate',
    status ENUM('Reported', 'Active', 'Under Control', 'Resolved') NOT NULL DEFAULT 'Reported',
    reported_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(disaster_type_id) ON DELETE RESTRICT,
    FOREIGN KEY (reported_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_disasters_status (status),
    INDEX idx_disasters_severity (severity)
);

-- ============================================================
-- 6. AFFECTED AREAS
-- ============================================================
CREATE TABLE IF NOT EXISTS affected_areas (
    affected_area_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NOT NULL,
    location_id INT NOT NULL,
    severity ENUM('Low', 'Moderate', 'High', 'Critical') NOT NULL,
    estimated_population INT,
    damage_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    UNIQUE KEY uq_area_disaster_location (disaster_id, location_id)
);

-- ============================================================
-- 7. AFFECTED PEOPLE
-- ============================================================
CREATE TABLE IF NOT EXISTS affected_people (
    person_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NOT NULL,
    location_id INT,
    full_name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone VARCHAR(20),
    family_size INT DEFAULT 1,
    injury_status ENUM('None', 'Minor', 'Moderate', 'Severe', 'Critical') DEFAULT 'None',
    special_needs TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    INDEX idx_affected_disaster (disaster_id)
);

-- ============================================================
-- 8. RELIEF CENTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS relief_centers (
    center_id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT NOT NULL,
    center_name VARCHAR(150) NOT NULL,
    center_type ENUM('Shelter', 'Food Distribution', 'Medical', 'Multi-Purpose') NOT NULL,
    capacity INT NOT NULL,
    current_occupancy INT DEFAULT 0,
    contact_number VARCHAR(20),
    status ENUM('Active', 'Full', 'Closed', 'Under Setup') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE RESTRICT,
    INDEX idx_center_status (status)
);

-- ============================================================
-- 9. RESOURCE CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ============================================================
-- 10. RESOURCES
-- ============================================================
CREATE TABLE IF NOT EXISTS resources (
    resource_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    resource_name VARCHAR(150) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    minimum_stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES resource_categories(category_id) ON DELETE RESTRICT,
    INDEX idx_resource_category (category_id)
);

-- ============================================================
-- 11. RESOURCE INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    resource_id INT NOT NULL,
    location_id INT NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    UNIQUE KEY uq_inventory_resource_location (resource_id, location_id)
);

-- ============================================================
-- 12. RESOURCE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NOT NULL,
    requester_id INT NOT NULL,
    resource_id INT NOT NULL,
    location_id INT,
    quantity_requested INT NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Pending', 'Approved', 'Rejected', 'Processing', 'Delivered') DEFAULT 'Pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    INDEX idx_request_status (status),
    INDEX idx_request_priority (priority)
);

-- ============================================================
-- 13. RESOURCE DISTRIBUTION
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_distribution (
    distribution_id INT PRIMARY KEY AUTO_INCREMENT,
    resource_id INT NOT NULL,
    disaster_id INT NOT NULL,
    center_id INT,
    quantity_distributed INT NOT NULL,
    distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    distributed_by INT,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE RESTRICT,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES relief_centers(center_id) ON DELETE SET NULL,
    FOREIGN KEY (distributed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================
-- 14. VOLUNTEERS
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteers (
    volunteer_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    skills TEXT,
    availability ENUM('Available', 'Assigned', 'Unavailable') DEFAULT 'Available',
    verification_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- 15. RELIEF TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS relief_tasks (
    task_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NOT NULL,
    operation_id INT,
    task_name VARCHAR(200) NOT NULL,
    description TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    assigned_to INT,
    status ENUM('Pending', 'Assigned', 'In Progress', 'Completed') DEFAULT 'Pending',
    deadline DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_task_status (status),
    INDEX idx_task_priority (priority)
);

-- ============================================================
-- 16. VOLUNTEER ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteer_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    volunteer_id INT NOT NULL,
    disaster_id INT NOT NULL,
    task_id INT,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_time DATETIME,
    end_time DATETIME,
    status ENUM('Assigned', 'Active', 'Completed', 'Cancelled') DEFAULT 'Assigned',
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES relief_tasks(task_id) ON DELETE SET NULL
);

-- ============================================================
-- 17. DONORS
-- ============================================================
CREATE TABLE IF NOT EXISTS donors (
    donor_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_name VARCHAR(100) NOT NULL,
    donor_type ENUM('Individual', 'Organization', 'Corporate', 'Government') DEFAULT 'Individual',
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 18. DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS donations (
    donation_id INT PRIMARY KEY AUTO_INCREMENT,
    donor_id INT NOT NULL,
    disaster_id INT,
    resource_id INT,
    amount DECIMAL(12, 2),
    quantity INT,
    donation_type ENUM('Monetary', 'Material') NOT NULL,
    donation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Verified', 'Received', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE RESTRICT,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE SET NULL,
    FOREIGN KEY (resource_id) REFERENCES resources(resource_id) ON DELETE SET NULL,
    INDEX idx_donation_status (status)
);

-- ============================================================
-- 19. RESCUE OPERATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS rescue_operations (
    operation_id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NOT NULL,
    location_id INT,
    operation_name VARCHAR(200) NOT NULL,
    description TEXT,
    start_time DATETIME,
    end_time DATETIME,
    people_rescued INT DEFAULT 0,
    status ENUM('Planned', 'Active', 'Completed', 'Cancelled') DEFAULT 'Planned',
    coordinator_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    FOREIGN KEY (coordinator_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_operation_status (status)
);

-- ============================================================
-- 20. TRANSPORTATION
-- ============================================================
CREATE TABLE IF NOT EXISTS transportation (
    vehicle_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_number VARCHAR(30) NOT NULL UNIQUE,
    vehicle_type ENUM('Truck', 'Van', 'Ambulance', 'Helicopter', 'Boat', 'Bus', 'SUV') NOT NULL,
    capacity INT,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    availability_status ENUM('Available', 'In Use', 'Under Maintenance', 'Out of Service') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 21. TRANSPORT ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS transport_assignments (
    transport_assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    operation_id INT,
    source_location VARCHAR(200),
    destination_location VARCHAR(200),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    departure_time DATETIME,
    arrival_time DATETIME,
    status ENUM('Scheduled', 'En Route', 'Arrived', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    FOREIGN KEY (vehicle_id) REFERENCES transportation(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (operation_id) REFERENCES rescue_operations(operation_id) ON DELETE SET NULL
);

-- ============================================================
-- 22. MEDICAL FACILITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_facilities (
    facility_id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT,
    facility_name VARCHAR(150) NOT NULL,
    facility_type ENUM('Hospital', 'Clinic', 'Field Medical Unit', 'Trauma Center') NOT NULL,
    contact_number VARCHAR(20),
    available_beds INT DEFAULT 0,
    emergency_available BOOLEAN DEFAULT FALSE,
    status ENUM('Active', 'Full', 'Closed') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL
);

-- ============================================================
-- 23. MEDICAL CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_cases (
    case_id INT PRIMARY KEY AUTO_INCREMENT,
    person_id INT,
    facility_id INT,
    disaster_id INT,
    case_type ENUM('Injury', 'Illness', 'Trauma', 'Missing', 'Deceased') NOT NULL,
    injury_description TEXT,
    treatment TEXT,
    case_status ENUM('Admitted', 'Under Treatment', 'Discharged', 'Critical', 'Deceased') DEFAULT 'Admitted',
    admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discharge_date DATETIME,
    FOREIGN KEY (person_id) REFERENCES affected_people(person_id) ON DELETE SET NULL,
    FOREIGN KEY (facility_id) REFERENCES medical_facilities(facility_id) ON DELETE SET NULL,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE SET NULL,
    INDEX idx_case_status (case_status)
);

-- ============================================================
-- 24. EMERGENCY CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    contact_id INT PRIMARY KEY AUTO_INCREMENT,
    location_id INT,
    service_name VARCHAR(100) NOT NULL,
    service_type ENUM('Police', 'Fire', 'Ambulance', 'Hospital', 'Disaster Management', 'Search & Rescue') NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address TEXT,
    availability ENUM('24/7', 'Business Hours', 'On Call') DEFAULT '24/7',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL
);

-- ============================================================
-- 25. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    disaster_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('Disaster Alert', 'Resource Request', 'Request Approval', 'Low Inventory', 'Volunteer Assignment', 'Rescue Update', 'Medical Emergency', 'Donation Update', 'General') DEFAULT 'General',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (disaster_id) REFERENCES disasters(disaster_id) ON DELETE SET NULL,
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (is_read)
);

-- Add operation_id FK to relief_tasks after rescue_operations table is created
ALTER TABLE relief_tasks
    ADD CONSTRAINT fk_task_operation 
    FOREIGN KEY (operation_id) REFERENCES rescue_operations(operation_id) ON DELETE SET NULL;
