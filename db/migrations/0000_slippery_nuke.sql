CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_account_unique` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE TABLE `attendance_record` (
	`id` text PRIMARY KEY NOT NULL,
	`attendance_session_id` text NOT NULL,
	`classroom_code` text NOT NULL,
	`user_id` text NOT NULL,
	`marked_at` integer NOT NULL,
	`mark_method` text DEFAULT 'student' NOT NULL,
	FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attendance_record_session_idx` ON `attendance_record` (`attendance_session_id`);--> statement-breakpoint
CREATE INDEX `attendance_record_classroom_idx` ON `attendance_record` (`classroom_code`);--> statement-breakpoint
CREATE INDEX `attendance_record_user_idx` ON `attendance_record` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_record_unique_session_member` ON `attendance_record` (`attendance_session_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `attendance_request` (
	`id` text PRIMARY KEY NOT NULL,
	`attendance_session_id` text NOT NULL,
	`classroom_code` text NOT NULL,
	`student_user_id` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by_user_id` text,
	`review_note` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `attendance_request_session_idx` ON `attendance_request` (`attendance_session_id`);--> statement-breakpoint
CREATE INDEX `attendance_request_classroom_idx` ON `attendance_request` (`classroom_code`);--> statement-breakpoint
CREATE INDEX `attendance_request_student_idx` ON `attendance_request` (`student_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_request_unique_session_student` ON `attendance_request` (`attendance_session_id`,`student_user_id`);--> statement-breakpoint
CREATE TABLE `attendance_session` (
	`id` text PRIMARY KEY NOT NULL,
	`classroom_code` text NOT NULL,
	`created_by_user_id` text NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`is_closed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_session_token_unique` ON `attendance_session` (`token`);--> statement-breakpoint
CREATE INDEX `attendance_session_classroom_code_idx` ON `attendance_session` (`classroom_code`);--> statement-breakpoint
CREATE INDEX `attendance_session_created_by_user_id_idx` ON `attendance_session` (`created_by_user_id`);--> statement-breakpoint
CREATE TABLE `classroom` (
	`code` text(6) PRIMARY KEY NOT NULL,
	`creator_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text(1000),
	`created_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `classroom_creator_id_idx` ON `classroom` (`creator_id`);--> statement-breakpoint
CREATE TABLE `classroom_member` (
	`classroom_code` text NOT NULL,
	`user_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	PRIMARY KEY(`classroom_code`, `user_id`),
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `classroom_member_user_id_idx` ON `classroom_member` (`user_id`);--> statement-breakpoint
CREATE INDEX `classroom_member_classroom_code_idx` ON `classroom_member` (`classroom_code`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `user_email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_identifier_value_unique` ON `verification` (`identifier`,`value`);