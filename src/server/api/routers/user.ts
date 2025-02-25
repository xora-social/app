import { follows, posts, users } from "@/lib/db/schema";
import { createNotification, deleteNotification } from "@/server/utils/notifications";
import { TRPCError } from "@trpc/server";
import type { InferSelectModel } from "drizzle-orm";
import { and, count, desc, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

// Base user type from Drizzle schema
type DBUser = InferSelectModel<typeof users>;

// Extend the base type with additional fields we need
export type ProfileResponse = DBUser & {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isCurrentUser: boolean;
  isFollowing: boolean;
};

export const userRouter = createTRPCRouter({
  follow: protectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot follow yourself"
        });
      }

      await ctx.db.insert(follows).values({
        followerId: ctx.session.user.id,
        followingId: input.userId,
      });

      await createNotification(ctx.db, {
        userId: input.userId,
        actorId: ctx.session.user.id,
        type: "follow",
        targetId: input.userId,
        targetType: "profile",
      });
    }),

  unfollow: protectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(follows)
        .where(and(
          eq(follows.followerId, ctx.session.user.id),
          eq(follows.followingId, input.userId)
        ));

      await deleteNotification(ctx.db, {
        actorId: ctx.session.user.id,
        type: "follow",
        targetId: input.userId,
        targetType: "profile",
      });
    }),

  getFollowers: protectedProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.number().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      const items = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          name: users.username,
          image: users.image,
        })
        .from(follows)
        .innerJoin(users, eq(users.id, follows.followerId))
        .where(
          and(
            eq(follows.followingId, userId),
            cursor ? lt(follows.id, cursor) : undefined
          )
        )
        .orderBy(desc(follows.id))
        .limit(limit + 1);

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  getFollowing: protectedProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.number().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;

      const items = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          image: users.image,
        })
        .from(follows)
        .innerJoin(users, eq(users.id, follows.followingId))
        .where(
          and(
            eq(follows.followerId, userId),
            cursor ? lt(follows.id, cursor) : undefined
          )
        )
        .orderBy(desc(follows.id))
        .limit(limit + 1);

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be less than 20 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers and underscores"
          ),
        bio: z.string()
          .max(160, "Bio must be less than 160 characters")
          .nullable(),
        image: z.string().nullable(),
        cover: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if username is already taken
        const existingUser = await ctx.db.query.users.findFirst({
          where: and(
            eq(users.username, input.username),
            sql`${users.id} != ${ctx.session.user.id}`
          ),
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This username is already taken"
          });
        }

        const updatedUser = await ctx.db
          .update(users)
          .set({
            username: input.username,
            bio: input.bio,
            image: input.image,
            cover: input.cover,
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.session.user.id))
          .returning();

        if (!updatedUser[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found"
          });
        }

        return updatedUser[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong. Please try again later"
        });
      }
    }),

  getProfileByUsername: protectedProcedure
    .input(z.object({
      username: z.string(),
    }))
    .query(async ({ ctx, input }): Promise<ProfileResponse> => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.username, input.username),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const postsCountResult = await ctx.db
        .select({ value: count() })
        .from(posts)
        .where(eq(posts.authorId, user.id));

      const followersCount = await ctx.db
        .select({ value: count() })
        .from(follows)
        .where(eq(follows.followingId, user.id));

      const followingCount = await ctx.db
        .select({ value: count() })
        .from(follows)
        .where(eq(follows.followerId, user.id));

      const isFollowing = await ctx.db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, ctx.session.user.id),
          eq(follows.followingId, user.id)
        ),
      });

      return {
        ...user,
        followersCount: followersCount[0].value,
        followingCount: followingCount[0].value,
        postsCount: postsCountResult[0].value,
        isCurrentUser: user.address === ctx.session.user.address,
        isFollowing: !!isFollowing,
      };
    }),

  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
      limit: z.number().min(1).max(10).default(5),
    }))
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      const searchResults = await ctx.db
        .select({
          id: users.id,
          username: users.username,
        })
        .from(users)
        .where(
          sql`(${users.username} ILIKE ${`%${query}%`})`
        )
        .limit(limit);

      return searchResults;
    }),

  getRandomSuggestions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(10).default(3),
    }))
    .query(async ({ ctx, input }) => {
      const suggestions = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          image: users.image,
        })
        .from(users)
        .where(
          sql`${users.id} != ${ctx.session.user.id} AND NOT EXISTS (
            SELECT 1 FROM ${follows}
            WHERE ${follows.followerId} = ${ctx.session.user.id}
            AND ${follows.followingId} = ${users.id}
          )`
        )
        .orderBy(sql`RANDOM()`)
        .limit(input.limit);

      return suggestions;
    }),
}); 