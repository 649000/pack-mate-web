import Link from "next/link";

const Logo = () => {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 leading-none"
      aria-label="Pack Mate home"
    >
      <svg
        className="size-5 text-primary"
        viewBox="15 15 20 30"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g fill="currentColor">
          <rect x="15" y="15" width="10" height="10" rx="2" opacity="0.5" />
          <rect x="25" y="25" width="10" height="10" rx="2" opacity="0.75" />
          <rect x="15" y="35" width="10" height="10" rx="2" opacity="1" />
        </g>
      </svg>
      <span className="font-heading text-xl font-bold tracking-tight text-foreground">
        Pack Mate
      </span>
    </Link>
  );
};

export default Logo;
