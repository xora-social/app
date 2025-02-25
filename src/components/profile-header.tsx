import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ProfileHeaderProps {
  username: string;
  name?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  userId: number;
  className?: string;
}

export function ProfileHeader({
  username,
  name,
  bio,
  followersCount = 0,
  followingCount = 0,
  isCurrentUser = false,
  isFollowing = false,
  userId,
  className
}: ProfileHeaderProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const utils = api.useUtils();

  const { mutate: follow, isPending: isFollowPending } = api.user.follow.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
    },
  });

  const { mutate: unfollow, isPending: isUnfollowPending } = api.user.unfollow.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
    },
  });

  return (
    <>
      <div className={cn("relative", className)}>
        <div className="relative h-32 border-b w-full overflow-hidden sm:h-48">
          <Image
            src='' // TODO: Add cover image
            alt={`${username}'s cover`}
            className="object-cover"
            fill
            priority
          />
        </div>

        <div className="space-y-3 px-4 -mt-12">
          <div className="flex justify-between items-end">
            <UserAvatar
              className="size-[100px] text-3xl"
              fallback={username[0]}
            />

            {isCurrentUser ? (
              <Button
                variant="outline"
                onClick={() => setIsEditProfileOpen(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={() => {
                  if (isFollowing) {
                    unfollow({ userId });
                  } else {
                    follow({ userId });
                  }
                }}
                disabled={isFollowPending || isUnfollowPending}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold">{name || `@${username}`}</h1>
            <p className="text-sm text-muted-foreground">@{username}</p>
            {bio && <p className="text-sm mt-2">{bio}</p>}
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link
              href={`/${username}/following`}
              className="hover:underline"
            >
              <strong className="text-foreground">{followingCount}</strong> Following
            </Link>
            <Link
              href={`/${username}/followers`}
              className="hover:underline"
            >
              <strong className="text-foreground">{followersCount}</strong> Followers
            </Link>
          </div>
        </div>
      </div>

      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        defaultValues={{
          name,
          bio,
        }}
      />
    </>
  );
} 