import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  pathClassName?: string;
}

export function Logo({ pathClassName, ...props }: LogoProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2L21.196 7V17L12 22L2.804 17V7L12 2Z"
        className={cn("fill-primary/10", pathClassName)}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 8L15.5 16M15.5 8L8.5 16"
        className={cn("stroke-primary", pathClassName)}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="8.5"
        cy="8"
        r="1.5"
        className={cn("fill-primary", pathClassName)}
      />
      <circle
        cx="15.5"
        cy="8"
        r="1.5"
        className={cn("fill-primary", pathClassName)}
      />
      <circle
        cx="8.5"
        cy="16"
        r="1.5"
        className={cn("fill-primary", pathClassName)}
      />
      <circle
        cx="15.5"
        cy="16"
        r="1.5"
        className={cn("fill-primary", pathClassName)}
      />

      <path
        d="M12 2L21.196 7V17L12 22L2.804 17V7L12 2Z"
        className={cn("stroke-primary", pathClassName)}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
} 