import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, communityPostsTable, communityCommentsTable, usersTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const CreatePostBody = z.object({
  caption: z.string().min(1).max(1000),
  photoDataUrl: z.string().nullable().optional(),
});

const CreateCommentBody = z.object({
  content: z.string().min(1).max(500),
});

function getUserDisplayName(user: { firstName?: string | null; lastName?: string | null; email?: string | null }): string {
  const first = user.firstName?.trim() ?? "";
  const last = user.lastName?.trim() ?? "";
  if (first || last) return `${first} ${last}`.trim();
  if (user.email) return user.email.split("@")[0];
  return "Lawn Grower";
}

router.get("/community", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const posts = await db
      .select({
        id: communityPostsTable.id,
        userId: communityPostsTable.userId,
        userName: communityPostsTable.userName,
        userAvatar: communityPostsTable.userAvatar,
        caption: communityPostsTable.caption,
        photoDataUrl: communityPostsTable.photoDataUrl,
        likeCount: communityPostsTable.likeCount,
        createdAt: communityPostsTable.createdAt,
        commentCount: sql<number>`cast(count(${communityCommentsTable.id}) as int)`,
      })
      .from(communityPostsTable)
      .leftJoin(communityCommentsTable, eq(communityCommentsTable.postId, communityPostsTable.id))
      .groupBy(communityPostsTable.id)
      .orderBy(desc(communityPostsTable.createdAt));

    res.json(posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list community posts");
    res.status(500).json({ error: "Failed to list posts" });
  }
});

router.post("/community", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const [userRow] = await db
      .select({ firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email, profileImageUrl: usersTable.profileImageUrl })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    const [post] = await db
      .insert(communityPostsTable)
      .values({
        userId: req.user.id,
        userName: getUserDisplayName(userRow ?? {}),
        userAvatar: userRow?.profileImageUrl ?? null,
        caption: parsed.data.caption,
        photoDataUrl: parsed.data.photoDataUrl ?? null,
      })
      .returning();

    res.status(201).json({ ...post, commentCount: 0, createdAt: post.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create community post");
    res.status(500).json({ error: "Failed to create post" });
  }
});

router.delete("/community/comments/:commentId", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { commentId } = req.params;
  await db
    .delete(communityCommentsTable)
    .where(and(eq(communityCommentsTable.id, commentId), eq(communityCommentsTable.userId, req.user.id)));
  res.status(204).send();
});

router.delete("/community/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db
    .delete(communityPostsTable)
    .where(and(eq(communityPostsTable.id, req.params.id), eq(communityPostsTable.userId, req.user.id)));
  res.status(204).send();
});

router.get("/community/:id/comments", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const comments = await db
      .select()
      .from(communityCommentsTable)
      .where(eq(communityCommentsTable.postId, req.params.id))
      .orderBy(communityCommentsTable.createdAt);
    res.json(comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list comments");
    res.status(500).json({ error: "Failed to list comments" });
  }
});

router.post("/community/:id/comments", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const [userRow] = await db
      .select({ firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email, profileImageUrl: usersTable.profileImageUrl })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);

    const [comment] = await db
      .insert(communityCommentsTable)
      .values({
        postId: req.params.id,
        userId: req.user.id,
        userName: getUserDisplayName(userRow ?? {}),
        userAvatar: userRow?.profileImageUrl ?? null,
        content: parsed.data.content,
      })
      .returning();

    res.status(201).json({ ...comment, createdAt: comment.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create comment");
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
