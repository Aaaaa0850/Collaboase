import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.default(false)
		.notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = sqliteTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", {
			mode: "timestamp_ms",
		}),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", {
			mode: "timestamp_ms",
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const projects = sqliteTable("projects", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	projectTag: text("project_tag").notNull().unique(),
	seriousnessTag: text("seriousness_tag").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
},
	(table) => [index("projects_updatedAt_idx").on(table.updatedAt, table.projectTag, table.seriousnessTag)],
)

export const userJoinProject = sqliteTable("user_join_project", {
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	projectId: text("project_id")
		.notNull()
		.references(() => projects.id, { onDelete: "cascade" }),
},
	(table) => [index("user_join_project_userId_idx").on(table.userId), index("user_join_project_projectId_idx").on(table.projectId)],
)

export const projectJoinRequests = sqliteTable("project_join_requests", {
	id: text("id").primaryKey(),
	projectId: text("project_id").notNull(),
	userId: text("user_id").notNull(),
	statement: text("statement"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
},
	(table) => [index("project_join_requests_projectId_idx").on(table.projectId)],
)

export const projectMembers = sqliteTable("project_members", {
	id: text("id").primaryKey(),
	projectId: text("project_id").notNull(),
	userId: text("user_id").notNull(),
	role: text("role").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
},
	(table) => [index("project_members_projectId_idx").on(table.projectId)],
)

export const projectLinks = sqliteTable("project_links", {
	id: text("id").primaryKey(),
	projectId: text("project_id").notNull(),
	url: text("url").notNull(),
	description: text("description"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
},
	(table) => [index("project_links_projectId_idx").on(table.projectId)],
)

export const projectTasks = sqliteTable("project_tasks", {
	id: text("id").primaryKey(),
	projectId: text("project_id").notNull(),
	title: text("title").notNull(),
	description: text("description"),
	status: text("status").notNull(),
	assignedTo: text("assigned_to"),
	dueDate: integer("due_date", { mode: "timestamp_ms" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
},
	(table) => [index("project_tasks_projectId_idx").on(table.projectId, table.status)],
)

export const deliverable = sqliteTable("deliverable", {
	id: text("id").primaryKey(),
	projectJoinMemberValue: integer("project_join_member_value").notNull(),
	comment: text("comment"),
	url: text("url").notNull(),
	description: text("description"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
});

export const projectRelations = relations(projects, ({ many }) => ({
	members: many(projectMembers),
	links: many(projectLinks),
	tasks: many(projectTasks),
	joinRequests: many(projectJoinRequests),
	userJoins: many(userJoinProject),
}));

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
	userJoins: many(userJoinProject),
}));

export const projectJoinRequestRelations = relations(projectJoinRequests, ({ one }) => ({
	project: one(projects, {
		fields: [projectJoinRequests.projectId],
		references: [projects.id],
	}),
}));

export const projectMemberRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id],
	}),
}));

export const projectLinkRelations = relations(projectLinks, ({ one }) => ({
	project: one(projects, {
		fields: [projectLinks.projectId],
		references: [projects.id],
	}),
}));

export const projectTaskRelations = relations(projectTasks, ({ one }) => ({
	project: one(projects, {
		fields: [projectTasks.projectId],
		references: [projects.id],
	}),
}));



export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export default {
	user,
	session,
	account,
	verification,
	projects,
	projectMembers,
	projectLinks,
	projectTasks,
	projectJoinRequests,
	userJoinProject,
};