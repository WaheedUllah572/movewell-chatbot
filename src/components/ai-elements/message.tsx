"use client";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import type { UIMessage } from "ai";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type {
  ComponentProps,
  HTMLAttributes,
  ReactElement,
} from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Streamdown } from "streamdown";

/* =========================================================
   MESSAGE
   ========================================================= */

export type MessageProps =
  HTMLAttributes<HTMLDivElement> & {
    from: UIMessage["role"];
  };

export const Message = ({
  className,
  from,
  ...props
}: MessageProps) => (
  <div
    className={cn(
      "group flex w-full flex-col gap-2",
      from === "user"
        ? "is-user ml-auto max-w-[95%] justify-end"
        : "is-assistant max-w-[540px]",
      className
    )}
    {...props}
  />
);

/* =========================================================
   MESSAGE CONTENT
   ========================================================= */

export type MessageContentProps =
  HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "flex w-fit min-w-0 max-w-full flex-col overflow-hidden text-sm",
      "group-[.is-user]:ml-auto",
      "group-[.is-user]:rounded-[19px]",
      "group-[.is-user]:rounded-br-[6px]",
      "group-[.is-user]:bg-secondary",
      "group-[.is-user]:px-4",
      "group-[.is-user]:py-3",
      "group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/* =========================================================
   MESSAGE ACTIONS
   ========================================================= */

export type MessageActionsProps =
  ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn(
      "flex items-center gap-1",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/* =========================================================
   MESSAGE ACTION
   ========================================================= */

export type MessageActionProps =
  ComponentProps<typeof Button> & {
    tooltip?: string;
    label?: string;
  };

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children}

      <span className="sr-only">
        {label || tooltip}
      </span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            {button}
          </TooltipTrigger>

          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

/* =========================================================
   MESSAGE BRANCH
   ========================================================= */

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (
    branches: ReactElement[]
  ) => void;
}

const MessageBranchContext =
  createContext<MessageBranchContextType | null>(
    null
  );

const useMessageBranch = () => {
  const context = useContext(
    MessageBranchContext
  );

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch"
    );
  }

  return context;
};

export type MessageBranchProps =
  HTMLAttributes<HTMLDivElement> & {
    defaultBranch?: number;
    onBranchChange?: (
      branchIndex: number
    ) => void;
  };

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] =
    useState(defaultBranch);

  const [branches, setBranches] =
    useState<ReactElement[]>([]);

  const handleBranchChange =
    useCallback(
      (newBranch: number) => {
        setCurrentBranch(newBranch);
        onBranchChange?.(newBranch);
      },
      [onBranchChange]
    );

  const goToPrevious =
    useCallback(() => {
      const newBranch =
        currentBranch > 0
          ? currentBranch - 1
          : branches.length - 1;

      handleBranchChange(newBranch);
    }, [
      currentBranch,
      branches.length,
      handleBranchChange,
    ]);

  const goToNext =
    useCallback(() => {
      const newBranch =
        currentBranch <
        branches.length - 1
          ? currentBranch + 1
          : 0;

      handleBranchChange(newBranch);
    }, [
      currentBranch,
      branches.length,
      handleBranchChange,
    ]);

  const contextValue =
    useMemo<MessageBranchContextType>(
      () => ({
        branches,
        currentBranch,
        goToNext,
        goToPrevious,
        setBranches,
        totalBranches:
          branches.length,
      }),
      [
        branches,
        currentBranch,
        goToNext,
        goToPrevious,
      ]
    );

  return (
    <MessageBranchContext.Provider
      value={contextValue}
    >
      <div
        className={cn(
          "grid w-full gap-2 [&>div]:pb-0",
          className
        )}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

/* =========================================================
   MESSAGE BRANCH CONTENT
   ========================================================= */

export type MessageBranchContentProps =
  HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const {
    currentBranch,
    setBranches,
    branches,
  } = useMessageBranch();

  const childrenArray = useMemo(
    () =>
      Array.isArray(children)
        ? children
        : [children],
    [children]
  );

  useEffect(() => {
    if (
      branches.length !==
      childrenArray.length
    ) {
      setBranches(childrenArray);
    }
  }, [
    childrenArray,
    branches,
    setBranches,
  ]);

  return childrenArray.map(
    (branch, index) => (
      <div
        className={cn(
          "grid gap-2 overflow-hidden [&>div]:pb-0",
          index === currentBranch
            ? "block"
            : "hidden"
        )}
        key={branch.key}
        {...props}
      >
        {branch}
      </div>
    )
  );
};

/* =========================================================
   BRANCH SELECTOR
   ========================================================= */

export type MessageBranchSelectorProps =
  ComponentProps<typeof ButtonGroup>;

