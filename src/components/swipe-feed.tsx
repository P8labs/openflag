"use client";

import { Avatar, Button, Card, Chip, Modal, Spinner } from "@heroui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion, type PanInfo, useAnimation } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { ProjectMedia } from "@/components/project-media";
import type { FeedItem } from "@/lib/feed";

const SESSION_SWIPE_LIMIT = 25;
const SWIPE_THRESHOLD = 88;
const SWIPE_VELOCITY = 520;
const SWIPE_POWER_FACTOR = 0.2;
const SWIPE_COMMIT_SCORE = 150;
const FEED_TABS = ["All", "Projects", "People", "Open Source"];

type FeedResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

type SwipeResult = {
  matched: boolean;
  matchId: string | null;
  remaining: number;
};

export function SwipeFeed({ initialData }: { initialData: FeedResponse }) {
  const [sessionSwipeCount, setSessionSwipeCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [dragOffsetX, setDragOffsetX] = useState(0);

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

  const filteredItems = useMemo(() => {
    if (activeTab === "All") {
      return allItems;
    }

    if (activeTab === "Projects") {
      return allItems.filter((item) => item.type === "project");
    }

    if (activeTab === "People") {
      return allItems.filter((item) => item.type === "user");
    }

    return allItems.filter((item) =>
      item.type === "project"
        ? item.tags.some((tag) =>
            ["open-source", "oss", "open source"].includes(tag.toLowerCase()),
          )
        : item.interests.some((tag) =>
            ["open-source", "oss", "open source"].includes(tag.toLowerCase()),
          ),
    );
  }, [allItems, activeTab]);

  const current = filteredItems[activeIndex] ?? null;
  const next = filteredItems[activeIndex + 1] ?? null;

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
      await matchesQuery.refetch();
    }

    if (activeIndex + 4 >= filteredItems.length && feedQuery.hasNextPage) {
      void feedQuery.fetchNextPage();
    }
  }

  async function onDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    const horizontal = info.offset.x;
    const velocity = info.velocity.x;

    const swipeScore =
      Math.abs(horizontal) + Math.abs(velocity) * SWIPE_POWER_FACTOR;

    if (
      horizontal > SWIPE_THRESHOLD ||
      velocity > SWIPE_VELOCITY ||
      (horizontal > 0 && swipeScore > SWIPE_COMMIT_SCORE)
    ) {
      await controls.start({
        x: 380,
        opacity: 0,
        rotate: 11,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
      });
      controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
      setDragOffsetX(0);
      await registerSwipe("RIGHT");
      return;
    }

    if (
      horizontal < -SWIPE_THRESHOLD ||
      velocity < -SWIPE_VELOCITY ||
      (horizontal < 0 && swipeScore > SWIPE_COMMIT_SCORE)
    ) {
      await controls.start({
        x: -380,
        opacity: 0,
        rotate: -11,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
      });
      controls.set({ x: 0, y: 0, opacity: 1, rotate: 0 });
      setDragOffsetX(0);
      await registerSwipe("LEFT");
      return;
    }

    await controls.start({
      x: 0,
      rotate: 0,
      transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
    });
    setDragOffsetX(0);
  }

  return (
    <section className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden px-4 pb-24 pt-5 text-white sm:max-w-lg">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_38%),linear-gradient(180deg,#121722_0%,#090c12_100%)]" />

      <div>
        <div className="flex items-center justify-between text-sm text-white/90">
          <p className="font-semibold tracking-tight">Openflag</p>
          <p className="text-xs text-white/60">
            {matchesQuery.data?.matches.length ?? 0} matches
          </p>
        </div>

        <h2 className="mt-1 text-4xl font-semibold tracking-tight">For You</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {FEED_TABS.map((tab) => (
            <button
              key={tab}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                tab === activeTab
                  ? "border-white/30 bg-white/20 font-medium text-white"
                  : "border-transparent bg-white/5 text-white/60 hover:bg-white/10"
              }`}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setActiveIndex(0);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex-1">
        {next ? (
          <div className="pointer-events-none absolute inset-0 translate-y-3 scale-[0.98] opacity-65">
            <FeedCard item={next} current={false} />
          </div>
        ) : null}

        {current ? (
          <motion.div
            animate={controls}
            className="absolute inset-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              mass: 0.7,
            }}
            onDrag={(_, info) => setDragOffsetX(info.offset.x)}
            onDragEnd={onDragEnd}
            style={{ rotate: dragOffsetX * 0.04 }}
            whileTap={{ scale: 0.995 }}
          >
            <motion.div
              className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-emerald-300 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200"
              style={{
                opacity: Math.max(0, Math.min((dragOffsetX - 18) / 75, 1)),
              }}
            >
              Like
            </motion.div>
            <motion.div
              className="pointer-events-none absolute right-4 top-4 z-20 rounded-full border border-rose-300 bg-rose-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-rose-200"
              style={{
                opacity: Math.max(0, Math.min((-dragOffsetX - 18) / 75, 1)),
              }}
            >
              Nope
            </motion.div>
            <FeedCard
              item={current}
              current
              onOpenDetails={() => setExpandedItem(current)}
            />
          </motion.div>
        ) : (
          <Card
            className="flex h-full items-center justify-center rounded-[30px] border border-white/10 bg-[#131922] p-6"
            variant="default"
          >
            <Card.Content className="items-center gap-3 text-center">
              {feedQuery.isFetching ? <Spinner /> : null}
              <p className="text-sm font-medium text-white">
                No more cards right now.
              </p>
              <p className="max-w-sm text-sm text-white/65">
                Come back later for a fresh queue of collaborators and projects.
              </p>
            </Card.Content>
          </Card>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/55">
        <span>
          Queue {Math.min(activeIndex + 1, Math.max(filteredItems.length, 1))}/
          {Math.max(filteredItems.length, 1)}
        </span>
        <span>
          {sessionSwipeCount}/{SESSION_SWIPE_LIMIT} swipes
        </span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4">
        <Button
          className="size-14 rounded-full border border-white/20 bg-[#1b222f] text-white hover:bg-[#252f42]"
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
          X
        </Button>
        <Button
          className="size-14 rounded-full bg-white text-black hover:bg-white/90"
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
          <span className="text-lg leading-none">♥</span>
        </Button>
        <Button
          className="size-14 rounded-full border border-white/20 bg-[#1b222f] text-white hover:bg-[#252f42]"
          variant="ghost"
          isDisabled={!current}
          onPress={() => setExpandedItem(current)}
        >
          i
        </Button>
      </div>

      <DetailModal
        isOpen={Boolean(expandedItem)}
        item={expandedItem}
        onOpenChange={(open) => {
          if (!open) {
            setExpandedItem(null);
          }
        }}
      />
    </section>
  );
}

function FeedCard({
  item,
  current,
  onOpenDetails,
}: {
  item: FeedItem;
  current: boolean;
  onOpenDetails?: () => void;
}) {
  const primaryTags = item.type === "user" ? item.skills : item.requiredRoles;
  const secondaryTags = item.type === "user" ? item.interests : item.tags;
  const isProjectWithMedia =
    item.type === "project" && Boolean(item.image || item.video);

  return (
    <Card
      className="h-full overflow-hidden rounded-[30px] border border-white/10 bg-[#151b25] p-3"
      variant="default"
    >
      <div className="flex h-full flex-col gap-3">
        {item.type === "project" ? (
          isProjectWithMedia ? (
            <ProjectMedia
              className="h-[48%] min-h-55 w-full"
              image={item.image}
              title={item.title}
              video={item.video}
            />
          ) : (
            <div className="relative min-h-55 rounded-[20px] bg-gradient-to-br from-indigo-300 via-cyan-200 to-emerald-200 p-4 text-black/80">
              <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.25),transparent_48%)]" />
              <div className="relative flex h-full flex-col justify-between rounded-[16px] border border-black/10 bg-black/10 p-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-black/20 bg-black/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]">
                    No media
                  </span>
                  <span className="text-xs">
                    Score {Math.round(item.score)}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm font-semibold">
                  {item.description}
                </p>
                <p className="text-xs opacity-80">
                  Roles {item.requiredRoles.length} · Tags {item.tags.length}
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="relative min-h-55 rounded-[20px] bg-linear-to-br from-sky-300 via-cyan-200 to-emerald-200 p-4 text-black/80">
            <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.25),transparent_48%)]" />
            <div className="relative flex h-full flex-col justify-between rounded-[16px] border border-black/10 bg-black/10 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 rounded-full border border-black/15 bg-white/80">
                  <Avatar.Image
                    alt={item.name}
                    src={item.avatar ?? undefined}
                  />
                  <Avatar.Fallback>
                    {item.name.slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="truncate text-xs opacity-75">
                    @{item.username}
                  </p>
                </div>
              </div>

              <p className="line-clamp-3 text-sm font-medium">
                {item.bio ??
                  "Builder looking for collaborators and meaningful projects."}
              </p>

              <p className="text-xs opacity-80">
                Skills {item.skills.length} · Interests {item.interests.length}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 px-1 pb-1">
          <Avatar className="size-10 rounded-full">
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
                <p className="truncate text-base font-semibold tracking-tight text-white">
                  {item.type === "user" ? item.name : item.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/60">
                  {item.type === "user"
                    ? `@${item.username}`
                    : `Project by @${item.owner.username}`}
                </p>
              </div>
              <Chip size="sm" variant="soft" className="bg-white/10 text-white">
                {item.type === "user" ? "Person" : "Project"}
              </Chip>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-white/70">
              {item.type === "user"
                ? (item.bio ?? "No bio yet.")
                : item.description}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <Chip
                size="sm"
                variant="secondary"
                className="bg-white/10 text-white/80"
              >
                Score {Math.round(item.score)}
              </Chip>
              <Chip
                size="sm"
                variant="secondary"
                className="bg-white/10 text-white/80"
              >
                Active {formatRecency(item.recentActivityAt)}
              </Chip>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-1">
          {primaryTags.slice(0, 4).map((tag) => (
            <Chip
              key={tag}
              size="sm"
              variant="secondary"
              className="bg-white/10 text-white/80"
            >
              {tag}
            </Chip>
          ))}
          {secondaryTags.slice(0, 2).map((tag) => (
            <Chip
              key={tag}
              size="sm"
              variant="soft"
              className="bg-white/8 text-white/70"
            >
              {tag}
            </Chip>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <Button
            className="rounded-full bg-white/10 text-white hover:bg-white/20"
            size="sm"
            variant="ghost"
            onPress={onOpenDetails}
          >
            {current ? "Details" : "More"}
          </Button>
          <span className="text-xs text-white/55">
            {item.type === "user"
              ? `${item.skills.length} skills · ${item.interests.length} interests`
              : `${item.requiredRoles.length} roles · ${item.tags.length} tags`}
          </span>
        </div>
      </div>
    </Card>
  );
}

function formatRecency(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    return "recently";
  }

  const deltaHours = Math.max(1, Math.floor((Date.now() - time) / 3_600_000));

  if (deltaHours < 24) {
    return `${deltaHours}h`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 7) {
    return `${deltaDays}d`;
  }

  const deltaWeeks = Math.floor(deltaDays / 7);
  return `${deltaWeeks}w`;
}

function DetailModal({
  isOpen,
  item,
  onOpenChange,
}: {
  isOpen: boolean;
  item: FeedItem | null;
  onOpenChange: (isOpen: boolean) => void;
}) {
  if (!item) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur">
        <Modal.Container>
          <Modal.Dialog className="max-w-140 overflow-hidden rounded-[26px] border border-white/10 bg-[#111722] p-0 text-white">
            <Modal.CloseTrigger />
            <Modal.Header className="border-b border-white/10 px-5 py-4">
              <div>
                <Modal.Heading className="text-lg font-medium tracking-tight">
                  {item.type === "user" ? item.name : item.title}
                </Modal.Heading>
                <p className="mt-1 text-sm text-white/65">
                  {item.type === "user"
                    ? `@${item.username}`
                    : `Project by @${item.owner.username}`}
                </p>
              </div>
            </Modal.Header>
            <Modal.Body className="px-5 py-4">
              <div className="space-y-4">
                {item.type === "project" ? (
                  <ProjectMedia
                    className="h-52 w-full"
                    image={item.image}
                    title={item.title}
                    video={item.video}
                  />
                ) : null}

                <p className="text-sm text-white/80">
                  {item.type === "user"
                    ? (item.bio ?? "No bio yet.")
                    : item.description}
                </p>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                    Primary
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(item.type === "user"
                      ? item.skills
                      : item.requiredRoles
                    ).map((tag) => (
                      <Chip
                        key={tag}
                        size="sm"
                        variant="secondary"
                        className="bg-white/10 text-white/80"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                    Context
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(item.type === "user" ? item.interests : item.tags).map(
                      (tag) => (
                        <Chip
                          key={tag}
                          size="sm"
                          variant="soft"
                          className="bg-white/10 text-white/80"
                        >
                          {tag}
                        </Chip>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-t border-white/10 px-5 py-4">
              <Button
                slot="close"
                className="rounded-full bg-white text-black"
                variant="outline"
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
