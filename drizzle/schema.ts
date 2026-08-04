import { pgTable, varchar, foreignKey, uuid, date, text, timestamp, index, integer, boolean, jsonb, check, unique, uniqueIndex, doublePrecision, json, serial, pgView, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const alembicVersion = pgTable("alembic_version", {
	versionNum: varchar("version_num", { length: 32 }).primaryKey().notNull(),
});

export const appSettings = pgTable("app_settings", {
	key: varchar({ length: 255 }).primaryKey().notNull(),
	value: varchar({ length: 255 }).notNull(),
});

export const doctorProfiles = pgTable("doctor_profiles", {
	doctorId: uuid("doctor_id").primaryKey().notNull(),
	dateOfBirth: date("date_of_birth"),
	educationalQualification: varchar("educational_qualification", { length: 500 }),
	specialization: varchar({ length: 255 }),
	licenseNumber: varchar("license_number", { length: 255 }),
	clinicHospitalName: varchar("clinic_hospital_name", { length: 255 }),
	clinicHospitalAddress: text("clinic_hospital_address"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	licenseIssuingAuthority: varchar("license_issuing_authority", { length: 255 }),
	licenseExpiryDate: date("license_expiry_date"),
	licenseVerificationStatus: varchar("license_verification_status", { length: 50 }),
}, (table) => [
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [users.id],
			name: "doctor_profiles_doctor_id_fkey"
		}).onDelete("cascade"),
]);

export const cptCodes = pgTable("cpt_codes", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	description: text().notNull(),
	category: varchar({ length: 100 }),
}, (table) => [
	index("idx_cpt_codes_description").using("gin", sql`to_tsvector('english'::regconfig, description)`),
]);

export const medicalCodes = pgTable("medical_codes", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	code: varchar({ length: 64 }).notNull(),
	description: varchar({ length: 512 }),
	codeType: varchar("code_type", { length: 32 }).notNull(),
	status: varchar({ length: 32 }).default('draft').notNull(),
	confidence: integer(),
	validatedById: uuid("validated_by_id"),
	validatedAt: timestamp("validated_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	sourceText: text("source_text"),
	verified: boolean().default(false),
	isLowConfidence: boolean("is_low_confidence").default(false),
	editedCode: varchar("edited_code", { length: 50 }),
	editedDescription: text("edited_description"),
}, (table) => [
	index("idx_medical_codes_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_medical_codes_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "medical_codes_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.validatedById],
			foreignColumns: [users.id],
			name: "medical_codes_validated_by_id_fkey"
		}).onDelete("set null"),
]);

export const icd10Codes = pgTable("icd10_codes", {
	code: varchar({ length: 10 }).primaryKey().notNull(),
	description: text().notNull(),
}, (table) => [
	index("idx_icd10_codes_description").using("gin", sql`to_tsvector('english'::regconfig, description)`),
]);

export const patientDemographicAudit = pgTable("patient_demographic_audit", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	patientId: uuid("patient_id").notNull(),
	fieldName: varchar("field_name", { length: 64 }).notNull(),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	updatedByUserId: uuid("updated_by_user_id"),
	updatedByRole: varchar("updated_by_role", { length: 50 }).notNull(),
	changedAt: timestamp("changed_at", { withTimezone: true, mode: 'string' }).default(sql`(now() AT TIME ZONE 'UTC'::text)`).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => [
	index("idx_patient_demographic_audit_changed_at").using("btree", table.changedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_patient_demographic_audit_patient_id").using("btree", table.patientId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.id],
			name: "patient_demographic_audit_patient_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updatedByUserId],
			foreignColumns: [users.id],
			name: "patient_demographic_audit_updated_by_user_id_fkey"
		}).onDelete("set null"),
]);

