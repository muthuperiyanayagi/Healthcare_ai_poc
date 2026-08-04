-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "alembic_version" (
	"version_num" varchar(32) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_profiles" (
	"doctor_id" uuid PRIMARY KEY NOT NULL,
	"date_of_birth" date,
	"educational_qualification" varchar(500),
	"specialization" varchar(255),
	"license_number" varchar(255),
	"clinic_hospital_name" varchar(255),
	"clinic_hospital_address" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"license_issuing_authority" varchar(255),
	"license_expiry_date" date,
	"license_verification_status" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "cpt_codes" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "medical_codes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"session_id" uuid NOT NULL,
	"code" varchar(64) NOT NULL,
	"description" varchar(512),
	"code_type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"confidence" integer,
	"validated_by_id" uuid,
	"validated_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"source_text" text,
	"verified" boolean DEFAULT false,
	"is_low_confidence" boolean DEFAULT false,
	"edited_code" varchar(50),
	"edited_description" text
);
--> statement-breakpoint
CREATE TABLE "icd10_codes" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_demographic_audit" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"patient_id" uuid NOT NULL,
	"field_name" varchar(64) NOT NULL,
	"old_value" text,
	"new_value" text,
	"updated_by_user_id" uuid,
	"updated_by_role" varchar(50) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "red_flags" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"session_id" uuid NOT NULL,
	"patient_id" uuid,
	"doctor_id" uuid NOT NULL,
	"soap_note_id" uuid,
	"type" varchar(64) NOT NULL,
	"severity" varchar(32) NOT NULL,
	"title" varchar(255),
	"message" text NOT NULL,
	"status" varchar(32) DEFAULT 'new' NOT NULL,
	"detected_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"acknowledged_at" timestamp with time zone,
	"acknowledged_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_email" varchar(255),
	"patient_age" integer,
	"patient_gender" varchar(50),
	"status" varchar(50) NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"patient_id" uuid,
	"last_audio_at" timestamp,
	"last_heartbeat_at" timestamp,
	"chief_complaint" varchar(500),
	"session_type" varchar(50),
	"ai_generating" boolean DEFAULT false NOT NULL,
	"patient_dob_at_visit" date,
	"patient_mrn_at_visit" varchar(64),
	"patient_address_at_visit" varchar(1000),
	"coding_status" varchar(20) DEFAULT 'pending',
	"coding_started_at" timestamp,
	"coding_completed_at" timestamp,
	"coding_error" text,
	CONSTRAINT "sessions_status_check" CHECK ((status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('PROCESSING'::character varying)::text, ('REVIEW'::character varying)::text, ('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "session_consents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"session_id" uuid NOT NULL,
	"consented_by_user_id" uuid,
	"consented_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"consent_type" varchar(50) DEFAULT 'telehealth' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_metrics" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"path" text NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"user_role" varchar(50),
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rxnorm_codes" (
	"rxcui" varchar(20) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tty" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"session_id" uuid,
	"action" varchar(255) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"performed_by" uuid,
	"role" varchar(50) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"doctor_id" uuid,
	"patient_id" uuid,
	"soap_note_id" uuid,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"outcome" varchar(32),
	"error_code" varchar(100),
	"error_message" text,
	"target_user_id" uuid,
	"export_type" varchar(50),
	"record_count" integer,
	"export_scope" varchar(255),
	"request_id" varchar(100),
	"environment" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "doctor_patients" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"created_by_doctor_id" uuid NOT NULL,
	"first_session_date" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "uq_doctor_patient" UNIQUE("doctor_id","patient_id")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"gender" varchar(50),
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"created_by_doctor_id" uuid,
	"date_of_birth" date,
	"address" varchar(500),
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"zip_code" varchar(20),
	"medical_record_number" varchar(64),
	"health_id" varchar(32),
	"health_id_address" varchar(100),
	"aadhaar_number" varchar(20),
	"updated_by_id" uuid,
	"country" varchar(100),
	"phone_number" varchar(30),
	"phone_number_type" varchar(20),
	"preferred_language" varchar(50),
	"race" varchar(100),
	"ethnicity" varchar(100),
	CONSTRAINT "patients_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"speaker" varchar(50),
	"speaker_raw" varchar(50),
	"text" text NOT NULL,
	"start_time_ms" integer,
	"end_time_ms" integer,
	"confidence" double precision,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_mfa" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"secret_encrypted" text,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"backup_codes_hashed" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"service_consent" boolean DEFAULT true NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"cookie_consent_accepted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "soap_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"subjective" text,
	"objective" text,
	"assessment" text,
	"plan" text,
	"generated_by" varchar(50) DEFAULT 'gemini',
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"version" integer DEFAULT 1 NOT NULL,
	"source" varchar(50) DEFAULT 'generated',
	"created_by_id" uuid,
	"edited_by_id" uuid,
	"edited_at" timestamp,
	"confidence_score" integer,
	"summary_readiness" varchar(50),
	"alerts" jsonb,
	"note_state" varchar(32) DEFAULT 'draft' NOT NULL,
	"accuracy_pct" integer
);
--> statement-breakpoint
CREATE TABLE "soap_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid,
	"session_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"meta" jsonb,
	"ip_address" varchar(45),
	"user_agent" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"job_title" varchar(255),
	"department" varchar(100),
	"work_phone" varchar(30),
	"employee_id" varchar(64),
	"credentials" varchar(255),
	"credentialing_organization" varchar(100),
	"credential_expiry_date" date,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"admin_role" varchar(30) DEFAULT NULL,
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_role_check" CHECK ((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('reviewer'::character varying)::text, ('compliance_officer'::character varying)::text, ('doctor'::character varying)::text, ('coder'::character varying)::text]))
);
--> statement-breakpoint
CREATE TABLE "denial_predictions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"denial_probability" double precision NOT NULL,
	"risk_level" varchar(20) NOT NULL,
	"potential_reason_codes" json NOT NULL,
	"suggested_modifications" json NOT NULL,
	"analysis_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_clients" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"hashed_key" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	CONSTRAINT "uq_api_clients_hashed_key" UNIQUE("hashed_key")
);
--> statement-breakpoint
CREATE TABLE "usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"endpoint" varchar(64) NOT NULL,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL,
	"request_id" varchar(64),
	"response_status" integer
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"blob_path" varchar(500),
	"summary" text,
	"key_findings" text,
	"recommendations" text,
	"risk_flags" text,
	"raw_extracted_text" text,
	"uploaded_by_id" uuid,
	"analyzed_by_id" uuid,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"analyzed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_codes" ADD CONSTRAINT "medical_codes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_codes" ADD CONSTRAINT "medical_codes_validated_by_id_fkey" FOREIGN KEY ("validated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_demographic_audit" ADD CONSTRAINT "patient_demographic_audit_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_demographic_audit" ADD CONSTRAINT "patient_demographic_audit_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_acknowledged_by_id_fkey" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_soap_note_id_fkey" FOREIGN KEY ("soap_note_id") REFERENCES "public"."soap_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_consents" ADD CONSTRAINT "session_consents_consented_by_user_id_fkey" FOREIGN KEY ("consented_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_consents" ADD CONSTRAINT "session_consents_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_soap_note_id_fkey" FOREIGN KEY ("soap_note_id") REFERENCES "public"."soap_notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_patients" ADD CONSTRAINT "doctor_patients_created_by_doctor_id_fkey" FOREIGN KEY ("created_by_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_patients" ADD CONSTRAINT "doctor_patients_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_patients" ADD CONSTRAINT "doctor_patients_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_created_by_doctor_id_fkey" FOREIGN KEY ("created_by_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_mfa" ADD CONSTRAINT "user_mfa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_audit_log" ADD CONSTRAINT "soap_audit_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soap_audit_log" ADD CONSTRAINT "soap_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "denial_predictions" ADD CONSTRAINT "fk_denial_predictions_session_id_sessions" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "fk_usage_logs_client_id_api_clients" FOREIGN KEY ("client_id") REFERENCES "public"."api_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "fk_reports_session_id_sessions" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "fk_reports_uploaded_by_id_users" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "fk_reports_analyzed_by_id_users" FOREIGN KEY ("analyzed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cpt_codes_description" ON "cpt_codes" USING gin (to_tsvector('english'::regconfig, description) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_medical_codes_session_id" ON "medical_codes" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_medical_codes_status" ON "medical_codes" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_icd10_codes_description" ON "icd10_codes" USING gin (to_tsvector('english'::regconfig, description) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_patient_demographic_audit_changed_at" ON "patient_demographic_audit" USING btree ("changed_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_patient_demographic_audit_patient_id" ON "patient_demographic_audit" USING btree ("patient_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_red_flags_detected_at" ON "red_flags" USING btree ("detected_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_red_flags_session_id" ON "red_flags" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_red_flags_status" ON "red_flags" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_sessions_created_at" ON "sessions" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_sessions_doctor_id" ON "sessions" USING btree ("doctor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_sessions_patient_id" ON "sessions" USING btree ("patient_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_sessions_status" ON "sessions" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_session_consents_session_id" ON "session_consents" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_request_metrics_created_at" ON "request_metrics" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_request_metrics_method" ON "request_metrics" USING btree ("method" text_ops);--> statement-breakpoint
CREATE INDEX "idx_request_metrics_path" ON "request_metrics" USING btree ("path" text_ops);--> statement-breakpoint
CREATE INDEX "idx_rxnorm_codes_name" ON "rxnorm_codes" USING gin (to_tsvector('english'::regconfig, name) tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_doctor_id" ON "audit_logs" USING btree ("doctor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_outcome" ON "audit_logs" USING btree ("outcome" text_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_patient_id" ON "audit_logs" USING btree ("patient_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_performed_by" ON "audit_logs" USING btree ("performed_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_request_id" ON "audit_logs" USING btree ("request_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_session_id" ON "audit_logs" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_audit_logs_soap_note_id" ON "audit_logs" USING btree ("soap_note_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_doctor_patients_doctor_id" ON "doctor_patients" USING btree ("doctor_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_doctor_patients_patient_id" ON "doctor_patients" USING btree ("patient_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_patients_created_at" ON "patients" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_patients_email" ON "patients" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_patients_health_id" ON "patients" USING btree ("health_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_patients_mrn" ON "patients" USING btree ("medical_record_number" text_ops);--> statement-breakpoint
CREATE INDEX "idx_patients_name" ON "patients" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_transcripts_created_at" ON "transcripts" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_transcripts_session_id" ON "transcripts" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_soap_notes_created_at" ON "soap_notes" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_soap_notes_session_version" ON "soap_notes" USING btree ("session_id" int4_ops,"version" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_soap_audit_log_created_at" ON "soap_audit_log" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_soap_audit_log_session_id" ON "soap_audit_log" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role" text_ops);--> statement-breakpoint
CREATE INDEX "ix_denial_predictions_created_at" ON "denial_predictions" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "ix_denial_predictions_session_id" ON "denial_predictions" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_usage_called_at" ON "usage_logs" USING btree ("called_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_usage_client_id" ON "usage_logs" USING btree ("client_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_usage_endpoint" ON "usage_logs" USING btree ("endpoint" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reports_created_at" ON "reports" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_reports_session_id" ON "reports" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("status" text_ops);--> statement-breakpoint
CREATE VIEW "public"."monthly_usage" AS (SELECT c.id AS client_id, c.name AS client_name, ul.endpoint, date_trunc('month'::text, ul.called_at) AS billing_month, count(*) AS total_calls FROM usage_logs ul JOIN api_clients c ON c.id = ul.client_id GROUP BY c.id, c.name, ul.endpoint, (date_trunc('month'::text, ul.called_at)));
*/