const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const c = require('../controllers/mainController');

// ── AUTH ─────────────────────────────────────────────────────
const { login, register, getMe } = require('../controllers/authController');
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authenticate, getMe);

// ── DASHBOARD ────────────────────────────────────────────────
router.get('/dashboard/stats', authenticate, c.getDashboardStats);

// ── DISASTERS ────────────────────────────────────────────────
router.get('/disasters', c.getDisasters);
router.get('/disasters/:id', c.getDisaster);
router.post('/disasters', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createDisaster);
router.put('/disasters/:id', authenticate, authorize('Admin', 'Disaster Coordinator'), c.updateDisaster);
router.delete('/disasters/:id', authenticate, authorize('Admin'), c.deleteDisaster);

// ── DISASTER TYPES ───────────────────────────────────────────
router.get('/disaster-types', c.getDisasterTypes);
router.post('/disaster-types', authenticate, authorize('Admin'), c.createDisasterType);

// ── LOCATIONS ────────────────────────────────────────────────
router.get('/locations', authenticate, c.getLocations);
router.post('/locations', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createLocation);
router.put('/locations/:id', authenticate, authorize('Admin'), c.updateLocation);
router.delete('/locations/:id', authenticate, authorize('Admin'), c.deleteLocation);

// ── AFFECTED AREAS ───────────────────────────────────────────
router.get('/affected-areas', authenticate, c.getAffectedAreas);

// ── AFFECTED PEOPLE ──────────────────────────────────────────
router.get('/affected-people', authenticate, c.getAffectedPeople);
router.post('/affected-people', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createAffectedPerson);
router.put('/affected-people/:id', authenticate, authorize('Admin', 'Disaster Coordinator'), c.updateAffectedPerson);
router.delete('/affected-people/:id', authenticate, authorize('Admin'), c.deleteAffectedPerson);

// ── RELIEF CENTERS ───────────────────────────────────────────
router.get('/relief-centers', c.getReliefCenters);
router.post('/relief-centers', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createReliefCenter);
router.put('/relief-centers/:id', authenticate, authorize('Admin', 'Disaster Coordinator'), c.updateReliefCenter);
router.delete('/relief-centers/:id', authenticate, authorize('Admin'), c.deleteReliefCenter);

// ── RESOURCE CATEGORIES ──────────────────────────────────────
router.get('/resource-categories', authenticate, c.getResourceCategories);
router.post('/resource-categories', authenticate, authorize('Admin'), c.createResourceCategory);

// ── RESOURCES ────────────────────────────────────────────────
router.get('/resources', authenticate, c.getResources);
router.post('/resources', authenticate, authorize('Admin'), c.createResource);
router.put('/resources/:id', authenticate, authorize('Admin'), c.updateResource);
router.delete('/resources/:id', authenticate, authorize('Admin'), c.deleteResource);

// ── INVENTORY ────────────────────────────────────────────────
router.get('/inventory', authenticate, c.getInventory);
router.post('/inventory', authenticate, authorize('Admin'), c.createInventory);
router.put('/inventory/:id', authenticate, authorize('Admin'), c.updateInventory);

// ── RESOURCE REQUESTS ────────────────────────────────────────
router.get('/resource-requests', authenticate, c.getResourceRequests);
router.post('/resource-requests', authenticate, c.createResourceRequest);
router.put('/resource-requests/:id', authenticate, authorize('Admin', 'Disaster Coordinator'), c.updateResourceRequest);

// ── RESOURCE DISTRIBUTION ────────────────────────────────────
router.get('/distributions', authenticate, c.getDistributions);
router.post('/distributions', authenticate, authorize('Admin', 'Disaster Coordinator'), c.distributeResource);

// ── VOLUNTEERS ───────────────────────────────────────────────
router.get('/volunteers', authenticate, c.getVolunteers);
router.put('/volunteers/:id', authenticate, authorize('Admin', 'Disaster Coordinator'), c.updateVolunteer);
router.get('/volunteer-assignments', authenticate, c.getVolunteerAssignments);
router.post('/volunteer-assignments', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createVolunteerAssignment);

