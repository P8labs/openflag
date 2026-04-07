"use client";

import { Avatar, Button, Card, Chip, Spinner } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { FeedItem } from "@/lib/feed";

const SESSION_SWIPE_LIMIT = 25;

type FeedResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

type SwipeResult = {
  matched: boolean;
  matchId: string | null;
  remaining: number;
};

const SWIPE_THRESHOLD = 110;
const SWIPE_VELOCITY = 460;

export function SwipeFeed({ initialData }: { initialData: FeedResponse }) {
  const [sessionSwipeCount, setSessionSwipeCount] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [latestMatchId, setLatestMatchId] = useState<string | null>(null);

  const controls = useAnimation();

  const feedQuery = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      const value = pageParam
        ? `?cursor=${encodeURIComponent(pageParam as string)}`
        : "";
      const response = await fetch(`/api/feed${value}`);
      if (!response.ok) {
        throw new Error("Unable to load feed.");
      }
      return (await response.json()) as FeedResponse;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pageParams: [null],
      pages: [initialData],
    },
  });

  const matchesQuery = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const response = await fetch("/api/matches");
      if (!response.ok) {
        throw new Error("Unable to load matches.");
      }
      return (await response.json()) as {
        matches: Array<{
          id: string;
          type: "USER_USER" | "USER_PROJECT";
          userA: { id: string; name: string; image: string | null } | null;
          userB: { id: string; name: string; image: string | null } | null;
          interestedUser: {
            id: string;
            name: string;
            image: string | null;
          } | null;
          project: { id: string; title: string; description: string } | null;
        }>;
      };
    },
    staleTime: 10_000,
  });

  const allItems = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [feedQuery.data],
  );

  const current = allItems[activeIndex] ?? null;
  const next = allItems[activeIndex + 1] ?? null;

  useEffect(() => {
    if (!current && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      void feedQuery.fetchNextPage();
    }
  }, [current, feedQuery]);

  async function registerSwipe(direction: "LEFT" | "RIGHT") {
    if (!current) {
      return;
    }

    if (sessionSwipeCount >= SESSION_SWIPE_LIMIT) {
      return;
    }

    const response = await fetch("/api/swipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetType: current.type,
        targetId: current.id,
        direction,
      }),
    });

    if (!response.ok) {
      return;
    }

    const result = (await response.json()) as SwipeResult;

    setSessionSwipeCount((count) => count + 1);
    setActiveIndex((index) => index + 1);
    setDetailOpen(false);

    if (result.matched && result.matchId) {
      setLatestMatchId(result.matchId);
      await matchesQuery.refetch();
    }

    if (activeIndex + 5 >= allItems.length && feedQuery.hasNextPage) {
      void feedQuery.fetchNextPage();
    }
  }

  async function onDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const horizontal = info.offset.x;
    const velocity = info.velocity.x;

    if (horizontal > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY) {
      await controls.start({ x: 440, opacity: 0, rotate: 12 });
      controls.set({ x: 0, opacity: 1, rotate: 0 });
      await registerSwipe("RIGHT");
      return;
    }

    if (horizontal < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY) {
      await controls.start({ x: -440, opacity: 0, rotate: -12 });
      controls.set({ x: 0, opacity: 1, rotate: 0 });
      await registerSwipe("LEFT");
      return;
    }

    await controls.start({ x: 0, rotate: 0 });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-12">
      <div className="flex items-center justify-between rounded-2xl border border-divider bg-content1 px-4 py-3">
        <p className="text-sm text-muted">
          Session swipes: {sessionSwipeCount}/{SESSION_SWIPE_LIMIT}
        </p>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="soft">
            {matchesQuery.data?.matches.length ?? 0} matches
          </Chip>
          <Chip size="sm" variant="soft">
            Infinite feed
          </Chip>
        </div>
      </div>

      <div className="relative h-135 w-full">
        {next ? (
          <div className="absolute inset-0 scale-[0.98] rounded-3xl opacity-80">
            <FeedCard
              item={next}
              detailOpen={false}
              onToggleDetail={() => undefined}
            />
          </div>
        ) : null}

        {current ? (
          <motion.div
            animate={controls}
            className="absolute inset-0"
            drag="x"
            dragElastic={0.14}
            onDragEnd={onDragEnd}
          >
            <FeedCard
              item={current}
              detailOpen={detailOpen}
              onToggleDetail={() => setDetailOpen((value) => !value)}
            />
          </motion.div>
        ) : (
          <Card
            className="flex h-full items-center justify-center p-6"
            variant="secondary"
          >
            <Card.Content className="items-center gap-3 text-center">
              {feedQuery.isFetching ? <Spinner /> : null}
              <p className="text-lg font-medium">No more cards right now.</p>
              <p className="text-sm text-muted">
                Come back later for fresh collaborators and projects.
              </p>
            </Card.Content>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="danger-soft"
          isDisabled={!current || sessionSwipeCount >= SESSION_SWIPE_LIMIT}
          onPress={async () => {
            await controls.start({ x: -420, opacity: 0, rotate: -11 });
            controls.set({ x: 0, opacity: 1, rotate: 0 });
            await registerSwipe("LEFT");
          }}
        >
          Skip
        </Button>
        <Button
          variant="primary"
          isDisabled={!current || sessionSwipeCount >= SESSION_SWIPE_LIMIT}
          onPress={async () => {
            await controls.start({ x: 420, opacity: 0, rotate: 11 });
            controls.set({ x: 0, opacity: 1, rotate: 0 });
            await registerSwipe("RIGHT");
          }}
        >
          Interested
        </Button>
      </div>

      <Card className="p-4" variant="transparent">
        <Card.Header>
          <Card.Title>Matched</Card.Title>
          <Card.Description>
            Placeholder panel for upcoming messaging. The MVP validates
            discovery and matching only.
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-2">
          {matchesQuery.data?.matches.slice(0, 5).map((match) => (
            <div
              key={match.id}
              className="rounded-xl border border-divider p-3 text-sm"
            >
              {match.type === "USER_USER"
                ? `User match: ${match.userA?.name ?? "Unknown"} ↔ ${match.userB?.name ?? "Unknown"}`
                : `Project match: ${match.project?.title ?? "Project"} with ${match.interestedUser?.name ?? "User"}`}
            </div>
          ))}
          {!matchesQuery.data?.matches.length ? (
            <p className="text-sm text-muted">No matches yet. Keep swiping.</p>
          ) : null}
          {latestMatchId ? (
            <p className="text-xs text-muted">
              Latest match ID: {latestMatchId}
            </p>
          ) : null}
        </Card.Content>
      </Card>
    </div>
  );
}

