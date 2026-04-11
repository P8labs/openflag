import { Outlet } from "react-router-dom";
import LeftBar from "./Shell/LeftBar";
import RightBar from "./Shell/RightBar";
import MobileBar from "./Shell/Mobilebar";
import { PostComposerProvider } from "./posts/PostComposerProvider";

export function AppShell() {
  return (
    <PostComposerProvider>
      <div className="min-h-screen p-2 w-full">
        <div className="mx-auto flex w-full max-w-450 items-start justify-center">
          <aside className="hidden md:flex shrink-0">
            <LeftBar />
          </aside>

          <main className="mb-16 md:mb-0 w-full min-w-0 max-w-3xl md:h-[calc(100vh-1rem)] h-[calc(100vh-5rem)] overflow-y-auto border border-secondary bg-secondary/20 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-thumb:hover]:bg-border">
            <Outlet />
          </main>

          <aside className="hidden lg:flex w-full max-w-md shrink-0">
            <RightBar />
          </aside>

          <MobileBar />
        </div>
      </div>
    </PostComposerProvider>
  );
}