// ── DONORS ───────────────────────────────────────────────────
router.get('/donors', authenticate, c.getDonors);
router.post('/donors', authenticate, c.createDonor);

// ── DONATIONS ────────────────────────────────────────────────
router.get('/donations', authenticate, c.getDonations);
router.post('/donations', authenticate, c.createDonation);
router.put('/donations/:id', authenticate, authorize('Admin'), c.updateDonation);

// ── RESCUE OPERATIONS ────────────────────────────────────────
router.get('/rescue-operations', authenticate, c.getRescueOperations);
router.post('/rescue-operations', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createRescueOperation);
router.put('/rescue-operations/:id', authenticate, authorize('Admin', 'Disaster Coordinator'), c.updateRescueOperation);
router.delete('/rescue-operations/:id', authenticate, authorize('Admin'), c.deleteRescueOperation);

// ── RELIEF TASKS ─────────────────────────────────────────────
router.get('/relief-tasks', authenticate, c.getReliefTasks);
router.post('/relief-tasks', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createReliefTask);
router.put('/relief-tasks/:id', authenticate, c.updateReliefTask);
router.delete('/relief-tasks/:id', authenticate, authorize('Admin'), c.deleteReliefTask);

// ── TRANSPORTATION ───────────────────────────────────────────
router.get('/vehicles', authenticate, c.getVehicles);
router.post('/vehicles', authenticate, authorize('Admin'), c.createVehicle);
router.put('/vehicles/:id', authenticate, authorize('Admin'), c.updateVehicle);
router.delete('/vehicles/:id', authenticate, authorize('Admin'), c.deleteVehicle);
router.get('/transport-assignments', authenticate, c.getTransportAssignments);
router.post('/transport-assignments', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createTransportAssignment);

// ── MEDICAL ──────────────────────────────────────────────────
router.get('/medical-facilities', c.getMedicalFacilities);
router.post('/medical-facilities', authenticate, authorize('Admin'), c.createMedicalFacility);
router.put('/medical-facilities/:id', authenticate, authorize('Admin'), c.updateMedicalFacility);
router.get('/medical-cases', authenticate, c.getMedicalCases);
router.post('/medical-cases', authenticate, authorize('Admin', 'Disaster Coordinator'), c.createMedicalCase);
router.put('/medical-cases/:id', authenticate, authorize('Admin', 'Disaster Coordinator'), c.updateMedicalCase);

// ── EMERGENCY CONTACTS ───────────────────────────────────────
router.get('/emergency-contacts', c.getEmergencyContacts);
router.post('/emergency-contacts', authenticate, authorize('Admin'), c.createEmergencyContact);
router.put('/emergency-contacts/:id', authenticate, authorize('Admin'), c.updateEmergencyContact);
router.delete('/emergency-contacts/:id', authenticate, authorize('Admin'), c.deleteEmergencyContact);

// ── NOTIFICATIONS ────────────────────────────────────────────
router.get('/notifications', authenticate, c.getNotifications);
router.put('/notifications/:id/read', authenticate, c.markNotificationRead);
router.put('/notifications/mark-all-read', authenticate, c.markAllNotificationsRead);
router.post('/notifications', authenticate, authorize('Admin'), c.createNotification);

// ── USERS ────────────────────────────────────────────────────
router.get('/users', authenticate, authorize('Admin'), c.getUsers);
router.put('/users/:id', authenticate, authorize('Admin'), c.updateUser);
router.delete('/users/:id', authenticate, authorize('Admin'), c.deleteUser);
router.get('/roles', authenticate, c.getRoles);

// ── REPORTS ──────────────────────────────────────────────────
router.get('/reports', authenticate, authorize('Admin', 'Disaster Coordinator'), c.getReports);

module.exports = router;
