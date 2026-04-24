DROP TABLE `attendance_verification_challenge`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_attendance_verification_attempt` (
	`id` text PRIMARY KEY NOT NULL,
	`attendance_session_id` text NOT NULL,
	`classroom_code` text NOT NULL,
	`user_id` text NOT NULL,
	`is_success` integer DEFAULT false NOT NULL,
	`confidence` integer,
	`failure_reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attendance_verification_attempt`("id", "attendance_session_id", "classroom_code", "user_id", "is_success", "confidence", "failure_reason", "created_at") SELECT "id", "attendance_session_id", "classroom_code", "user_id", "is_success", "confidence", "failure_reason", "created_at" FROM `attendance_verification_attempt`;--> statement-breakpoint
DROP TABLE `attendance_verification_attempt`;--> statement-breakpoint
ALTER TABLE `__new_attendance_verification_attempt` RENAME TO `attendance_verification_attempt`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `attendance_verify_attempt_session_idx` ON `attendance_verification_attempt` (`attendance_session_id`);--> statement-breakpoint
CREATE INDEX `attendance_verify_attempt_user_idx` ON `attendance_verification_attempt` (`user_id`);--> statement-breakpoint
CREATE INDEX `attendance_verify_attempt_created_at_idx` ON `attendance_verification_attempt` (`created_at`);