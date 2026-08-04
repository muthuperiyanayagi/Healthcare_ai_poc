import { relations } from "drizzle-orm/relations";
import { users, doctorProfiles, sessions, medicalCodes, patients, patientDemographicAudit, redFlags, soapNotes, sessionConsents, auditLogs, doctorPatients, transcripts, userMfa, userConsents, soapAuditLog, staffProfiles, denialPredictions, apiClients, usageLogs, reports } from "./schema";

export const doctorProfilesRelations = relations(doctorProfiles, ({one}) => ({
	user: one(users, {
		fields: [doctorProfiles.doctorId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	doctorProfiles: many(doctorProfiles),
	medicalCodes: many(medicalCodes),
	patientDemographicAudits: many(patientDemographicAudit),
	redFlags_acknowledgedById: many(redFlags, {
		relationName: "redFlags_acknowledgedById_users_id"
	}),
	redFlags_doctorId: many(redFlags, {
		relationName: "redFlags_doctorId_users_id"
	}),
	redFlags_resolvedById: many(redFlags, {
		relationName: "redFlags_resolvedById_users_id"
	}),
	sessions: many(sessions),
	sessionConsents: many(sessionConsents),
	auditLogs_doctorId: many(auditLogs, {
		relationName: "auditLogs_doctorId_users_id"
	}),
	auditLogs_performedBy: many(auditLogs, {
		relationName: "auditLogs_performedBy_users_id"
	}),
	auditLogs_targetUserId: many(auditLogs, {
		relationName: "auditLogs_targetUserId_users_id"
	}),
	doctorPatients_createdByDoctorId: many(doctorPatients, {
		relationName: "doctorPatients_createdByDoctorId_users_id"
	}),
	doctorPatients_doctorId: many(doctorPatients, {
		relationName: "doctorPatients_doctorId_users_id"
	}),
	patients_createdByDoctorId: many(patients, {
		relationName: "patients_createdByDoctorId_users_id"
	}),
	patients_updatedById: many(patients, {
		relationName: "patients_updatedById_users_id"
	}),
	userMfas: many(userMfa),
	userConsents: many(userConsents),
	soapNotes_createdById: many(soapNotes, {
		relationName: "soapNotes_createdById_users_id"
	}),
	soapNotes_editedById: many(soapNotes, {
		relationName: "soapNotes_editedById_users_id"
	}),
	soapAuditLogs: many(soapAuditLog),
	staffProfiles: many(staffProfiles),
	reports_uploadedById: many(reports, {
		relationName: "reports_uploadedById_users_id"
	}),
	reports_analyzedById: many(reports, {
		relationName: "reports_analyzedById_users_id"
	}),
}));

export const medicalCodesRelations = relations(medicalCodes, ({one}) => ({
	session: one(sessions, {
		fields: [medicalCodes.sessionId],
		references: [sessions.id]
	}),
	user: one(users, {
		fields: [medicalCodes.validatedById],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one, many}) => ({
	medicalCodes: many(medicalCodes),
	redFlags: many(redFlags),
	user: one(users, {
		fields: [sessions.doctorId],
		references: [users.id]
	}),
	patient: one(patients, {
		fields: [sessions.patientId],
		references: [patients.id]
	}),
	sessionConsents: many(sessionConsents),
	auditLogs: many(auditLogs),
	transcripts: many(transcripts),
	soapNotes: many(soapNotes),
	soapAuditLogs: many(soapAuditLog),
	denialPredictions: many(denialPredictions),
	reports: many(reports),
}));

export const patientDemographicAuditRelations = relations(patientDemographicAudit, ({one}) => ({
	patient: one(patients, {
		fields: [patientDemographicAudit.patientId],
		references: [patients.id]
	}),
	user: one(users, {
		fields: [patientDemographicAudit.updatedByUserId],
		references: [users.id]
	}),
}));

export const patientsRelations = relations(patients, ({one, many}) => ({
	patientDemographicAudits: many(patientDemographicAudit),
	redFlags: many(redFlags),
	sessions: many(sessions),
	auditLogs: many(auditLogs),
	doctorPatients: many(doctorPatients),
	user_createdByDoctorId: one(users, {
		fields: [patients.createdByDoctorId],
		references: [users.id],
		relationName: "patients_createdByDoctorId_users_id"
	}),
	user_updatedById: one(users, {
		fields: [patients.updatedById],
		references: [users.id],
		relationName: "patients_updatedById_users_id"
	}),
}));

export const redFlagsRelations = relations(redFlags, ({one}) => ({
	user_acknowledgedById: one(users, {
		fields: [redFlags.acknowledgedById],
		references: [users.id],
		relationName: "redFlags_acknowledgedById_users_id"
	}),
	user_doctorId: one(users, {
		fields: [redFlags.doctorId],
		references: [users.id],
		relationName: "redFlags_doctorId_users_id"
	}),
	patient: one(patients, {
		fields: [redFlags.patientId],
		references: [patients.id]
	}),
	user_resolvedById: one(users, {
		fields: [redFlags.resolvedById],
		references: [users.id],
		relationName: "redFlags_resolvedById_users_id"
	}),
	session: one(sessions, {
		fields: [redFlags.sessionId],
		references: [sessions.id]
	}),
	soapNote: one(soapNotes, {
		fields: [redFlags.soapNoteId],
		references: [soapNotes.id]
	}),
}));

export const soapNotesRelations = relations(soapNotes, ({one, many}) => ({
	redFlags: many(redFlags),
	auditLogs: many(auditLogs),
	user_createdById: one(users, {
		fields: [soapNotes.createdById],
		references: [users.id],
		relationName: "soapNotes_createdById_users_id"
	}),
	user_editedById: one(users, {
		fields: [soapNotes.editedById],
		references: [users.id],
		relationName: "soapNotes_editedById_users_id"
	}),
	session: one(sessions, {
		fields: [soapNotes.sessionId],
		references: [sessions.id]
	}),
}));

export const sessionConsentsRelations = relations(sessionConsents, ({one}) => ({
	user: one(users, {
		fields: [sessionConsents.consentedByUserId],
		references: [users.id]
	}),
	session: one(sessions, {
		fields: [sessionConsents.sessionId],
		references: [sessions.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user_doctorId: one(users, {
		fields: [auditLogs.doctorId],
		references: [users.id],
		relationName: "auditLogs_doctorId_users_id"
	}),
	patient: one(patients, {
		fields: [auditLogs.patientId],
		references: [patients.id]
	}),
	user_performedBy: one(users, {
		fields: [auditLogs.performedBy],
		references: [users.id],
		relationName: "auditLogs_performedBy_users_id"
	}),
	session: one(sessions, {
		fields: [auditLogs.sessionId],
		references: [sessions.id]
	}),
	soapNote: one(soapNotes, {
		fields: [auditLogs.soapNoteId],
		references: [soapNotes.id]
	}),
	user_targetUserId: one(users, {
		fields: [auditLogs.targetUserId],
		references: [users.id],
		relationName: "auditLogs_targetUserId_users_id"
	}),
}));

export const doctorPatientsRelations = relations(doctorPatients, ({one}) => ({
	user_createdByDoctorId: one(users, {
		fields: [doctorPatients.createdByDoctorId],
		references: [users.id],
		relationName: "doctorPatients_createdByDoctorId_users_id"
	}),
	user_doctorId: one(users, {
		fields: [doctorPatients.doctorId],
		references: [users.id],
		relationName: "doctorPatients_doctorId_users_id"
	}),
	patient: one(patients, {
		fields: [doctorPatients.patientId],
		references: [patients.id]
	}),
}));

export const transcriptsRelations = relations(transcripts, ({one}) => ({
	session: one(sessions, {
		fields: [transcripts.sessionId],
		references: [sessions.id]
	}),
}));

export const userMfaRelations = relations(userMfa, ({one}) => ({
	user: one(users, {
		fields: [userMfa.userId],
		references: [users.id]
	}),
}));

export const userConsentsRelations = relations(userConsents, ({one}) => ({
	user: one(users, {
		fields: [userConsents.userId],
		references: [users.id]
	}),
}));

export const soapAuditLogRelations = relations(soapAuditLog, ({one}) => ({
	session: one(sessions, {
		fields: [soapAuditLog.sessionId],
		references: [sessions.id]
	}),
	user: one(users, {
		fields: [soapAuditLog.userId],
		references: [users.id]
	}),
}));

export const staffProfilesRelations = relations(staffProfiles, ({one}) => ({
	user: one(users, {
		fields: [staffProfiles.userId],
		references: [users.id]
	}),
}));

export const denialPredictionsRelations = relations(denialPredictions, ({one}) => ({
	session: one(sessions, {
		fields: [denialPredictions.sessionId],
		references: [sessions.id]
	}),
}));

export const usageLogsRelations = relations(usageLogs, ({one}) => ({
	apiClient: one(apiClients, {
		fields: [usageLogs.clientId],
		references: [apiClients.id]
	}),
}));

export const apiClientsRelations = relations(apiClients, ({many}) => ({
	usageLogs: many(usageLogs),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	session: one(sessions, {
		fields: [reports.sessionId],
		references: [sessions.id]
	}),
	user_uploadedById: one(users, {
		fields: [reports.uploadedById],
		references: [users.id],
		relationName: "reports_uploadedById_users_id"
	}),
	user_analyzedById: one(users, {
		fields: [reports.analyzedById],
		references: [users.id],
		relationName: "reports_analyzedById_users_id"
	}),
}));