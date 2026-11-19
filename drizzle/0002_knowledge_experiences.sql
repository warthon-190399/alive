CREATE TABLE `experience_media` (
	`experience_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`experience_id`, `media_id`),
	FOREIGN KEY (`experience_id`) REFERENCES `experiences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `experiences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`date` text,
	`end_date` text,
	`rating` integer,
	`note` text DEFAULT '' NOT NULL,
	`with_whom` text DEFAULT '' NOT NULL,
	`place` text DEFAULT '' NOT NULL,
	`lat` real,
	`lng` real,
	`cover_media_id` integer,
	`wishlist` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `interests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`question` text DEFAULT '' NOT NULL,
	`stage` text DEFAULT 'curiosidad' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`stage_changed_at` text
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`interest_id` integer,
	`text` text NOT NULL,
	`status` text DEFAULT 'abierta' NOT NULL,
	`conclusion` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`closed_at` text,
	FOREIGN KEY (`interest_id`) REFERENCES `interests`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `queue_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'libro' NOT NULL,
	`url` text,
	`cover_media_id` integer,
	`interest_id` integer,
	`status` text DEFAULT 'cola' NOT NULL,
	`experience_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`finished_at` text,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`interest_id`) REFERENCES `interests`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `sparks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text DEFAULT 'idea' NOT NULL,
	`text` text NOT NULL,
	`url` text,
	`interest_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`interest_id`) REFERENCES `interests`(`id`) ON UPDATE no action ON DELETE set null
);