export const MessageBranchSelector = ({
  className,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } =
    useMessageBranch();

  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        "[&>*:not(:first-child)]:rounded-l-md",
        "[&>*:not(:last-child)]:rounded-r-md",
        className
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

/* =========================================================
   BRANCH PREVIOUS
   ========================================================= */

export type MessageBranchPreviousProps =
  ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const {
    goToPrevious,
    totalBranches,
  } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? (
        <ChevronLeftIcon size={14} />
      )}
    </Button>
  );
};

/* =========================================================
   BRANCH NEXT
   ========================================================= */

export type MessageBranchNextProps =
  ComponentProps<typeof Button>;

export const MessageBranchNext = ({
  children,
  ...props
}: MessageBranchNextProps) => {
  const {
    goToNext,
    totalBranches,
  } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? (
        <ChevronRightIcon size={14} />
      )}
    </Button>
  );
};

/* =========================================================
   BRANCH PAGE
   ========================================================= */

export type MessageBranchPageProps =
  HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const {
    currentBranch,
    totalBranches,
  } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "border-none bg-transparent text-muted-foreground shadow-none",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of{" "}
      {totalBranches}
    </ButtonGroupText>
  );
};

/* =========================================================
   MESSAGE RESPONSE
   ========================================================= */

export type MessageResponseProps =
  ComponentProps<typeof Streamdown>;

const streamdownPlugins = {
  cjk,
  code,
  math,
  mermaid,
};

export const MessageResponse = memo(
  ({
    className,
    ...props
  }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full min-w-0 leading-7",

        /* Paragraphs */

        "[&>p]:my-2.5",
        "[&>p:first-child]:mt-0",
        "[&>p:last-child]:mb-0",

        /* Headings */

        "[&>h1]:mb-3",
        "[&>h1]:mt-5",
        "[&>h1]:text-base",
        "[&>h1]:font-semibold",
        "[&>h1:first-child]:mt-0",

        "[&>h2]:mb-2.5",
        "[&>h2]:mt-5",
        "[&>h2]:text-[14px]",
        "[&>h2]:font-semibold",
        "[&>h2:first-child]:mt-0",

        "[&>h3]:mb-2",
        "[&>h3]:mt-4",
        "[&>h3]:text-[13px]",
        "[&>h3]:font-semibold",
        "[&>h3:first-child]:mt-0",

        /* Lists */

        "[&>ul]:my-3",
        "[&>ol]:my-3",
        "[&>ul]:pl-5",
        "[&>ol]:pl-5",
        "[&>ul>li]:my-1.5",
        "[&>ol>li]:my-1.5",

        /* Nested lists */

        "[&_ul_ul]:my-1.5",
        "[&_ol_ol]:my-1.5",
        "[&_li>ul]:mt-1.5",
        "[&_li>ol]:mt-1.5",

        /* Strong text */

        "[&_strong]:font-semibold",
        "[&_strong]:text-foreground",

        /* Links */

        "[&_a]:font-medium",
        "[&_a]:text-primary",
        "[&_a]:underline",
        "[&_a]:underline-offset-2",
        "[&_a:hover]:opacity-75",

        /* Blockquotes */

        "[&>blockquote]:my-3",
        "[&>blockquote]:border-l-2",
        "[&>blockquote]:border-primary/30",
        "[&>blockquote]:pl-3",
        "[&>blockquote]:text-muted-foreground",

        /* Horizontal rules */

        "[&>hr]:my-4",
        "[&>hr]:border-black/[0.07]",

        /* Tables */

        "[&>table]:my-3",
        "[&>table]:w-full",
        "[&>table]:overflow-hidden",
        "[&>table]:rounded-lg",
        "[&>table]:border",
        "[&>table]:border-black/[0.07]",
        "[&_th]:bg-muted",
        "[&_th]:px-3",
        "[&_th]:py-2",
        "[&_th]:text-left",
        "[&_th]:font-semibold",
        "[&_td]:border-t",
        "[&_td]:border-black/[0.05]",
        "[&_td]:px-3",
        "[&_td]:py-2",

        /* Code */

        "[&_code]:rounded-md",
        "[&_code]:bg-black/[0.045]",
        "[&_code]:px-1.5",
        "[&_code]:py-0.5",
        "[&_code]:text-[0.9em]",
        "[&_pre]:my-3",
        "[&_pre]:overflow-x-auto",
        "[&_pre]:rounded-xl",

        /* Remove unnecessary first/last margins */

        "[&>*:first-child]:mt-0",
        "[&>*:last-child]:mb-0",

        className
      )}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children ===
      nextProps.children &&
    nextProps.isAnimating ===
      prevProps.isAnimating
);

MessageResponse.displayName =
  "MessageResponse";

/* =========================================================
   MESSAGE TOOLBAR
   ========================================================= */

export type MessageToolbarProps =
  ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);