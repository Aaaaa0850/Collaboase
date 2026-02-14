CREATE TABLE `deliverable` (
	`id` text PRIMARY KEY NOT NULL,
	`project_join_member_value` integer NOT NULL,
	`comment` text,
	`url` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
