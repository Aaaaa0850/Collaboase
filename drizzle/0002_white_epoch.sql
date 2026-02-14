CREATE TABLE `project_join_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`statement` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_join_requests_projectId_idx` ON `project_join_requests` (`project_id`);--> statement-breakpoint
CREATE TABLE `user_join_project` (
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_join_project_userId_idx` ON `user_join_project` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_join_project_projectId_idx` ON `user_join_project` (`project_id`);--> statement-breakpoint
ALTER TABLE `projects` ADD `project_tag` text NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `seriousness_tag` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_project_tag_unique` ON `projects` (`project_tag`);--> statement-breakpoint
CREATE UNIQUE INDEX `projects_seriousness_tag_unique` ON `projects` (`seriousness_tag`);--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `owner_id`;