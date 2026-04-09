CREATE TABLE `attendance_record` (
	`id` text PRIMARY KEY NOT NULL,
	`attendance_session_id` text NOT NULL,
	`classroom_code` text NOT NULL,
	`user_id` text NOT NULL,
	`marked_at` integer NOT NULL,
	`mark_method` text DEFAULT 'qr' NOT NULL,
	FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attendance_record_session_idx` ON `attendance_record` (`attendance_session_id`);--> statement-breakpoint
CREATE INDEX `attendance_record_classroom_idx` ON `attendance_record` (`classroom_code`);--> statement-breakpoint
CREATE INDEX `attendance_record_user_idx` ON `attendance_record` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_record_unique_session_member` ON `attendance_record` (`attendance_session_id`,`user_id`);--> statement-breakpoint
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
CREATE INDEX `attendance_session_created_by_user_id_idx` ON `attendance_session` (`created_by_user_id`);