export const redFlags = pgTable("red_flags", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	patientId: uuid("patient_id"),
	doctorId: uuid("doctor_id").notNull(),
	soapNoteId: uuid("soap_note_id"),
	type: varchar({ length: 64 }).notNull(),
	severity: varchar({ length: 32 }).notNull(),
	title: varchar({ length: 255 }),
	message: text().notNull(),
	status: varchar({ length: 32 }).default('new').notNull(),
	detectedAt: timestamp("detected_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true, mode: 'string' }),
	acknowledgedById: uuid("acknowledged_by_id"),
	resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }),
	resolvedById: uuid("resolved_by_id"),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_red_flags_detected_at").using("btree", table.detectedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_red_flags_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_red_flags_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.acknowledgedById],
			foreignColumns: [users.id],
			name: "red_flags_acknowledged_by_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [users.id],
			name: "red_flags_doctor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.id],
			name: "red_flags_patient_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.resolvedById],
			foreignColumns: [users.id],
			name: "red_flags_resolved_by_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "red_flags_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.soapNoteId],
			foreignColumns: [soapNotes.id],
			name: "red_flags_soap_note_id_fkey"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	doctorId: uuid("doctor_id").notNull(),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	patientEmail: varchar("patient_email", { length: 255 }),
	patientAge: integer("patient_age"),
	patientGender: varchar("patient_gender", { length: 50 }),
	status: varchar({ length: 50 }).notNull(),
	startTime: timestamp("start_time", { mode: 'string' }),
	endTime: timestamp("end_time", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	patientId: uuid("patient_id"),
	lastAudioAt: timestamp("last_audio_at", { mode: 'string' }),
	lastHeartbeatAt: timestamp("last_heartbeat_at", { mode: 'string' }),
	chiefComplaint: varchar("chief_complaint", { length: 500 }),
	sessionType: varchar("session_type", { length: 50 }),
	aiGenerating: boolean("ai_generating").default(false).notNull(),
	patientDobAtVisit: date("patient_dob_at_visit"),
	patientMrnAtVisit: varchar("patient_mrn_at_visit", { length: 64 }),
	patientAddressAtVisit: varchar("patient_address_at_visit", { length: 1000 }),
	codingStatus: varchar("coding_status", { length: 20 }).default('pending'),
	codingStartedAt: timestamp("coding_started_at", { mode: 'string' }),
	codingCompletedAt: timestamp("coding_completed_at", { mode: 'string' }),
	codingError: text("coding_error"),
}, (table) => [
	index("idx_sessions_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_sessions_doctor_id").using("btree", table.doctorId.asc().nullsLast().op("uuid_ops")),
	index("idx_sessions_patient_id").using("btree", table.patientId.asc().nullsLast().op("uuid_ops")),
	index("idx_sessions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [users.id],
			name: "sessions_doctor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.id],
			name: "sessions_patient_id_fkey"
		}).onDelete("set null"),
	check("sessions_status_check", sql`(status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('PROCESSING'::character varying)::text, ('REVIEW'::character varying)::text, ('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text])`),
]);

export const sessionConsents = pgTable("session_consents", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	consentedByUserId: uuid("consented_by_user_id"),
	consentedAt: timestamp("consented_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	consentType: varchar("consent_type", { length: 50 }).default('telehealth').notNull(),
}, (table) => [
	index("idx_session_consents_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.consentedByUserId],
			foreignColumns: [users.id],
			name: "session_consents_consented_by_user_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "session_consents_session_id_fkey"
		}).onDelete("cascade"),
]);

export const requestMetrics = pgTable("request_metrics", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	path: text().notNull(),
	method: varchar({ length: 10 }).notNull(),
	statusCode: integer("status_code").notNull(),
	durationMs: integer("duration_ms").notNull(),
	userRole: varchar("user_role", { length: 50 }),
	meta: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`(now() AT TIME ZONE 'UTC'::text)`).notNull(),
}, (table) => [
	index("idx_request_metrics_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_request_metrics_method").using("btree", table.method.asc().nullsLast().op("text_ops")),
	index("idx_request_metrics_path").using("btree", table.path.asc().nullsLast().op("text_ops")),
]);

