-- ============================================================
-- Disaster Relief & Resource Management System
-- Seed Data
-- ============================================================
USE dbms_project;

-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (role_name, description) VALUES
('Admin', 'Full system access and management'),
('Disaster Coordinator', 'Manages disaster response operations'),
('Volunteer', 'Participates in relief and rescue activities'),
('Donor', 'Donates resources or funds to disaster relief');

-- ============================================================
-- USERS (password: Admin@123 for all, bcrypt hashed)
-- ============================================================
INSERT INTO users (role_id, full_name, email, phone, password, address, status) VALUES
(1, 'Rajesh Kumar Sharma', 'admin@reliefhub.org', '+91-9876543210', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMDVsHt0VkXfkUCVh/H6L6j9K2', 'NDMA Headquarters, New Delhi, India', 'active'),
(2, 'Priya Nair', 'coordinator1@reliefhub.org', '+91-9856321478', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMDVsHt0VkXfkUCVh/H6L6j9K2', 'Relief Operations Center, Mumbai, Maharashtra', 'active'),
(2, 'Anand Verma', 'coordinator2@reliefhub.org', '+91-9912345678', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMDVsHt0VkXfkUCVh/H6L6j9K2', 'District Disaster Cell, Kolkata, West Bengal', 'active'),
(3, 'Sneha Patel', 'volunteer1@reliefhub.org', '+91-8765432109', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMDVsHt0VkXfkUCVh/H6L6j9K2', '45 Gandhi Nagar, Ahmedabad, Gujarat', 'active'),
(3, 'Mohammed Ashraf', 'volunteer2@reliefhub.org', '+91-8234567890', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMDVsHt0VkXfkUCVh/H6L6j9K2', '12 Marine Lines, Chennai, Tamil Nadu', 'active'),
(4, 'Tata Charitable Foundation', 'donor@tatafoundation.org', '+91-2222345678', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMDVsHt0VkXfkUCVh/H6L6j9K2', 'Bombay House, Mumbai, Maharashtra', 'active'),
(4, 'Aishwarya Mehta', 'donor2@gmail.com', '+91-9988776655', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMDVsHt0VkXfkUCVh/H6L6j9K2', 'Sector 14, Gurugram, Haryana', 'active');

-- ============================================================
-- DISASTER TYPES
-- ============================================================
INSERT INTO disaster_types (type_name, description) VALUES
('Flood', 'Overflow of water onto normally dry land due to excessive rainfall or dam failure'),
('Earthquake', 'Sudden violent shaking of the ground caused by movement of tectonic plates'),
('Cyclone', 'A system of winds rotating inward to an area of low atmospheric pressure'),
('Drought', 'A prolonged period of abnormally low rainfall leading to water shortage'),
('Landslide', 'The movement of rock, earth, or debris down a slope'),
('Tsunami', 'A series of ocean waves caused by underwater seismic activity'),
('Forest Fire', 'An uncontrolled fire in forested areas causing widespread destruction'),
('Chemical Disaster', 'Industrial accidents leading to release of hazardous substances'),
('Heatwave', 'A prolonged period of excessively hot weather posing health risks'),
('Industrial Accident', 'Accidents in industrial settings causing injuries, damage, and pollution');

-- ============================================================
-- LOCATIONS
-- ============================================================
INSERT INTO locations (location_name, address, city, state, pincode, latitude, longitude) VALUES
('Mumbai Relief Zone', 'Bandra East Relief Camp, Near Station', 'Mumbai', 'Maharashtra', '400051', 19.0596, 72.8295),
('Kerala Flood Operations HQ', 'District Collectorate Compound', 'Ernakulam', 'Kerala', '682016', 10.0232, 76.3070),
('Odisha Cyclone Camp', 'Cyclone Shelter, Puri Beach Rd', 'Puri', 'Odisha', '752001', 19.8135, 85.8312),
('Uttarakhand Landslide Zone', 'Tehri Garhwal District HQ', 'Tehri', 'Uttarakhand', '249001', 30.3785, 78.4817),
('Gujarat Earthquake Zone', 'Bhuj District Collectorate', 'Bhuj', 'Gujarat', '370001', 23.2520, 69.6669),
('Chennai Flood Center', 'Anna Nagar Relief Zone', 'Chennai', 'Tamil Nadu', '600040', 13.0827, 80.2707),
('Assam Flood Relief', 'Guwahati Relief Operations', 'Guwahati', 'Assam', '781001', 26.1445, 91.7362),
('West Bengal Cyclone Zone', 'Sundarbans Rescue Camp', 'Basirhat', 'West Bengal', '743411', 22.6571, 88.8834),
('Rajasthan Drought Zone', 'Jaisalmer Drought Relief Camp', 'Jaisalmer', 'Rajasthan', '345001', 26.9157, 70.9083),
('Delhi Emergency HQ', 'NDMA National HQ', 'New Delhi', 'Delhi', '110001', 28.6139, 77.2090),
('Hyderabad Command Center', 'SDMA Telangana HQ', 'Hyderabad', 'Telangana', '500004', 17.3850, 78.4867),
('Bangalore Relief Hub', 'KSNDMC Karnataka HQ', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946);

-- ============================================================
-- DISASTERS
-- ============================================================
INSERT INTO disasters (disaster_type_id, disaster_name, description, start_date, end_date, severity, status, reported_by) VALUES
(1, 'Maharashtra Flood 2024', 'Severe flooding in coastal Maharashtra due to extremely heavy monsoon rainfall causing widespread displacement', '2024-07-15', NULL, 'Critical', 'Active', 1),
(2, 'Himachal Pradesh Earthquake', 'A 6.2 magnitude earthquake struck Shimla district causing structural damage and casualties', '2024-06-10', '2024-06-25', 'High', 'Under Control', 1),
(3, 'Cyclone Biparjoy Aftermath', 'Ongoing relief operations following Cyclone Biparjoy that made landfall in Gujarat', '2024-05-01', '2024-06-01', 'High', 'Resolved', 2),
(1, 'Assam Floods 2024', 'Annual Brahmaputra flooding affecting multiple districts in Assam with over 2 million displaced', '2024-06-20', NULL, 'Critical', 'Active', 2),
(4, 'Rajasthan Drought Relief', 'Persistent drought conditions across western Rajasthan requiring immediate water and food assistance', '2024-03-01', NULL, 'Moderate', 'Active', 1),
(5, 'Wayanad Landslide', 'Massive landslide in Wayanad district following heavy rains burying several villages', '2024-07-30', NULL, 'Critical', 'Active', 2),
(3, 'Cyclone Remal Bengal', 'Severe cyclonic storm making landfall in West Bengal causing coastal flooding and destruction', '2024-05-26', '2024-06-05', 'High', 'Resolved', 1),
(9, 'Telangana Heatwave', 'Extreme heat wave with temperatures exceeding 45°C causing heatstroke fatalities', '2024-04-15', '2024-05-15', 'High', 'Resolved', 1);

-- ============================================================
-- AFFECTED AREAS
-- ============================================================
INSERT INTO affected_areas (disaster_id, location_id, severity, estimated_population, damage_description) VALUES
(1, 1, 'Critical', 125000, 'Residential areas completely submerged, infrastructure heavily damaged, roads cut off'),
(1, 6, 'High', 85000, 'Coastal areas flooded, fishing communities severely affected, saltwater intrusion'),
(4, 7, 'Critical', 200000, 'Multiple river embankments breached, vast agricultural land submerged'),
(5, 9, 'Moderate', 45000, 'Severe water scarcity, livestock deaths, crop failure'),
(6, 2, 'Critical', 15000, 'Entire villages buried, roads destroyed, power lines down'),
(2, 4, 'High', 32000, 'Building collapses, road damage, landslides triggered'),
(8, 11, 'High', 180000, 'Mass heatstroke cases, crop damage, power outages');

-- ============================================================
-- AFFECTED PEOPLE
-- ============================================================
INSERT INTO affected_people (disaster_id, location_id, full_name, age, gender, phone, family_size, injury_status, special_needs) VALUES
(1, 1, 'Ramesh Patil', 45, 'Male', '+91-9876501234', 4, 'Minor', NULL),
(1, 1, 'Sunita Desai', 38, 'Female', '+91-9845123456', 3, 'None', 'Pregnant - 7 months'),
(1, 1, 'Dinesh Kumar Jain', 67, 'Male', '+91-9712345678', 2, 'Moderate', 'Diabetic, requires insulin'),
(4, 7, 'Bhupen Hazarika', 52, 'Male', '+91-8765098765', 6, 'None', NULL),
(4, 7, 'Mrinali Borah', 29, 'Female', '+91-8456123789', 4, 'Minor', 'Has infant child'),
(6, 2, 'Thomas Kurian', 41, 'Male', '+91-9123456789', 5, 'Severe', 'Fractures in both legs'),
(6, 2, 'Lisy Jacob', 35, 'Female', '+91-9234567890', 3, 'Critical', 'Head injury, unconscious'),
(5, 9, 'Mahaveer Singh Rathore', 60, 'Male', '+91-9012345678', 8, 'None', 'Elderly, low mobility'),
(2, 4, 'Asha Sharma', 28, 'Female', '+91-9345678901', 2, 'Minor', NULL),
(1, 6, 'Pradeep Ghosalkar', 34, 'Male', '+91-9456789012', 5, 'None', NULL),
(8, 11, 'Rekha Reddy', 55, 'Female', '+91-9567890123', 3, 'Moderate', 'Heatstroke, needs cooling'),
(8, 11, 'Suresh Babu Naidu', 70, 'Male', '+91-9678901234', 1, 'Severe', 'Heart patient');

-- ============================================================
-- RELIEF CENTERS
-- ============================================================
INSERT INTO relief_centers (location_id, center_name, center_type, capacity, current_occupancy, contact_number, status) VALUES
(1, 'Mumbai Bandra Relief Camp', 'Shelter', 1200, 876, '+91-22-26551234', 'Active'),
(6, 'Chennai Anna Nagar Relief Hub', 'Multi-Purpose', 800, 543, '+91-44-26541234', 'Active'),
(7, 'Guwahati Flood Relief Center', 'Shelter', 2000, 1890, '+91-361-2345678', 'Active'),
(2, 'Ernakulam Medical Camp', 'Medical', 300, 180, '+91-484-2345678', 'Active'),
(9, 'Jaisalmer Drought Aid Center', 'Food Distribution', 500, 325, '+91-2992-234567', 'Active'),
(4, 'Tehri Emergency Shelter', 'Shelter', 600, 234, '+91-1376-234567', 'Active'),
(5, 'Bhuj Earthquake Relief Camp', 'Multi-Purpose', 1000, 100, '+91-2832-234567', 'Under Setup'),
(11, 'Hyderabad Heatwave Care Center', 'Medical', 400, 0, '+91-40-23456789', 'Closed'),
(10, 'Delhi NDMA Coordination Hub', 'Multi-Purpose', 250, 45, '+91-11-23456789', 'Active');

-- ============================================================
-- RESOURCE CATEGORIES
-- ============================================================
INSERT INTO resource_categories (category_name, description) VALUES
('Food & Nutrition', 'Essential food items, drinking water, and nutrition supplies'),
('Medical Supplies', 'Medicines, first aid, medical equipment'),
('Shelter & Clothing', 'Tents, blankets, clothing, sleeping bags'),
('Water & Sanitation', 'Water purification, toiletries, sanitation supplies'),
('Rescue Equipment', 'Search and rescue tools, safety equipment'),
('Communication', 'Radios, phones, communication devices'),
('Transportation Fuel', 'Petrol, diesel, and other fuels for vehicles'),
('Power & Lighting', 'Generators, solar panels, flashlights, batteries');

-- ============================================================
-- RESOURCES
-- ============================================================
INSERT INTO resources (category_id, resource_name, unit, description, minimum_stock) VALUES
(1, 'Rice (25kg Bag)', 'Bags', 'Premium quality rice for mass distribution', 100),
(1, 'Drinking Water (20L Can)', 'Cans', 'Sealed purified drinking water cans', 500),
(1, 'Ready-to-Eat Meals', 'Packets', 'Pre-packaged emergency meals', 200),
(1, 'Biscuits & Dry Food', 'Cartons', 'Assorted dry food items for emergencies', 150),
(2, 'First Aid Kit (Complete)', 'Kits', 'Comprehensive first aid kits for emergency use', 50),
(2, 'ORS Packets', 'Boxes', 'Oral rehydration salts for dehydration', 100),
(2, 'Paracetamol Tablets', 'Strips', '500mg paracetamol for fever and pain', 200),
(2, 'Blood Pressure Medicine', 'Boxes', 'Antihypertensive medications', 80),
(3, 'Emergency Tent (6-Person)', 'Units', 'Waterproof emergency tents for 6 persons', 30),
(3, 'Woolen Blankets', 'Pieces', 'Heavy-duty woolen blankets for relief', 200),
(3, 'Tarpaulin Sheets', 'Sheets', 'Heavy-duty waterproof tarpaulin for shelter', 100),
(4, 'Water Purification Tablets', 'Packets', 'Chlorine-based water purification tablets', 300),
(4, 'Portable Water Filter', 'Units', 'Portable water purification units for camps', 20),
(5, 'Life Jackets', 'Pieces', 'Approved life jackets for flood rescue', 50),
(5, 'Inflatable Rescue Boats', 'Units', 'Motorized inflatable boats for water rescue', 5),
(6, 'Walkie-Talkie Sets', 'Sets', 'Short-range communication radio sets', 20),
(7, 'Diesel (Barrel)', 'Barrels', 'High-speed diesel for generators and vehicles', 30),
(8, 'Portable Generator (5KVA)', 'Units', '5KVA diesel portable generator set', 10),
(8, 'Solar Lantern', 'Pieces', 'Solar-powered emergency lanterns', 100);

-- ============================================================
-- RESOURCE INVENTORY
-- ============================================================
INSERT INTO resource_inventory (resource_id, location_id, quantity_available) VALUES
(1, 10, 450), (1, 1, 320), (1, 7, 180),
(2, 10, 1200), (2, 1, 800), (2, 7, 450),
(3, 10, 600), (3, 1, 400), (3, 7, 200),
(4, 10, 200), (4, 1, 150),
(5, 10, 80), (5, 2, 45), (5, 7, 30),
(6, 10, 250), (6, 2, 120), (6, 1, 80),
(7, 10, 350), (7, 2, 180),
(8, 2, 60), (8, 10, 90),
(9, 10, 40), (9, 1, 25),
(10, 10, 300), (10, 1, 200), (10, 7, 150),
(11, 10, 120), (11, 1, 80),
(12, 10, 400), (12, 7, 200),
(13, 10, 15), (13, 1, 8),
(14, 1, 35), (14, 7, 20),
(15, 7, 3), (15, 1, 2),
(16, 10, 12), (16, 7, 8),
(17, 10, 25), (17, 1, 15),
(18, 10, 6), (18, 1, 4),
(19, 10, 80), (19, 7, 50), (19, 1, 30);

-- ============================================================
-- RESOURCE REQUESTS
-- ============================================================
INSERT INTO resource_requests (disaster_id, requester_id, resource_id, location_id, quantity_requested, priority, status) VALUES
(1, 2, 2, 1, 500, 'Critical', 'Approved'),
(1, 2, 1, 1, 200, 'High', 'Processing'),
(4, 3, 3, 7, 300, 'High', 'Pending'),
(6, 2, 5, 2, 25, 'Critical', 'Approved'),
(5, 3, 2, 9, 150, 'Medium', 'Delivered'),
(1, 2, 14, 1, 20, 'High', 'Pending'),
(6, 2, 15, 2, 2, 'Critical', 'Pending'),
(4, 3, 10, 7, 100, 'Medium', 'Approved');

-- ============================================================
-- RESOURCE DISTRIBUTION
-- ============================================================
INSERT INTO resource_distribution (resource_id, disaster_id, center_id, quantity_distributed, distributed_by) VALUES
(2, 1, 1, 300, 2),
(1, 1, 1, 150, 2),
(3, 4, 3, 200, 3),
(10, 1, 1, 100, 2),
(6, 6, 4, 50, 2),
(2, 5, 5, 100, 3),
(12, 4, 3, 150, 3);

-- ============================================================
-- VOLUNTEERS
-- ============================================================
INSERT INTO volunteers (user_id, skills, availability, verification_status) VALUES
(4, 'First Aid, Swimming, Search & Rescue, CPR Certified', 'Assigned', 'Verified'),
(5, 'Medical Assistance, Disaster Communication, Triage, Counselling', 'Available', 'Verified');

-- ============================================================
-- RESCUE OPERATIONS
-- ============================================================
INSERT INTO rescue_operations (disaster_id, location_id, operation_name, description, start_time, end_time, people_rescued, status, coordinator_id) VALUES
(1, 1, 'Operation Saviour - Bandra', 'Boat-based rescue of stranded residents in flooded residential areas of Bandra East', '2024-07-16 06:00:00', NULL, 234, 'Active', 2),
(4, 7, 'Operation Brahmaputra Shield', 'Mass evacuation of villages along the Brahmaputra river embankments', '2024-06-21 04:00:00', NULL, 1876, 'Active', 3),
(6, 2, 'Operation Wayanad Recovery', 'Search and rescue of survivors buried under landslide debris in Wayanad', '2024-07-31 05:00:00', NULL, 45, 'Active', 2),
(2, 4, 'Himachal Earthquake Response', 'Urban search and rescue in collapsed structures in Shimla district', '2024-06-10 14:00:00', '2024-06-20 18:00:00', 312, 'Completed', 3),
(7, 8, 'Cyclone Remal Coastal Rescue', 'Evacuation of fishing communities from cyclone-affected coastal areas', '2024-05-27 02:00:00', '2024-06-03 20:00:00', 5678, 'Completed', 2);

-- ============================================================
-- RELIEF TASKS
-- ============================================================
INSERT INTO relief_tasks (disaster_id, operation_id, task_name, description, priority, assigned_to, status, deadline) VALUES
(1, 1, 'Deploy Rescue Boats to Bandra East', 'Coordinate 10 inflatable boats for rescue operations in Bandra East sector', 'Critical', 4, 'In Progress', '2024-07-20 08:00:00'),
(1, 1, 'Medical Screening at Relief Camp', 'Set up medical triage and screening for arriving flood survivors', 'High', 5, 'In Progress', '2024-07-18 12:00:00'),
(4, 2, 'Food Distribution Guwahati Camp', 'Organize food packet distribution for 2000 evacuees at Guwahati center', 'High', 4, 'Assigned', '2024-06-25 10:00:00'),
(6, 3, 'Debris Clearance Wayanad', 'Coordinate JCB and manual debris clearance teams for site access', 'Critical', NULL, 'Pending', '2024-08-02 06:00:00'),
(5, NULL, 'Water Tanker Deployment Jaisalmer', 'Deploy water tankers to 15 drought-affected villages in Jaisalmer district', 'Medium', 5, 'Completed', '2024-04-30 10:00:00'),
(1, 1, 'Register Displaced Families', 'Door-to-door registration of displaced families in the relief camp', 'Medium', NULL, 'Pending', '2024-07-22 17:00:00');

-- ============================================================
-- VOLUNTEER ASSIGNMENTS
-- ============================================================
INSERT INTO volunteer_assignments (volunteer_id, disaster_id, task_id, start_time, end_time, status) VALUES
(1, 1, 1, '2024-07-16 08:00:00', NULL, 'Active'),
(2, 1, 2, '2024-07-16 10:00:00', NULL, 'Active'),
(1, 4, 3, '2024-06-22 09:00:00', NULL, 'Assigned'),
(2, 5, 5, '2024-03-05 08:00:00', '2024-04-30 17:00:00', 'Completed');

-- ============================================================
-- DONORS
-- ============================================================
INSERT INTO donors (donor_name, donor_type, email, phone, address) VALUES
('Tata Charitable Foundation', 'Corporate', 'csr@tatagroup.com', '+91-22-66657777', 'Bombay House, 24 Homi Mody Street, Mumbai'),
('Prime Minister National Relief Fund', 'Government', 'pmnrf@gov.in', '+91-11-23012312', 'Prime Minister Office, South Block, New Delhi'),
('Aishwarya Mehta', 'Individual', 'aishwarya.mehta@gmail.com', '+91-9988776655', 'Sector 14, Gurugram, Haryana'),
('Reliance Foundation', 'Corporate', 'foundation@ril.com', '+91-22-44779900', 'Maker Chambers, Nariman Point, Mumbai'),
('Infosys Foundation', 'Corporate', 'infosysfoundation@infosys.com', '+91-80-41167777', 'Electronics City, Bangalore'),
('Red Cross India', 'Organization', 'info@indianredcross.org', '+91-11-23716441', '1 Red Cross Road, New Delhi'),
('Azim Premji Foundation', 'Individual', 'info@azimpremjifoundation.org', '+91-80-66150000', 'Sarjapur Road, Bangalore');

-- ============================================================
-- DONATIONS
-- ============================================================
INSERT INTO donations (donor_id, disaster_id, resource_id, amount, quantity, donation_type, status) VALUES
(1, 1, NULL, 5000000.00, NULL, 'Monetary', 'Verified'),
(2, 4, NULL, 10000000.00, NULL, 'Monetary', 'Verified'),
(3, 1, 2, NULL, 200, 'Material', 'Received'),
(4, 6, NULL, 2500000.00, NULL, 'Monetary', 'Verified'),
(5, 1, 5, NULL, 50, 'Material', 'Received'),
(6, 4, 1, NULL, 500, 'Material', 'Pending'),
(7, 5, NULL, 1000000.00, NULL, 'Monetary', 'Verified'),
(1, 6, 10, NULL, 300, 'Material', 'Received'),
(3, NULL, NULL, 50000.00, NULL, 'Monetary', 'Pending'),
(4, 4, 3, NULL, 1000, 'Material', 'Verified');

-- ============================================================
-- TRANSPORTATION
-- ============================================================
INSERT INTO transportation (vehicle_number, vehicle_type, capacity, driver_name, driver_phone, availability_status) VALUES
('MH-01-AB-1234', 'Truck', 10000, 'Ganesh Bhosale', '+91-9876512345', 'In Use'),
('MH-03-CD-5678', 'Ambulance', 2, 'Deepak Salvi', '+91-9765432109', 'Available'),
('GJ-01-EF-9012', 'Helicopter', 8, 'Wing Cdr. Arjun Rao', '+91-9654321098', 'In Use'),
('AS-01-GH-3456', 'Bus', 50, 'Hemanta Kalita', '+91-9543210987', 'Available'),
('KL-07-IJ-7890', 'Boat', 15, 'Santhosh Kumar', '+91-9432109876', 'In Use'),
('DL-01-KL-2345', 'Van', 3000, 'Rajveer Singh', '+91-9321098765', 'Available'),
('TN-09-MN-6789', 'SUV', 8, 'Krishnaswamy Rajan', '+91-9210987654', 'Available'),
('WB-02-OP-0123', 'Truck', 8000, 'Subrata Mondal', '+91-9109876543', 'Under Maintenance'),
('RJ-14-QR-4567', 'Van', 2000, 'Bheru Lal Gurjar', '+91-9098765432', 'Available'),
('MH-05-ST-8901', 'Ambulance', 2, 'Sunil Pawar', '+91-9987654321', 'In Use');

-- ============================================================
-- TRANSPORT ASSIGNMENTS
-- ============================================================
INSERT INTO transport_assignments (vehicle_id, operation_id, source_location, destination_location, departure_time, arrival_time, status) VALUES
(1, 1, 'NDMA Warehouse, Delhi', 'Mumbai Bandra Relief Camp', '2024-07-16 06:00:00', '2024-07-17 14:00:00', 'Completed'),
(3, 3, 'Kozhikode Air Base', 'Wayanad Landslide Site', '2024-07-31 07:00:00', NULL, 'En Route'),
(5, 2, 'Guwahati Flood Camp', 'Majuli Island, Assam', '2024-06-22 05:00:00', NULL, 'En Route'),
(4, NULL, 'Hyderabad SDMA', 'Guwahati Flood Camp', '2024-06-24 08:00:00', '2024-06-26 20:00:00', 'Completed'),
(6, NULL, 'Delhi NDMA Warehouse', 'Jaisalmer Drought Camp', '2024-03-10 06:00:00', '2024-03-11 18:00:00', 'Completed');

-- ============================================================
-- MEDICAL FACILITIES
-- ============================================================
INSERT INTO medical_facilities (location_id, facility_name, facility_type, contact_number, available_beds, emergency_available, status) VALUES
(1, 'Lilavati Hospital Mumbai', 'Hospital', '+91-22-26751000', 45, TRUE, 'Active'),
(6, 'Government Royapettah Hospital', 'Hospital', '+91-44-28195566', 120, TRUE, 'Active'),
(2, 'Government Medical College Ernakulam', 'Trauma Center', '+91-484-2361441', 35, TRUE, 'Active'),
(4, 'AIIMS Rishikesh', 'Hospital', '+91-135-2462900', 200, TRUE, 'Active'),
(7, 'Gauhati Medical College', 'Hospital', '+91-361-2529457', 85, TRUE, 'Active'),
(9, 'Jaisalmer District Hospital', 'Hospital', '+91-2992-252453', 60, FALSE, 'Active'),
(10, 'AIIMS New Delhi', 'Trauma Center', '+91-11-26588500', 320, TRUE, 'Active'),
(1, 'Bandra Field Medical Unit', 'Field Medical Unit', '+91-22-26660000', 80, TRUE, 'Active'),
(2, 'Wayanad Field Hospital', 'Field Medical Unit', '+91-4936-202020', 50, TRUE, 'Active'),
(11, 'Hyderabad Heatstroke Center', 'Clinic', '+91-40-23456780', 30, FALSE, 'Closed');

-- ============================================================
-- MEDICAL CASES
-- ============================================================
INSERT INTO medical_cases (person_id, facility_id, disaster_id, case_type, injury_description, treatment, case_status, admission_date, discharge_date) VALUES
(6, 9, 6, 'Injury', 'Compound fractures in both legs due to landslide debris impact', 'Surgical intervention, external fixation, IV antibiotics', 'Under Treatment', '2024-07-31 10:30:00', NULL),
(7, 9, 6, 'Trauma', 'Severe head trauma with intracranial bleeding', 'Emergency craniotomy, ICU monitoring', 'Critical', '2024-07-31 09:00:00', NULL),
(11, 10, 8, 'Illness', 'Severe heatstroke with body temp 42.5°C, dehydration', 'Cooling therapy, IV fluids, electrolyte correction', 'Under Treatment', '2024-04-20 14:00:00', '2024-04-25 11:00:00'),
(12, 7, 8, 'Illness', 'Cardiac event triggered by extreme heat, angina episodes', 'Cardiac monitoring, beta-blockers, fluid management', 'Discharged', '2024-04-18 16:00:00', '2024-04-28 10:00:00'),
(3, 1, 1, 'Illness', 'Diabetic ketoacidosis triggered by stress and missed medication', 'Insulin drip, fluid replacement, blood glucose monitoring', 'Under Treatment', '2024-07-17 08:00:00', NULL),
(9, 4, 2, 'Injury', 'Minor lacerations on arms and contusion on chest from falling debris', 'Wound cleaning, bandaging, pain management', 'Discharged', '2024-06-11 12:00:00', '2024-06-14 09:00:00');

-- ============================================================
-- EMERGENCY CONTACTS
-- ============================================================
INSERT INTO emergency_contacts (location_id, service_name, service_type, contact_number, address, availability) VALUES
(10, 'National Disaster Response Force (NDRF)', 'Disaster Management', '011-24363260', 'NDRF HQ, New Delhi', '24/7'),
(10, 'National Emergency Number', 'Police', '112', 'All India Emergency Number', '24/7'),
(10, 'National Ambulance Service', 'Ambulance', '108', 'All India Ambulance Service', '24/7'),
(10, 'National Fire Emergency', 'Fire', '101', 'All India Fire Service', '24/7'),
(1, 'Mumbai Police Control', 'Police', '022-22621855', 'Mumbai Police HQ, Crawford Market', '24/7'),
(1, 'Mumbai Fire Brigade', 'Fire', '022-23075185', 'BrihanMumbai Municipal Corporation', '24/7'),
(1, 'MCGM Disaster Management', 'Disaster Management', '022-22694725', 'Municipal Corporation HQ Mumbai', '24/7'),
(7, 'Assam State Disaster Management', 'Disaster Management', '0361-2237219', 'ASDMA, Guwahati', '24/7'),
(2, 'Kerala Fire & Rescue Services', 'Fire', '0484-2372100', 'Ernakulam Fire Station', '24/7'),
(2, 'Kerala Coastguard Ernakulam', 'Search & Rescue', '0484-2668555', 'ICG Station, Ernakulam', '24/7'),
(6, 'Greater Chennai Corporation', 'Disaster Management', '044-25384444', 'Ripon Building, Chennai', '24/7'),
(5, 'Gujarat SDMA', 'Disaster Management', '079-23251900', 'Sachivalaya, Gandhinagar', '24/7'),
(11, 'Telangana SDMA', 'Disaster Management', '040-23454088', 'BRKR Bhavan, Hyderabad', '24/7'),
(9, 'Rajasthan Emergency Operations', 'Disaster Management', '0141-2227470', 'State EOC, Jaipur', 'Business Hours'),
(10, 'Flood Relief Helpline', 'Disaster Management', '1800-180-5999', 'NDMA Toll Free', '24/7');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT INTO notifications (user_id, disaster_id, title, message, notification_type, is_read) VALUES
(1, 1, 'Critical Flood Alert - Maharashtra', 'Maharashtra flooding has reached critical levels. Over 125,000 people displaced. Immediate resource mobilization required.', 'Disaster Alert', TRUE),
(2, 6, 'Wayanad Landslide - Urgent Resources Needed', 'Resource request #7 for rescue boats in Wayanad is awaiting approval. Critical situation.', 'Resource Request', FALSE),
(3, 4, 'New Task Assignment - Guwahati', 'You have been assigned Task #3: Food Distribution at Guwahati Camp. Report by 09:00 AM.', 'Volunteer Assignment', FALSE),
(4, 1, 'Task Update Required', 'Please update the status of Task #1: Deploy Rescue Boats. Coordination team awaiting update.', 'Volunteer Assignment', FALSE),
(1, NULL, 'Low Inventory Alert - Inflatable Boats', 'Inventory for Inflatable Rescue Boats (ID:15) is critically low. Only 5 units remaining across all depots.', 'Low Inventory', FALSE),
(2, 4, 'Rescue Operation Update', 'Operation Brahmaputra Shield has rescued 1,876 people so far. Additional boats requested.', 'Rescue Update', TRUE),
(1, 1, 'Donation Received', 'Tata Charitable Foundation has donated ₹50,00,000 for Maharashtra Flood relief.', 'Donation Update', TRUE),
(5, 6, 'Medical Emergency - Wayanad', 'Critical patient (Person ID: 7) admitted to Wayanad Field Hospital with severe head trauma. Blood type B+ required urgently.', 'Medical Emergency', FALSE),
(2, 1, 'Resource Request Approved', 'Your request for 500 Water Cans for Maharashtra Flood has been approved. Dispatch scheduled.', 'Request Approval', TRUE),
(1, NULL, 'New Volunteer Registration', 'Mohammed Ashraf has registered as a volunteer with medical skills. Pending verification.', 'General', FALSE);
