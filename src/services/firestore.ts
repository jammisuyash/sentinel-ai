import {
  getIncidentsCollection,
  addIncidentToFirestore,
  updateIncidentInFirestore,
  deleteIncidentFromFirestore,
  getHospitalsCollection,
  addHospitalToSupabase,
  updateHospitalInFirestore,
  getSheltersCollection,
  addShelterToSupabase,
  updateShelterInFirestore,
  getResourcesCollection,
  addResourceToFirestore,
  updateResourceInFirestore,
  getVolunteersCollection,
  addVolunteerToFirestore,
  updateVolunteerInFirestore,
  getAssignmentsCollection,
  addAssignment,
  updateAssignment,
  getReportsCollection,
  addReportToFirestore,
  getNotificationsCollection,
  addNotificationToFirestore,
  updateNotificationInFirestore,
  getUserProfilesCollection,
  createUserProfileInFirestore,
  type Resource
} from '../lib/supabase';

export {
  getIncidentsCollection,
  addIncidentToFirestore,
  updateIncidentInFirestore,
  deleteIncidentFromFirestore,
  getHospitalsCollection,
  addHospitalToSupabase,
  updateHospitalInFirestore,
  getSheltersCollection,
  addShelterToSupabase,
  updateShelterInFirestore,
  getResourcesCollection,
  addResourceToFirestore,
  updateResourceInFirestore,
  getVolunteersCollection,
  addVolunteerToFirestore,
  updateVolunteerInFirestore,
  getAssignmentsCollection,
  addAssignment,
  updateAssignment,
  getReportsCollection,
  addReportToFirestore,
  getNotificationsCollection,
  addNotificationToFirestore,
  updateNotificationInFirestore,
  getUserProfilesCollection,
  createUserProfileInFirestore
};

export async function getOperationalSnapshot() {
  const [incidents, hospitals, shelters, resources, volunteers, reports, notifications, assignments] = await Promise.all([
    getIncidentsCollection(),
    getHospitalsCollection(),
    getSheltersCollection(),
    getResourcesCollection(),
    getVolunteersCollection(),
    getReportsCollection(),
    getNotificationsCollection(),
    getAssignmentsCollection()
  ]);

  return {
    incidents,
    hospitals,
    shelters,
    resources,
    volunteers,
    reports,
    notifications,
    assignments
  };
}

export async function addResource(resource: Omit<Resource, 'id'>) {
  return addResourceToFirestore(resource);
}