export const rxnormCodes = pgTable("rxnorm_codes", {
	rxcui: varchar({ length: 20 }).primaryKey().notNull(),
	name: text().notNull(),
	tty: varchar({ length: 10 }),
}, (table) => [
	index("idx_rxnorm_codes_name").using("gin", sql`to_tsvector('english'::regconfig, name)`),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sessionId: uuid("session_id"),
	action: varchar({ length: 255 }).notNull(),
	entity: varchar({ length: 50 }).notNull(),
	performedBy: uuid("performed_by"),
	role: varchar({ length: 50 }).notNull(),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	doctorId: uuid("doctor_id"),
	patientId: uuid("patient_id"),
	soapNoteId: uuid("soap_note_id"),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	outcome: varchar({ length: 32 }),
	errorCode: varchar("error_code", { length: 100 }),
	errorMessage: text("error_message"),
	targetUserId: uuid("target_user_id"),
	exportType: varchar("export_type", { length: 50 }),
	recordCount: integer("record_count"),
	exportScope: varchar("export_scope", { length: 255 }),
	requestId: varchar("request_id", { length: 100 }),
	environment: varchar({ length: 50 }),
}, (table) => [
	index("idx_audit_logs_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_audit_logs_doctor_id").using("btree", table.doctorId.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_logs_outcome").using("btree", table.outcome.asc().nullsLast().op("text_ops")),
	index("idx_audit_logs_patient_id").using("btree", table.patientId.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_logs_performed_by").using("btree", table.performedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_logs_request_id").using("btree", table.requestId.asc().nullsLast().op("text_ops")),
	index("idx_audit_logs_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_audit_logs_soap_note_id").using("btree", table.soapNoteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [users.id],
			name: "audit_logs_doctor_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.id],
			name: "audit_logs_patient_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.performedBy],
			foreignColumns: [users.id],
			name: "audit_logs_performed_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "audit_logs_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.soapNoteId],
			foreignColumns: [soapNotes.id],
			name: "audit_logs_soap_note_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [users.id],
			name: "audit_logs_target_user_id_fkey"
		}).onDelete("set null"),
]);

export const doctorPatients = pgTable("doctor_patients", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	doctorId: uuid("doctor_id").notNull(),
	patientId: uuid("patient_id").notNull(),
	createdByDoctorId: uuid("created_by_doctor_id").notNull(),
	firstSessionDate: timestamp("first_session_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_doctor_patients_doctor_id").using("btree", table.doctorId.asc().nullsLast().op("uuid_ops")),
	index("idx_doctor_patients_patient_id").using("btree", table.patientId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.createdByDoctorId],
			foreignColumns: [users.id],
			name: "doctor_patients_created_by_doctor_id_fkey"
		}),
	foreignKey({
			columns: [table.doctorId],
			foreignColumns: [users.id],
			name: "doctor_patients_doctor_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [patients.id],
			name: "doctor_patients_patient_id_fkey"
		}).onDelete("cascade"),
	unique("uq_doctor_patient").on(table.doctorId, table.patientId),
]);

export const patients = pgTable("patients", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	gender: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdByDoctorId: uuid("created_by_doctor_id"),
	dateOfBirth: date("date_of_birth"),
	address: varchar({ length: 500 }),
	addressLine2: varchar("address_line2", { length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	zipCode: varchar("zip_code", { length: 20 }),
	medicalRecordNumber: varchar("medical_record_number", { length: 64 }),
	healthId: varchar("health_id", { length: 32 }),
	healthIdAddress: varchar("health_id_address", { length: 100 }),
	aadhaarNumber: varchar("aadhaar_number", { length: 20 }),
	updatedById: uuid("updated_by_id"),
	country: varchar({ length: 100 }),
	phoneNumber: varchar("phone_number", { length: 30 }),
	phoneNumberType: varchar("phone_number_type", { length: 20 }),
	preferredLanguage: varchar("preferred_language", { length: 50 }),
	race: varchar({ length: 100 }),
	ethnicity: varchar({ length: 100 }),
}, (table) => [
	index("idx_patients_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("idx_patients_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_patients_health_id").using("btree", table.healthId.asc().nullsLast().op("text_ops")),
	index("idx_patients_mrn").using("btree", table.medicalRecordNumber.asc().nullsLast().op("text_ops")),
	index("idx_patients_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdByDoctorId],
			foreignColumns: [users.id],
			name: "patients_created_by_doctor_id_fkey"
		}),
	foreignKey({
			columns: [table.updatedById],
			foreignColumns: [users.id],
			name: "patients_updated_by_id_fkey"
		}).onDelete("set null"),
	unique("patients_email_key").on(table.email),
]);

export const transcripts = pgTable("transcripts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	speaker: varchar({ length: 50 }),
	speakerRaw: varchar("speaker_raw", { length: 50 }),
	text: text().notNull(),
	startTimeMs: integer("start_time_ms"),
	endTimeMs: integer("end_time_ms"),
	confidence: doublePrecision(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_transcripts_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_transcripts_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "transcripts_session_id_fkey"
		}).onDelete("cascade"),
]);