function FeedCard({
  item,
  detailOpen,
  onToggleDetail,
}: {
  item: FeedItem;
  detailOpen: boolean;
  onToggleDetail: () => void;
}) {
  const common = (
    <div className="flex flex-wrap gap-2">
      {item.type === "user"
        ? item.skills.slice(0, detailOpen ? 12 : 6).map((skill) => (
            <Chip key={skill} size="sm" variant="primary">
              {skill}
            </Chip>
          ))
        : item.requiredRoles.slice(0, detailOpen ? 12 : 6).map((role) => (
            <Chip key={role} size="sm" variant="primary">
              {role}
            </Chip>
          ))}
    </div>
  );

  return (
    <Card className="h-full gap-4 p-4 sm:p-6" variant="default">
      <Card.Header className="justify-between">
        <div className="flex items-center gap-3">
          {item.type === "user" ? (
            <Avatar className="size-12">
              <Avatar.Image alt={item.name} src={item.avatar ?? undefined} />
              <Avatar.Fallback>
                {item.name.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
          ) : (
            <Avatar className="size-12">
              <Avatar.Image
                alt={item.owner.name}
                src={item.owner.avatar ?? undefined}
              />
              <Avatar.Fallback>
                {item.owner.name.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
          )}
          <div>
            <Card.Title>
              {item.type === "user" ? item.name : item.title}
            </Card.Title>
            <Card.Description>
              {item.type === "user"
                ? `@${item.username}`
                : `By @${item.owner.username}`}
            </Card.Description>
          </div>
        </div>
        <Chip size="sm" variant="secondary">
          Score {item.score}
        </Chip>
      </Card.Header>

      <Card.Content className="gap-4 overflow-auto">
        <p className="text-sm text-foreground/90">
          {item.type === "user"
            ? (item.bio ?? "No bio yet.")
            : item.description}
        </p>

        {common}

        {item.type === "project" ? (
          <div className="flex flex-wrap gap-2">
            {item.tags.slice(0, detailOpen ? 12 : 6).map((tag) => (
              <Chip key={tag} size="sm" variant="soft">
                {tag}
              </Chip>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {item.interests.slice(0, detailOpen ? 12 : 6).map((interest) => (
              <Chip key={interest} size="sm" variant="soft">
                {interest}
              </Chip>
            ))}
          </div>
        )}

        {detailOpen ? (
          <div className="rounded-xl border border-divider p-3 text-sm text-muted">
            {item.type === "user"
              ? "Expanded details include broader skill and interest context for a faster yes/no decision."
              : "Expanded details include roles and tags to evaluate fit without leaving the swipe loop."}
          </div>
        ) : null}
      </Card.Content>

      <Card.Footer>
        <Button size="sm" variant="ghost" onPress={onToggleDetail}>
          {detailOpen ? "Collapse" : "Expand details"}
        </Button>
      </Card.Footer>
    </Card>
  );
}
