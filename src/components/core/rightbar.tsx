import Link from "next/link";

export default function RightBar() {
  return (
    <div className="pt-4 flex flex-col gap-4 sticky top-0 h-max">
      <div className="text-textGray text-sm flex gap-x-4 flex-wrap">
        <Link href="/">Terms of Service</Link>
        <Link href="/">Privacy Policy</Link>
        <Link href="/">Cookie Policy</Link>
        <Link href="/">Accessibility</Link>
        <Link href="/">Ads Info</Link>
        <span>© 2026 Openflag.</span>
      </div>
    </div>
  );
}