export const userMfa = pgTable("user_mfa", {
	userId: uuid("user_id").primaryKey().notNull(),
	secretEncrypted: text("secret_encrypted"),
	mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
	backupCodesHashed: jsonb("backup_codes_hashed"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_mfa_user_id_fkey"
		}).onDelete("cascade"),
]);

export const userConsents = pgTable("user_consents", {
	userId: uuid("user_id").primaryKey().notNull(),
	serviceConsent: boolean("service_consent").default(true).notNull(),
	marketingConsent: boolean("marketing_consent").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	cookieConsentAcceptedAt: timestamp("cookie_consent_accepted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_consents_user_id_fkey"
		}).onDelete("cascade"),
]);

export const soapNotes = pgTable("soap_notes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	subjective: text(),
	objective: text(),
	assessment: text(),
	plan: text(),
	generatedBy: varchar("generated_by", { length: 50 }).default('gemini'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	version: integer().default(1).notNull(),
	source: varchar({ length: 50 }).default('generated'),
	createdById: uuid("created_by_id"),
	editedById: uuid("edited_by_id"),
	editedAt: timestamp("edited_at", { mode: 'string' }),
	confidenceScore: integer("confidence_score"),
	summaryReadiness: varchar("summary_readiness", { length: 50 }),
	alerts: jsonb(),
	noteState: varchar("note_state", { length: 32 }).default('draft').notNull(),
	accuracyPct: integer("accuracy_pct"),
}, (table) => [
	index("idx_soap_notes_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("uq_soap_notes_session_version").using("btree", table.sessionId.asc().nullsLast().op("int4_ops"), table.version.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "soap_notes_created_by_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.editedById],
			foreignColumns: [users.id],
			name: "soap_notes_edited_by_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "soap_notes_session_id_fkey"
		}).onDelete("cascade"),
]);

export const soapAuditLog = pgTable("soap_audit_log", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	sessionId: uuid("session_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	meta: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
}, (table) => [
	index("idx_soap_audit_log_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_soap_audit_log_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "soap_audit_log_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "soap_audit_log_user_id_fkey"
		}).onDelete("set null"),
]);

