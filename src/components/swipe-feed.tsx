"use client";

import { Avatar, Button, Card, Chip, Modal, Spinner } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion, type PanInfo, useAnimation } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { FeedItem } from "@/lib/feed";

const SESSION_SWIPE_LIMIT = 25;
const SWIPE_THRESHOLD = 96;
const SWIPE_VELOCITY = 420;

type FeedResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

type SwipeResult = {
  matched: boolean;
  matchId: string | null;
  remaining: number;
};

const cardSurfaceClassName =
  "rounded-xs border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-white/5";

export function SwipeFeed({ initialData }: { initialData: FeedResponse }) {
  const [sessionSwipeCount, setSessionSwipeCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [latestMatchId, setLatestMatchId] = useState<string | null>(null);

  const controls = useAnimation();

  const feedQuery = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam }) => {
      const suffix = pageParam
        ? `?cursor=${encodeURIComponent(pageParam as string)}`
        : "";
      const response = await fetch(`/api/feed${suffix}`);
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
    if (!current || sessionSwipeCount >= SESSION_SWIPE_LIMIT) {
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

    if (result.matched && result.matchId) {
      setLatestMatchId(result.matchId);
      await matchesQuery.refetch();
    }

    if (activeIndex + 4 >= allItems.length && feedQuery.hasNextPage) {
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
      await controls.start({
        x: 320,
        opacity: 0,
        rotate: 6,
        transition: { duration: 0.2, ease: [0.2, 0, 0.2, 1] },
      });
      controls.set({ x: 0, opacity: 1, rotate: 0 });
      await registerSwipe("RIGHT");
      return;
    }

    if (horizontal < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY) {
      await controls.start({
        x: -320,
        opacity: 0,
        rotate: -6,
        transition: { duration: 0.2, ease: [0.2, 0, 0.2, 1] },
      });
      controls.set({ x: 0, opacity: 1, rotate: 0 });
      await registerSwipe("LEFT");
      return;
    }

    await controls.start({
      x: 0,
      rotate: 0,
      transition: { duration: 0.18, ease: [0.2, 0, 0.2, 1] },
    });
  }

  return (
    <section className="w-full">
      <div className="flex items-center justify-between px-1 pb-3 text-xs text-muted">
        <p>
          Queue {Math.min(activeIndex + 1, Math.max(allItems.length, 1))}/
          {Math.max(allItems.length, 1)}
        </p>
        <p>
          {matchesQuery.data?.matches.length ?? 0} matches · {sessionSwipeCount}
          /{SESSION_SWIPE_LIMIT}
        </p>
      </div>

      <div className="relative min-h-[520px] w-full">
        {next ? (
          <div className="pointer-events-none absolute inset-0 translate-y-1 scale-[0.985] opacity-70">
            <FeedCard item={next} current={false} />
          </div>
        ) : null}

        {current ? (
          <motion.div
            animate={controls}
            className="absolute inset-0"
            drag="x"
            dragElastic={0.12}
            transition={{ duration: 0.2, ease: [0.2, 0, 0.2, 1] }}
            onDragEnd={onDragEnd}
            whileHover={{ scale: 1.012, y: -1 }}
          >
            <FeedCard item={current} current />
          </motion.div>
        ) : (
          <Card
            className={`${cardSurfaceClassName} flex min-h-[520px] items-center justify-center p-6`}
            variant="default"
          >
            <Card.Content className="items-center gap-3 text-center">
              {feedQuery.isFetching ? <Spinner /> : null}
              <p className="text-sm font-medium">No more cards right now.</p>
              <p className="max-w-sm text-sm text-muted">
                Come back later for a fresh queue of collaborators and projects.
              </p>
            </Card.Content>
          </Card>
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <Button
          className="rounded-xs"
          size="sm"
          variant="ghost"
          isDisabled={!current || sessionSwipeCount >= SESSION_SWIPE_LIMIT}
          onPress={async () => {
            await controls.start({
              x: -280,
              opacity: 0,
              rotate: -5,
              transition: { duration: 0.18, ease: [0.2, 0, 0.2, 1] },
            });
            controls.set({ x: 0, opacity: 1, rotate: 0 });
            await registerSwipe("LEFT");
          }}
        >
          Skip
        </Button>
        <Button
          className="rounded-xs"
          size="sm"
          variant="outline"
          isDisabled={!current || sessionSwipeCount >= SESSION_SWIPE_LIMIT}
          onPress={async () => {
            await controls.start({
              x: 280,
              opacity: 0,
              rotate: 5,
              transition: { duration: 0.18, ease: [0.2, 0, 0.2, 1] },
            });
            controls.set({ x: 0, opacity: 1, rotate: 0 });
            await registerSwipe("RIGHT");
          }}
        >
          Interested
        </Button>
      </div>

      <div className={`${cardSurfaceClassName} mt-4 p-4`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Matches
            </p>
            <p className="mt-1 text-sm text-muted">
              Simple match placeholder for future messaging.
            </p>
          </div>
          {latestMatchId ? (
            <p className="text-xs text-muted">Latest: {latestMatchId}</p>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          {matchesQuery.data?.matches.slice(0, 3).map((match) => (
            <div
              key={match.id}
              className="rounded-xs border border-black/5 px-3 py-2 text-sm text-foreground/90 dark:border-white/10"
            >
              {match.type === "USER_USER"
                ? `${match.userA?.name ?? "Unknown"} ↔ ${match.userB?.name ?? "Unknown"}`
                : `${match.project?.title ?? "Project"} with ${match.interestedUser?.name ?? "User"}`}
            </div>
          ))}
          {!matchesQuery.data?.matches.length ? (
            <p className="text-sm text-muted">No matches yet. Keep swiping.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FeedCard({ item, current }: { item: FeedItem; current: boolean }) {
  const primaryTags = item.type === "user" ? item.skills : item.requiredRoles;
  const secondaryTags = item.type === "user" ? item.interests : item.tags;

  return (
    <Card
      className={`${cardSurfaceClassName} h-full overflow-hidden p-4 sm:p-5`}
      variant="default"
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 rounded-xs">
            <Avatar.Image
              alt={item.type === "user" ? item.name : item.title}
              src={
                item.type === "user"
                  ? (item.avatar ?? undefined)
                  : (item.owner.avatar ?? undefined)
              }
            />
            <Avatar.Fallback>
              {(item.type === "user" ? item.name : item.title)
                .slice(0, 2)
                .toUpperCase()}
            </Avatar.Fallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-medium tracking-tight text-foreground">
                  {item.type === "user" ? item.name : item.title}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {item.type === "user"
                    ? `@${item.username}`
                    : `Project by @${item.owner.username}`}
                </p>
              </div>
              <Chip size="sm" variant="soft">
                {item.type === "user" ? "Person" : "Project"}
              </Chip>
            </div>

            <p className="mt-3 line-clamp-1 text-sm text-muted">
              {item.type === "user"
                ? (item.bio ?? "No bio yet.")
                : item.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {primaryTags.slice(0, 5).map((tag) => (
            <Chip key={tag} size="sm" variant="secondary">
              {tag}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {secondaryTags.slice(0, 3).map((tag) => (
            <Chip key={tag} size="sm" variant="soft">
              {tag}
            </Chip>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <DetailModal
            item={item}
            triggerLabel={current ? "Details" : "More"}
          />
          <span className="text-xs text-muted">
            {item.type === "user" ? "Skills and intent" : "Roles and fit"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function DetailModal({
  item,
  triggerLabel,
}: {
  item: FeedItem;
  triggerLabel: string;
}) {
  return (
    <Modal>
      <Button className="rounded-xs" size="sm" variant="ghost">
        {triggerLabel}
      </Button>
      <Modal.Backdrop variant="blur">
        <Modal.Container>
          <Modal.Dialog
            className={`${cardSurfaceClassName} max-w-[560px] overflow-hidden p-0`}
          >
            <Modal.CloseTrigger />
            <Modal.Header className="border-b border-black/5 px-5 py-4 dark:border-white/10">
              <div>
                <Modal.Heading className="text-lg font-medium tracking-tight">
                  {item.type === "user" ? item.name : item.title}
                </Modal.Heading>
                <p className="mt-1 text-sm text-muted">
                  {item.type === "user"
                    ? `@${item.username}`
                    : `Project by @${item.owner.username}`}
                </p>
              </div>
            </Modal.Header>
            <Modal.Body className="px-5 py-4">
              <div className="space-y-4">
                <p className="text-sm text-foreground/90">
                  {item.type === "user"
                    ? (item.bio ?? "No bio yet.")
                    : item.description}
                </p>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Primary
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(item.type === "user"
                      ? item.skills
                      : item.requiredRoles
                    ).map((tag) => (
                      <Chip key={tag} size="sm" variant="secondary">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Context
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(item.type === "user" ? item.interests : item.tags).map(
                      (tag) => (
                        <Chip key={tag} size="sm" variant="soft">
                          {tag}
                        </Chip>
                      ),
                    )}
                  </div>
                </div>

                {item.type === "project" ? (
                  <p className="text-sm text-muted">
                    Owner: {item.owner.name} · @{item.owner.username}
                  </p>
                ) : null}
              </div>
            </Modal.Body>
            <Modal.Footer className="border-t border-black/5 px-5 py-4 dark:border-white/10">
              <Button slot="close" className="rounded-xs" variant="outline">
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
