"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { ArrowDownIcon, DownloadIcon } from "lucide-react";
import type {
  ComponentProps,
  ReactNode,
} from "react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
} from "react";
import {
  StickToBottom,
  useStickToBottomContext,
} from "use-stick-to-bottom";

/* =========================================================
   CONVERSATION HANDLE
   ========================================================= */

export type ConversationHandle = {
  scrollToBottom: () => void;
};

/* =========================================================
   CONVERSATION PROPS
   ========================================================= */

export type ConversationProps = ComponentProps<
  typeof StickToBottom
>;

/* =========================================================
   INTERNAL CONTROLLER
   ========================================================= */

const ConversationController = forwardRef<
  ConversationHandle
>(function ConversationController(_, ref) {
  const {
    scrollToBottom,
  } = useStickToBottomContext();

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
    }),
    [scrollToBottom]
  );

  return null;
});

ConversationController.displayName =
  "ConversationController";

/* =========================================================
   CONVERSATION
   ========================================================= */

export const Conversation = forwardRef<
  ConversationHandle,
  ConversationProps
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <StickToBottom
        className={cn(
          "relative flex min-h-0 flex-1 overflow-y-hidden",
          className
        )}
        initial="smooth"
        resize="smooth"
        role="log"
        {...props}
      >
        {(context) => (
          <>
            <ConversationController
              ref={ref}
            />

            {typeof children === "function"
              ? children(context)
              : children}
          </>
        )}
      </StickToBottom>
    );
  }
);

Conversation.displayName = "Conversation";

/* =========================================================
   CONVERSATION CONTENT
   ========================================================= */

export type ConversationContentProps =
  ComponentProps<
    typeof StickToBottom.Content
  >;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => {
  return (
    <StickToBottom.Content
      className={cn(
        "flex flex-col gap-8 p-4",
        className
      )}
      {...props}
    />
  );
};

/* =========================================================
   EMPTY STATE
   ========================================================= */

export type ConversationEmptyStateProps =
  ComponentProps<"div"> & {
    title?: string;
    description?: string;
    icon?: ReactNode;
  };

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}

          <div className="space-y-1">
            <h3 className="text-sm font-medium">
              {title}
            </h3>

            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* =========================================================
   SCROLL TO BOTTOM BUTTON
   ========================================================= */

export type ConversationScrollButtonProps =
  ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const {
    isAtBottom,
    scrollToBottom,
  } = useStickToBottomContext();

  const handleScrollToBottom =
    useCallback(() => {
      scrollToBottom();
    }, [scrollToBottom]);

  if (isAtBottom) {
    return null;
  }

  return (
    <Button
      className={cn(
        "absolute bottom-4 left-1/2 translate-x-[-50%] rounded-full shadow-md dark:bg-background dark:hover:bg-muted",
        className
      )}
      onClick={handleScrollToBottom}
      size="icon"
      type="button"
      variant="outline"
      {...props}
    >
      <ArrowDownIcon className="size-4" />
    </Button>
  );
};

/* =========================================================
   MESSAGE TEXT
   ========================================================= */

const getMessageText = (
  message: UIMessage
): string => {
  return message.parts
    .filter(
      (part) => part.type === "text"
    )
    .map((part) => part.text)
    .join("");
};

/* =========================================================
   DOWNLOAD PROPS
   ========================================================= */

export type ConversationDownloadProps =
  Omit<
    ComponentProps<typeof Button>,
    "onClick"
  > & {
    messages: UIMessage[];
    filename?: string;
    formatMessage?: (
      message: UIMessage,
      index: number
    ) => string;
  };

/* =========================================================
   DEFAULT MESSAGE FORMAT
   ========================================================= */

const defaultFormatMessage = (
  message: UIMessage
): string => {
  const roleLabel =
    message.role
      .charAt(0)
      .toUpperCase() +
    message.role.slice(1);

  return `**${roleLabel}:** ${getMessageText(
    message
  )}`;
};

/* =========================================================
   MESSAGES TO MARKDOWN
   ========================================================= */

export const messagesToMarkdown = (
  messages: UIMessage[],
  formatMessage: (
    message: UIMessage,
    index: number
  ) => string = defaultFormatMessage
): string => {
  return messages
    .map((message, index) =>
      formatMessage(message, index)
    )
    .join("\n\n");
};

/* =========================================================
   DOWNLOAD CONVERSATION
   ========================================================= */

export const ConversationDownload = ({
  messages,
  filename = "conversation.md",
  formatMessage = defaultFormatMessage,
  className,
  children,
  ...props
}: ConversationDownloadProps) => {
  const handleDownload = useCallback(() => {
    const markdown =
      messagesToMarkdown(
        messages,
        formatMessage
      );

    const blob = new Blob(
      [markdown],
      {
        type: "text/markdown",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.append(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }, [
    messages,
    filename,
    formatMessage,
  ]);

  return (
    <Button
      className={cn(
        "absolute right-4 top-4 rounded-full dark:bg-background dark:hover:bg-muted",
        className
      )}
      onClick={handleDownload}
      size="icon"
      type="button"
      variant="outline"
      {...props}
    >
      {children ?? (
        <DownloadIcon className="size-4" />
      )}
    </Button>
  );
};