export const staffProfiles = pgTable("staff_profiles", {
	userId: uuid("user_id").primaryKey().notNull(),
	jobTitle: varchar("job_title", { length: 255 }),
	department: varchar({ length: 100 }),
	workPhone: varchar("work_phone", { length: 30 }),
	employeeId: varchar("employee_id", { length: 64 }),
	credentials: varchar({ length: 255 }),
	credentialingOrganization: varchar("credentialing_organization", { length: 100 }),
	credentialExpiryDate: date("credential_expiry_date"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "staff_profiles_user_id_fkey"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	adminRole: varchar("admin_role", { length: 30 }).default(sql`NULL`),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	unique("users_email_key").on(table.email),
	check("users_role_check", sql`(role)::text = ANY (ARRAY[('admin'::character varying)::text, ('reviewer'::character varying)::text, ('compliance_officer'::character varying)::text, ('doctor'::character varying)::text, ('coder'::character varying)::text])`),
]);

export const denialPredictions = pgTable("denial_predictions", {
	id: uuid().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	denialProbability: doublePrecision("denial_probability").notNull(),
	riskLevel: varchar("risk_level", { length: 20 }).notNull(),
	potentialReasonCodes: json("potential_reason_codes").notNull(),
	suggestedModifications: json("suggested_modifications").notNull(),
	analysisSummary: text("analysis_summary"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ix_denial_predictions_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("ix_denial_predictions_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "fk_denial_predictions_session_id_sessions"
		}).onDelete("cascade"),
]);

export const apiClients = pgTable("api_clients", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	hashedKey: varchar("hashed_key", { length: 255 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	notes: text(),
}, (table) => [
	unique("uq_api_clients_hashed_key").on(table.hashedKey),
]);

export const usageLogs = pgTable("usage_logs", {
	id: serial().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	endpoint: varchar({ length: 64 }).notNull(),
	calledAt: timestamp("called_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	requestId: varchar("request_id", { length: 64 }),
	responseStatus: integer("response_status"),
}, (table) => [
	index("idx_usage_called_at").using("btree", table.calledAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_usage_client_id").using("btree", table.clientId.asc().nullsLast().op("uuid_ops")),
	index("idx_usage_endpoint").using("btree", table.endpoint.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [apiClients.id],
			name: "fk_usage_logs_client_id_api_clients"
		}).onDelete("cascade"),
]);

export const reports = pgTable("reports", {
	id: uuid().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	blobPath: varchar("blob_path", { length: 500 }),
	summary: text(),
	keyFindings: text("key_findings"),
	recommendations: text(),
	riskFlags: text("risk_flags"),
	rawExtractedText: text("raw_extracted_text"),
	uploadedById: uuid("uploaded_by_id"),
	analyzedById: uuid("analyzed_by_id"),
	status: varchar({ length: 50 }).default('pending').notNull(),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	analyzedAt: timestamp("analyzed_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_reports_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_reports_session_id").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("idx_reports_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessions.id],
			name: "fk_reports_session_id_sessions"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedById],
			foreignColumns: [users.id],
			name: "fk_reports_uploaded_by_id_users"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.analyzedById],
			foreignColumns: [users.id],
			name: "fk_reports_analyzed_by_id_users"
		}).onDelete("set null"),
]);
export const monthlyUsage = pgView("monthly_usage", {	clientId: uuid("client_id"),
	clientName: varchar("client_name", { length: 255 }),
	endpoint: varchar({ length: 64 }),
	billingMonth: timestamp("billing_month", { withTimezone: true, mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalCalls: bigint("total_calls", { mode: "number" }),
}).as(sql`SELECT c.id AS client_id, c.name AS client_name, ul.endpoint, date_trunc('month'::text, ul.called_at) AS billing_month, count(*) AS total_calls FROM usage_logs ul JOIN api_clients c ON c.id = ul.client_id GROUP BY c.id, c.name, ul.endpoint, (date_trunc('month'::text, ul.called_at))`);

export const encounters = pgTable("encounters", {
	id: varchar({ length: 64 }).primaryKey().notNull(),
	patientId: varchar("patient_id", { length: 64 }).notNull(),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	age: integer().notNull(),
	gender: varchar({ length: 50 }).notNull(),
	chiefComplaint: text("chief_complaint").notNull(),
	historyOfPresentIllness: text("history_of_present_illness").notNull(),
	pastMedicalHistory: text("past_medical_history").notNull(),
	medications: text().notNull(),
	allergies: text().notNull(),
	vitals: text().notNull(),
	examFindings: text("exam_findings").notNull(),
	labs: text().notNull(),
	assessmentNotes: text("assessment_notes").notNull(),
	status: varchar({ length: 50 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	documentation: jsonb(),
	coding: jsonb(),
	cds: jsonb(),
	aiConfidence: doublePrecision("ai_confidence"),
	documentationQuality: doublePrecision("documentation_quality"),
	timeSavedMinutes: integer("time_saved_minutes"),
	claimReadinessDetail: jsonb("claim_readiness_detail"),
	denialRisk: jsonb("denial_risk"),
	revenuePrediction: jsonb("revenue_prediction"),
	careGaps: jsonb("care_gaps"),
	priorAuth: jsonb("prior_auth"),
	productivity: jsonb("productivity"),
	executiveSummary: jsonb("executive_summary"),
});