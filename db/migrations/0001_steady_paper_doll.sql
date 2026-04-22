CREATE TABLE `attendance_verification_attempt` (
	`id` text PRIMARY KEY NOT NULL,
	`attendance_session_id` text NOT NULL,
	`classroom_code` text NOT NULL,
	`user_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`is_success` integer DEFAULT false NOT NULL,
	`confidence` integer,
	`failure_reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challenge_id`) REFERENCES `attendance_verification_challenge`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attendance_verify_attempt_session_idx` ON `attendance_verification_attempt` (`attendance_session_id`);--> statement-breakpoint
CREATE INDEX `attendance_verify_attempt_user_idx` ON `attendance_verification_attempt` (`user_id`);--> statement-breakpoint
CREATE INDEX `attendance_verify_attempt_created_at_idx` ON `attendance_verification_attempt` (`created_at`);--> statement-breakpoint
CREATE TABLE `attendance_verification_challenge` (
	`id` text PRIMARY KEY NOT NULL,
	`attendance_session_id` text NOT NULL,
	`classroom_code` text NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	FOREIGN KEY (`attendance_session_id`) REFERENCES `attendance_session`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_code`) REFERENCES `classroom`(`code`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attendance_verify_challenge_session_idx` ON `attendance_verification_challenge` (`attendance_session_id`);--> statement-breakpoint
CREATE INDEX `attendance_verify_challenge_user_idx` ON `attendance_verification_challenge` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_verify_challenge_token_hash_unique` ON `attendance_verification_challenge` (`token_hash`);