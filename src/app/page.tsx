"use client";

import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  Accessibility,
  Activity,
  ArrowLeft,
  ArrowUp,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Dumbbell,
  FileText,
  Grid2X2,
  Leaf,
  LifeBuoy,
  LockKeyhole,
  Mail,
  LogOut,
  MapPin,
  MessageCircleHeart,
  Pencil,
  Phone,
  Search,
  Sparkles,
  ShieldCheck,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  type ConversationHandle,
} from "@/components/ai-elements/conversation";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { clinicConfig } from "@/lib/clinic/config";
import { clinicServices } from "@/lib/clinic/content";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { PortalSidebar } from "@/components/portal-sidebar";

/* =========================================================
   WELCOME SUGGESTIONS
   ========================================================= */

const suggestions = [
  {
    icon: MessageCircleHeart,
    eyebrow: "Explore",
    title: "Physiotherapy services",
    text: "Discover how MoveWell can support your recovery.",
  },
  {
    icon: Sparkles,
    eyebrow: "Learn",
    title: "Back & neck pain",
    text: "Learn how physiotherapy may help with common pain.",
  },
  {
    icon: CalendarDays,
    eyebrow: "Appointments",
    title: "Request a visit",
    text: "Get help requesting an appointment with MoveWell.",
  },
];

/* =========================================================
   FOLLOW-UP SUGGESTIONS
   ========================================================= */

const followUpSuggestions = [
  "What services do you offer?",
  "How do I request an appointment?",
  "Can physiotherapy help with back pain?",
];

/* =========================================================
   APPOINTMENT UI TYPES
   ========================================================= */

type AvailabilitySlot = {
  slot_start: string;
  slot_end: string;
};

type AvailabilityToolOutput = {
  status?: string;
  doctorName?: string;
  date?: string;
  slotDurationMinutes?: number;
  availableSlots?: AvailabilitySlot[];
  message?: string;
};

type DoctorAvailability = {
  doctorId?: number;
  doctorName?: string;
  date?: string;
  availableSlots?: AvailabilitySlot[];
};

type FindDoctorsWithAvailabilityOutput = {
  status?: string;
  reason?: string;
  serviceName?: string | null;
  date?: string;
  slotDurationMinutes?: number;
  doctors?: DoctorAvailability[];
  message?: string;
};

type CreateAppointmentToolOutput = {
  status?: string;
  appointmentId?: number | string;
  appointment?: {
    doctorName?: string;
    serviceName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
  };
  message?: string;
};

type ToolPartLike = {
  type: string;
  state?: string;
  output?: unknown;
};

/* =========================================================
   LOCAL APPOINTMENT FORM
   ========================================================= */

type AppointmentFormData = {
  service: string;
  name: string;
  phone: string;
  email: string;
};

type SelectedAppointmentSlot = {
  doctorName: string;
  date: string;
  slot: AvailabilitySlot;
};

/* =========================================================
   APPOINTMENT FORMATTERS
   ========================================================= */

function formatAppointmentDate(date?: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function formatAppointmentTime(time?: string) {
  if (!time) {
    return "";
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/* =========================================================
   APPOINTMENT CHANGE DETECTION
   ========================================================= */

function isAppointmentChangeRequest(text: string) {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  const changePhrases = [
    "instead",
    "change",
    "switch",
    "move",
    "different",
    "another",
    "rather",
    "reschedule",
  ];

  return changePhrases.some((phrase) =>
    normalized.includes(phrase)
  );
}

/* =========================================================
   HOME
   ========================================================= */

export default function Home() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [authUser, setAuthUser] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* =========================================================
     AUTHENTICATION GATE
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data, error } = await supabaseBrowser.auth.getUser();

      if (!mounted) {
        return;
      }

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      const metadata = data.user.user_metadata ?? {};

      setAuthUser({
        name:
          typeof metadata.full_name === "string" &&
          metadata.full_name.trim()
            ? metadata.full_name.trim()
            : "Patient",
        email: data.user.email ?? "",
        phone:
          typeof metadata.phone === "string"
            ? metadata.phone.trim()
            : "",
      });

      setAuthChecking(false);
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =========================================================
     ACCOUNT MENU
     ========================================================= */

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (!target?.closest("[data-account-menu]")) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setAccountMenuOpen(false);

    const { error } = await supabaseBrowser.auth.signOut();

    if (error) {
      setSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  /* =========================================================
     APPOINTMENT STATE
     ========================================================= */

  const [selectedAppointment, setSelectedAppointment] =
    useState<SelectedAppointmentSlot | null>(null);

  const [appointmentForm, setAppointmentForm] =
    useState<AppointmentFormData>({
      service: "",
      name: "",
      phone: "",
      email: "",
    });

  const [appointmentReview, setAppointmentReview] =
    useState(false);

  const [appointmentSubmitted, setAppointmentSubmitted] =
    useState(false);

  const [appointmentFormError, setAppointmentFormError] =
    useState("");

  /* =========================================================
     CONVERSATION REF
     ========================================================= */

  const conversationRef =
    useRef<ConversationHandle>(null);

  const shouldAutoScrollRef =
    useRef(false);

  /* =========================================================
     CHAT
     ========================================================= */

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    error,
  } = useChat();

  /* =========================================================
     STATUS
     ========================================================= */

  const isSubmitted =
    status === "submitted";

  const isStreaming =
    status === "streaming";

  const isLoading =
    isSubmitted || isStreaming;

  const hasMessages =
    messages.length > 0;

  const lastMessage =
    messages[messages.length - 1];

  /* =========================================================
     APPOINTMENT SUBMISSION ERROR
     ========================================================= */

  useEffect(() => {
    if (error && appointmentSubmitted) {
      setAppointmentSubmitted(false);
      setAppointmentFormError(
        "We could not submit the appointment request. Please review your details and try again."
      );
    }
  }, [error, appointmentSubmitted]);

  /* =========================================================
     SCROLL TO LATEST
     ========================================================= */

  const scrollToLatest =
    useCallback(() => {
      conversationRef.current?.scrollToBottom();
    }, []);

  /* =========================================================
     AUTOMATIC SCROLL
     ========================================================= */

  useEffect(() => {
    if (!hasMessages) {
      return;
    }

    if (!shouldAutoScrollRef.current) {
      return;
    }

    if (
      status === "submitted" ||
      status === "streaming"
    ) {
      const frame =
        requestAnimationFrame(() => {
          scrollToLatest();
        });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    if (status === "ready") {
      const frame =
        requestAnimationFrame(() => {
          scrollToLatest();

          window.setTimeout(() => {
            shouldAutoScrollRef.current =
              false;
          }, 300);
        });

      return () => {
        cancelAnimationFrame(frame);
      };
    }
  }, [
    messages,
    status,
    hasMessages,
    scrollToLatest,
  ]);

  /* =========================================================
     SEND MESSAGE
     ========================================================= */

  const handleSubmit = (messageText: string) => {
    const text = messageText.trim();

    if (!text || isLoading) {
      return;
    }

    /*
     * If the patient changes the date, time, doctor, or otherwise
     * asks to switch the appointment, the previous slot is no
     * longer a valid UI selection. Clear it before sending the
     * new request so the old appointment form cannot remain visible.
     */
    if (
      selectedAppointment &&
      isAppointmentChangeRequest(text)
    ) {
      setSelectedAppointment(null);
      setAppointmentReview(false);
      setAppointmentSubmitted(false);
      setAppointmentFormError("");
    }

    shouldAutoScrollRef.current = true;

    setInput("");

    sendMessage({
      text,
    });

    requestAnimationFrame(() => {
      scrollToLatest();

      requestAnimationFrame(() => {
        scrollToLatest();

        requestAnimationFrame(() => {
          scrollToLatest();
        });
      });
    });

    window.setTimeout(() => {
      scrollToLatest();
    }, 100);

    window.setTimeout(() => {
      scrollToLatest();
    }, 250);
  };

  /* =========================================================
     CHATGPT-STYLE COMPOSER
     ========================================================= */

  const resizeComposer = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, []);

  const handleComposerChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.currentTarget.value);
    requestAnimationFrame(resizeComposer);
  };

  const resetComposerHeight = () => {
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "48px";
    });
  };

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(input);
    resetComposerHeight();
  };

  const handleComposerKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!input.trim() || isLoading) return;
      handleSubmit(input);
      resetComposerHeight();
    }
  };

  const renderComposer = () => (
    <div className="shrink-0 border-t border-slate-100 bg-white/95 p-3 sm:p-4">
      <form
        onSubmit={handleComposerSubmit}
        className="relative w-full rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,45,35,.06)] transition-all duration-200 focus-within:border-emerald-400 focus-within:shadow-[0_12px_30px_rgba(8,113,93,.10)]"
      >
        <textarea
          ref={textareaRef}
          id="movewell-chat-input"
          value={input}
          onChange={handleComposerChange}
          onKeyDown={handleComposerKeyDown}
          placeholder={
            appointmentSubmitted
              ? "Appointment request submitted — start a new conversation to continue."
              : selectedAppointment
                ? "Complete the appointment steps above to continue..."
                : "Ask MoveWell anything about your care..."
          }
          disabled={isLoading}
          rows={1}
          aria-label="Message MoveWell AI"
          className="block min-h-12 max-h-[132px] w-full resize-none overflow-x-hidden overflow-y-auto rounded-[17px] border-0 bg-transparent px-4 py-3 pr-16 text-[14px] font-medium leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          className="absolute bottom-2.5 right-2.5 flex size-9 items-center justify-center rounded-full bg-[#08715d] text-white shadow-[0_4px_12px_rgba(8,113,93,.18)] transition-all duration-200 hover:bg-[#075f4f] hover:shadow-[0_6px_16px_rgba(8,113,93,.22)] active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none sm:size-10"
        >
          {isStreaming ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <ArrowUp className="size-[17px] stroke-[2.5]" />
          )}
        </button>
      </form>
      <div className="mt-2 flex justify-center px-2 text-center text-[8px] font-medium text-slate-400 sm:text-[9px]">
        <span>{clinicConfig.location} · Mon–Fri 08:00–19:00 · AI assistance</span>
      </div>
      <p className="mt-1 text-center text-[8px] leading-3 text-slate-400">
        AI assistance only · General guidance · Does not replace professional medical advice.
      </p>
    </div>
  );

  /* =========================================================
     APPOINTMENT SLOT SELECTION
     ========================================================= */

  const handleSlotSelection = (
    doctorName: string,
    date: string,
    slot: AvailabilitySlot
  ) => {
    if (isLoading) {
      return;
    }

    setSelectedAppointment({
      doctorName,
      date,
      slot,
    });

    setAppointmentReview(false);

    setAppointmentSubmitted(false);

    setAppointmentFormError("");

    shouldAutoScrollRef.current = true;

    requestAnimationFrame(() => {
      scrollToLatest();
    });
  };

  /* =========================================================
     APPOINTMENT FORM CHANGE
     ========================================================= */

  const handleAppointmentFieldChange = (
    field: keyof AppointmentFormData,
    value: string
  ) => {
    setAppointmentForm((current) => ({
      ...current,
      [field]: value,
    }));

    setAppointmentFormError("");
  };

  /* =========================================================
     APPOINTMENT FORM VALIDATION
     ========================================================= */

  const isAppointmentFormComplete =
    Boolean(
      selectedAppointment &&
        appointmentForm.service.trim() &&
        appointmentForm.name.trim() &&
        appointmentForm.phone.trim() &&
        appointmentForm.email.trim()
    );

  /* =========================================================
     REVIEW APPOINTMENT
     ========================================================= */

  const handleReviewAppointment = () => {
    if (
      !selectedAppointment ||
      !isAppointmentFormComplete ||
      isLoading
    ) {
      setAppointmentFormError(
        "Please complete all required fields before continuing."
      );
      return;
    }

    const email = appointmentForm.email.trim();

    if (
      !/^\S+@\S+\.\S+$/.test(email)
    ) {
      setAppointmentFormError(
        "Please enter a valid email address."
      );
      return;
    }

    const phoneDigits =
      appointmentForm.phone.replace(/\D/g, "");

    if (phoneDigits.length < 7) {
      setAppointmentFormError(
        "Please enter a valid phone number."
      );
      return;
    }

    setAppointmentFormError("");
    setAppointmentReview(true);
    shouldAutoScrollRef.current = true;

    requestAnimationFrame(() => {
      scrollToLatest();
    });

    window.setTimeout(() => {
      scrollToLatest();
    }, 100);
  };

  /* =========================================================
     CONFIRM APPOINTMENT
     
     Important:
     We send the complete appointment details to the AI.
     The AI still controls the actual createAppointment
     tool and must follow the explicit confirmation rule
     defined in route.ts.
     ========================================================= */

  const handleConfirmAppointment = () => {
    if (
      !selectedAppointment ||
      !isAppointmentFormComplete ||
      isLoading
    ) {
      return;
    }

    const {
      doctorName,
      date,
      slot,
    } = selectedAppointment;

    const time =
      slot.slot_start.slice(0, 5);

    const toMinutes = (value: string) => {
      const [hours, minutes] =
        value.split(":").map(Number);

      if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes)
      ) {
        return 30;
      }

      return hours * 60 + minutes;
    };

    const durationMinutes = Math.max(
      1,
      toMinutes(slot.slot_end) -
        toMinutes(slot.slot_start)
    ) || 30;

    shouldAutoScrollRef.current = true;
    setAppointmentFormError("");
    setAppointmentSubmitted(true);

    /*
     * The patient does not need to manually type the confirmation.
     * The complete form data is sent as structured request data.
     * The API route will process this payload in the next step.
     */

    sendMessage(
      {
        text: "Confirm appointment request",
      },
      {
        body: {
          appointmentRequest: {
            doctorName,
            serviceName:
              appointmentForm.service.trim(),
            date,
            startTime: time,
            durationMinutes,
            name:
              appointmentForm.name.trim(),
            phone:
              appointmentForm.phone.trim(),
            email:
              appointmentForm.email.trim(),
            confirmed: true,
          },
        },
      }
    );

    requestAnimationFrame(() => {
      scrollToLatest();

      requestAnimationFrame(() => {
        scrollToLatest();
      });
    });

    window.setTimeout(() => {
      scrollToLatest();
    }, 150);

    window.setTimeout(() => {
      scrollToLatest();
    }, 300);
  };

  const handleChangeAppointmentSlot = () => {
    if (isLoading) {
      return;
    }

    setSelectedAppointment(null);
    setAppointmentReview(false);
    setAppointmentSubmitted(false);
    setAppointmentFormError("");

    shouldAutoScrollRef.current = true;

    requestAnimationFrame(() => {
      scrollToLatest();
    });
  };

  /* =========================================================
     QUICK SUGGESTION
     ========================================================= */

  const handleSuggestionClick = (
    suggestion: string
  ) => {
    if (isLoading) {
      return;
    }

    if (
      selectedAppointment &&
      isAppointmentChangeRequest(suggestion)
    ) {
      setSelectedAppointment(null);
      setAppointmentReview(false);
      setAppointmentSubmitted(false);
      setAppointmentFormError("");
    }

    shouldAutoScrollRef.current = true;

    setInput("");

    sendMessage({
      text: suggestion,
    });

    requestAnimationFrame(() => {
      scrollToLatest();

      requestAnimationFrame(() => {
        scrollToLatest();

        requestAnimationFrame(() => {
          scrollToLatest();
        });
      });
    });

    window.setTimeout(() => {
      scrollToLatest();
    }, 100);

    window.setTimeout(() => {
      scrollToLatest();
    }, 250);
  };

  /* =========================================================
     NEW CONVERSATION
     ========================================================= */

  const handleNewConversation = () => {
    if (isLoading) {
      return;
    }

    setInput("");

    setSelectedAppointment(null);

    setAppointmentForm({
      service: "",
      name: "",
      phone: "",
      email: "",
    });

    setAppointmentReview(false);

    setAppointmentSubmitted(false);

    setAppointmentFormError("");

    shouldAutoScrollRef.current =
      false;

    setMessages([]);
  };

  /* =========================================================
     AVAILABILITY CARD
     ========================================================= */

  const renderAvailabilityCard = (
    output: AvailabilityToolOutput
  ) => {
    if (
      output.status !== "success" ||
      !output.availableSlots?.length
    ) {
      return null;
    }

    return (
      <div className="mt-3 w-full overflow-hidden rounded-[20px] border border-emerald-100 bg-white shadow-[0_8px_28px_rgba(20,50,35,0.07)]">
        {/* CARD HEADER */}

        <div className="border-b border-black/[0.045] bg-emerald-50/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-[10px] bg-emerald-100 text-emerald-700">
              <CalendarDays className="size-4" />
            </div>

            <div>
              <p className="text-[13px] font-semibold text-foreground">
                Available appointments
              </p>

              <p className="text-[11px] text-muted-foreground">
                {output.doctorName}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[12px] font-medium text-foreground">
            {formatAppointmentDate(
              output.date
            )}
          </p>

          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Select an available time
          </p>
        </div>

        {/* TIME SLOTS */}

        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
          {output.availableSlots.map(
            (slot) => {
              const time =
                slot.slot_start.slice(
                  0,
                  5
                );

              const isSelected =
                selectedAppointment?.date ===
                  output.date &&
                selectedAppointment?.doctorName ===
                  output.doctorName &&
                selectedAppointment?.slot.slot_start ===
                  slot.slot_start;

              return (
                <button
                  key={`${output.date}-${time}`}
                  type="button"
                  disabled={
                    isLoading ||
                    appointmentSubmitted
                  }
                  onClick={() =>
                    handleSlotSelection(
                      output.doctorName ??
                        "",
                      output.date ?? "",
                      slot
                    )
                  }
                  className={`rounded-[12px] border px-3 py-2.5 text-[12px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.025)] transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_5px_16px_rgba(16,185,129,0.18)]"
                      : "border-black/[0.07] bg-white text-foreground hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[0_5px_14px_rgba(16,185,129,0.10)]"
                  }`}
                >
                  {formatAppointmentTime(
                    time
                  )}
                </button>
              );
            }
          )}
        </div>
      </div>
    );
  };

  const renderDoctorsWithAvailability = (
    output: FindDoctorsWithAvailabilityOutput
  ) => {
    if (
      output.status !== "success" ||
      !output.doctors?.length
    ) {
      return null;
    }

    return (
      <div className="mt-3 w-full space-y-3">
        {output.doctors.map((doctor) => {
          if (
            !doctor.doctorName ||
            !doctor.date ||
            !doctor.availableSlots?.length
          ) {
            return null;
          }

          return (
            <div
              key={`${doctor.doctorId ?? doctor.doctorName}-${doctor.date}`}
              className="w-full"
            >
              {renderAvailabilityCard({
                status: "success",
                doctorName: doctor.doctorName,
                date: doctor.date,
                slotDurationMinutes:
                  output.slotDurationMinutes,
                availableSlots:
                  doctor.availableSlots,
              })}
            </div>
          );
        })}
      </div>
    );
  };

  /* =========================================================
     APPOINTMENT DETAILS FORM
     ========================================================= */

  const renderAppointmentForm = () => {
    if (
      !selectedAppointment ||
      appointmentReview ||
      appointmentSubmitted
    ) {
      return null;
    }

    return (
      <div className="mt-4 w-full overflow-hidden rounded-[20px] border border-black/[0.055] bg-white shadow-[0_10px_32px_rgba(20,50,35,0.08)]">
        {/* FORM HEADER */}

        <div className="border-b border-black/[0.045] bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-[11px] bg-emerald-50 text-emerald-700">
              <CalendarDays className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-foreground">
                  Complete your appointment
                </p>

                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                  Step 2 of 3
                </span>
              </div>

              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                Enter your details below. No need to type them into the chat.
              </p>
            </div>
          </div>
        </div>

        {/* SELECTED APPOINTMENT */}

        <div className="border-b border-black/[0.045] bg-emerald-50/45 px-4 py-3.5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Selected time
              </p>

              <p className="mt-1 text-[12px] font-semibold text-foreground">
                {selectedAppointment.doctorName}
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatAppointmentDate(
                  selectedAppointment.date
                )}{" "}
                ·{" "}
                {formatAppointmentTime(
                  selectedAppointment.slot.slot_start.slice(
                    0,
                    5
                  )
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleChangeAppointmentSlot
              }
              disabled={isLoading}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 disabled:pointer-events-none disabled:opacity-50"
            >
              <Pencil className="size-2.5" />
              Change time
            </button>
          </div>
        </div>

        {/* FORM */}

        <div className="space-y-3.5 p-4">
          {/* SERVICE */}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-foreground">
              Service
            </span>

            <select
              value={appointmentForm.service}
              onChange={(event) =>
                handleAppointmentFieldChange(
                  "service",
                  event.target.value
                )
              }
              disabled={isLoading}
              required
              className="h-10 w-full rounded-[11px] border border-black/[0.08] bg-white px-3 text-[12px] font-medium text-foreground outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
            >
              <option value="">
                Select a service
              </option>

              {clinicServices.map((service) => (
                <option
                  key={service.name}
                  value={service.name}
                >
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          {/* NAME */}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-foreground">
              Full name
            </span>

            <input
              type="text"
              value={appointmentForm.name}
              onChange={(event) =>
                handleAppointmentFieldChange(
                  "name",
                  event.target.value
                )
              }
              placeholder="Enter your full name"
              disabled={isLoading}
              required
              autoComplete="name"
              className="h-10 w-full rounded-[11px] border border-black/[0.08] bg-white px-3 text-[12px] font-medium text-foreground outline-none placeholder:text-gray-400 transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
            />
          </label>

          {/* PHONE */}

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Phone className="size-3 text-muted-foreground" />
              Phone number
            </span>

            <input
              type="tel"
              value={appointmentForm.phone}
              onChange={(event) =>
                handleAppointmentFieldChange(
                  "phone",
                  event.target.value
                )
              }
              placeholder="+33 ..."
              disabled={isLoading}
              required
              autoComplete="tel"
              inputMode="tel"
              className="h-10 w-full rounded-[11px] border border-black/[0.08] bg-white px-3 text-[12px] font-medium text-foreground outline-none placeholder:text-gray-400 transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
            />
          </label>

          {/* EMAIL */}

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Mail className="size-3 text-muted-foreground" />
              Email address
            </span>

            <input
              type="email"
              value={appointmentForm.email}
              onChange={(event) =>
                handleAppointmentFieldChange(
                  "email",
                  event.target.value
                )
              }
              placeholder="you@example.com"
              disabled={isLoading}
              required
              autoComplete="email"
              inputMode="email"
              className="h-10 w-full rounded-[11px] border border-black/[0.08] bg-white px-3 text-[12px] font-medium text-foreground outline-none placeholder:text-gray-400 transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
            />
          </label>

          <p className="flex items-center gap-1.5 text-[10px] leading-3.5 text-muted-foreground">
            <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
            Your contact details are used only to process this appointment request.
          </p>

          {appointmentFormError && (
            <div
              role="alert"
              className="rounded-[11px] border border-red-100 bg-red-50 px-3 py-2 text-[10px] leading-3.5 text-red-700"
            >
              {appointmentFormError}
            </div>
          )}

          {/* CONTINUE */}

          <button
            type="button"
            onClick={
              handleReviewAppointment
            }
            disabled={
              !isAppointmentFormComplete ||
              isLoading
            }
            className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground shadow-[0_6px_18px_rgba(20,50,35,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_9px_22px_rgba(20,50,35,0.16)] active:translate-y-0 disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none"
          >
            Review appointment
            <ArrowUp className="size-3.5 rotate-45" />
          </button>

          <p className="text-center text-[10px] leading-3.5 text-muted-foreground">
            Your appointment request will remain pending
            until the clinic confirms it.
          </p>
        </div>
      </div>
    );
  };

  /* =========================================================
     APPOINTMENT REVIEW CARD
     ========================================================= */

  const renderAppointmentReview = () => {
    if (
      !selectedAppointment ||
      !appointmentReview ||
      appointmentSubmitted
    ) {
      return null;
    }

    return (
      <div className="mt-4 overflow-hidden rounded-[20px] border border-emerald-200 bg-white shadow-[0_10px_34px_rgba(20,50,35,0.09)]">
        {/* HEADER */}

        <div className="border-b border-emerald-100 bg-emerald-50/70 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-foreground">
                  Review your appointment
                </p>

                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                  Step 3 of 3
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-emerald-700">
                Everything looks good? Confirm your request below.
              </p>
            </div>
          </div>
        </div>

        {/* DETAILS */}

        <div className="space-y-3.5 p-4">
          {/* THERAPIST */}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Therapist
            </p>

            <p className="mt-1 text-[13px] font-semibold">
              {selectedAppointment.doctorName}
            </p>
          </div>

          {/* SERVICE */}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Service
            </p>

            <p className="mt-1 text-[13px] font-semibold">
              {appointmentForm.service}
            </p>
          </div>

          {/* DATE / TIME */}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Date
              </p>

              <p className="mt-1 text-[12px] font-medium">
                {formatAppointmentDate(
                  selectedAppointment.date
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Time
              </p>

              <p className="mt-1 text-[12px] font-medium">
                {formatAppointmentTime(
                  selectedAppointment.slot.slot_start.slice(
                    0,
                    5
                  )
                )}
              </p>
            </div>
          </div>

          {/* CONTACT */}

          <div className="rounded-[13px] bg-gray-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Name
              </span>

              <span className="text-right text-[12px] font-medium">
                {appointmentForm.name}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Phone
              </span>

              <span className="text-right text-[12px] font-medium">
                {appointmentForm.phone}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Email
              </span>

              <span className="max-w-[65%] truncate text-right text-[12px] font-medium">
                {appointmentForm.email}
              </span>
            </div>
          </div>

          {/* CONFIRM */}

          <button
            type="button"
            onClick={
              handleConfirmAppointment
            }
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground shadow-[0_7px_20px_rgba(20,50,35,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(20,50,35,0.18)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            Confirm appointment request
          </button>

          {/* EDIT / CHANGE TIME */}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setAppointmentReview(false)
              }
              disabled={isLoading}
              className="flex h-9 items-center justify-center gap-1.5 rounded-[11px] border border-black/[0.07] bg-white text-[11px] font-medium text-muted-foreground transition-all hover:border-black/[0.12] hover:bg-gray-50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              <Pencil className="size-3" />
              Edit details
            </button>

            <button
              type="button"
              onClick={
                handleChangeAppointmentSlot
              }
              disabled={isLoading}
              className="flex h-9 items-center justify-center gap-1.5 rounded-[11px] border border-black/[0.07] bg-white text-[11px] font-medium text-muted-foreground transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:pointer-events-none disabled:opacity-50"
            >
              <CalendarDays className="size-3" />
              Change time
            </button>
          </div>

          <p className="text-center text-[10px] leading-3.5 text-muted-foreground">
            By confirming, your details will be sent to the appointment
            system. The request remains pending until the clinic confirms it.
          </p>
        </div>
      </div>
    );
  };

  /* =========================================================
     APPOINTMENT SUBMISSION STATUS
     ========================================================= */

  const renderAppointmentSubmissionStatus = () => {
    if (
      !selectedAppointment ||
      !appointmentSubmitted ||
      !isLoading
    ) {
      return null;
    }

    return (
      <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-emerald-100 bg-emerald-50/60 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CalendarDays className="size-4" />
        </div>

        <div>
          <p className="text-[12px] font-semibold text-foreground">
            Submitting appointment request
          </p>

          <p className="mt-0.5 text-[10px] leading-3.5 text-muted-foreground">
            Checking the selected slot and creating your request automatically...
          </p>
        </div>

        <div className="ml-auto flex gap-1">
          <span className="size-1.5 animate-pulse rounded-full bg-primary/50" />
          <span className="size-1.5 animate-pulse rounded-full bg-primary/50 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-pulse rounded-full bg-primary/50 [animation-delay:-0.3s]" />
        </div>
      </div>
    );
  };

  /* =========================================================
     APPOINTMENT CONFIRMATION CARD
     ========================================================= */

  const renderAppointmentConfirmation = (
    output: CreateAppointmentToolOutput
  ) => {
    if (
      output.status !== "created" ||
      !output.appointment
    ) {
      return null;
    }

    const appointment =
      output.appointment;

    return (
      <div className="mt-3 overflow-hidden rounded-[20px] border border-emerald-200 bg-white shadow-[0_10px_32px_rgba(20,50,35,0.08)]">
        {/* CARD HEADER */}

        <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50/70 px-4 py-3.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_5px_15px_rgba(16,185,129,0.20)]">
            <CheckCircle2 className="size-5" />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Appointment request created
            </p>

            <p className="text-[11px] text-emerald-700">
              Pending clinic confirmation
            </p>
          </div>
        </div>

        {/* APPOINTMENT DETAILS */}

        <div className="space-y-3 p-4">
          {/* THERAPIST */}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Therapist
            </p>

            <p className="mt-0.5 text-[13px] font-semibold">
              {appointment.doctorName}
            </p>
          </div>

          {/* SERVICE */}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Service
            </p>

            <p className="mt-0.5 text-[13px] font-semibold">
              {appointment.serviceName}
            </p>
          </div>

          {/* DATE / TIME */}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Date
              </p>

              <p className="mt-0.5 text-[12px] font-medium">
                {formatAppointmentDate(
                  appointment.date
                )}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Time
              </p>

              <p className="mt-0.5 text-[12px] font-medium">
                {formatAppointmentTime(
                  appointment.startTime
                )}
              </p>
            </div>
          </div>

          {/* APPOINTMENT ID */}

          <div className="flex items-center justify-between rounded-[12px] bg-gray-50 px-3 py-2.5">
            <span className="text-[11px] text-muted-foreground">
              Appointment ID
            </span>

            <span className="font-mono text-[11px] font-semibold text-foreground">
              {output.appointmentId}
            </span>
          </div>
        </div>

        {/* STATUS NOTE */}

        <div className="border-t border-black/[0.045] px-4 py-3">
          <p className="text-[11px] leading-4 text-muted-foreground">
            Your appointment request is pending clinic confirmation. You can view your appointment details from your patient account.
          </p>
        </div>
      </div>
    );
  };

  /* =========================================================
     UI — MODERN MOVEWELL PATIENT PORTAL
     ========================================================= */

  if (authChecking) return null;

  const patientFirstName = authUser?.name?.split(/\s+/)[0] || "there";

  const resources = [
    ["Back Pain Guide", "Tips & exercises", Activity],
    ["Posture Improvement", "Learn the basics", Accessibility],
    ["At-Home Exercises", "Stay active at home", Dumbbell],
  ] as const;

  const quickQuestions = [
    "What services do you offer?",
    "How do I book an appointment?",
    "Can physiotherapy help with back pain?",
    "What should I expect in my first visit?",
  ];

  return (
    <main className="movewell-portal min-h-[100dvh] bg-[#f7faf9] text-slate-950">
      <header className="sticky top-0 z-50 h-[74px] border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
        <div className="flex h-full">
          <div className="hidden w-[232px] shrink-0 items-center border-r border-slate-200/70 px-6 md:flex">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-[11px] bg-[#075547] text-white">
                <Leaf className="size-5" />
              </div>
              <div>
                <p className="text-[15px] font-extrabold tracking-[-.035em]">MoveWell</p>
                <p className="text-[8px] font-bold uppercase tracking-[.13em] text-slate-500">Physiotherapy Clinic</p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between px-4 sm:px-6 lg:px-7">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex items-center gap-2 md:hidden">
                <div className="flex size-9 items-center justify-center rounded-[11px] bg-[#075547] text-white"><Leaf className="size-5" /></div>
                <span className="text-[14px] font-extrabold">MoveWell</span>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("movewell-chat-input")?.focus()}
                className="hidden h-[44px] w-full max-w-[570px] items-center gap-3 rounded-[13px] border border-slate-200 bg-white px-4 text-left shadow-[0_4px_18px_rgba(15,23,42,.035)] hover:border-emerald-200 lg:flex"
              >
                <Search className="size-[18px] text-slate-400" />
                <span className="flex-1 text-[14px] font-medium text-slate-500">Search services, resources, or ask anything...</span>
                <kbd className="rounded-[7px] border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">⌘ K</kbd>
              </button>
            </div>

            <div data-account-menu className="relative ml-3 flex items-center gap-1">
              <button type="button" aria-label="Notifications" className="relative hidden size-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 sm:flex">
                <Bell className="size-[19px]" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                disabled={signingOut}
                className="flex h-[48px] items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 shadow-[0_5px_20px_rgba(15,23,42,.045)] hover:border-emerald-200 sm:gap-2.5 sm:pr-4"
              >
                <Avatar className="size-9 border border-emerald-100 bg-emerald-50">
                  <AvatarFallback className="bg-emerald-50 text-[11px] font-extrabold text-emerald-700">
                    {(authUser?.name || "P").split(/\s+/).filter(Boolean).slice(0,2).map((x) => x[0]?.toUpperCase()).join("") || "P"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-[130px] truncate text-[13px] font-bold">{authUser?.name || "Patient"}</span>
                  <span className="block text-[11px] text-slate-500">Patient Portal</span>
                </span>
                <ChevronDown className={`size-4 text-slate-400 transition ${accountMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {accountMenuOpen && (
                <div id="patient-account-menu" role="menu" className="absolute right-0 top-[58px] z-50 w-[285px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,35,27,.14)]">
                  <div className="bg-[#effaf6] px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11 border-2 border-white"><AvatarFallback className="bg-white text-emerald-700">{(authUser?.name || "P").split(/\s+/).filter(Boolean).slice(0,2).map((x) => x[0]?.toUpperCase()).join("") || "P"}</AvatarFallback></Avatar>
                      <div className="min-w-0"><p className="truncate text-[14px] font-bold">{authUser?.name || "Patient"}</p><p className="truncate text-[11px] text-slate-500">{authUser?.email || ""}</p></div>
                    </div>
                  </div>
                  <div className="p-3.5">
                    <div className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[10px]">
                      <p className="text-slate-400">Email</p><p className="truncate font-semibold">{authUser?.email || "—"}</p>
                      <p className="mt-2 text-slate-400">Phone</p><p className="font-semibold">{authUser?.phone || "—"}</p>
                    </div>
                    <button type="button" onClick={handleSignOut} disabled={signingOut} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[11px] bg-red-50 text-[11px] font-semibold text-red-600 hover:bg-red-100">
                      <LogOut className="size-3.5" />{signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-74px)]">
        <PortalSidebar onHome={handleNewConversation} />

        <section className="min-w-0 flex-1">
          {!hasMessages ? (
            <div className="mx-auto max-w-[1250px] px-4 py-5 sm:px-6 sm:py-7 xl:px-7">
              <div className="relative min-h-[275px] overflow-hidden rounded-[22px] bg-[#075547] shadow-[0_18px_45px_rgba(6,73,60,.13)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_50%,rgba(155,240,207,.22),transparent_27%),linear-gradient(110deg,#064f43,#0a604f)]" />
                <div className="absolute inset-0 opacity-[.075]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)",backgroundSize:"42px 42px"}} />
                <div className="relative flex min-h-[275px] items-center px-6 py-8 sm:px-10">
                  <div className="max-w-[700px]">
                    <p className="text-[10px] font-bold uppercase tracking-[.28em] text-emerald-200">Welcome to MoveWell</p>
                    <h2 className="mt-4 text-[34px] font-extrabold leading-[1.04] tracking-[-.055em] text-white sm:text-[42px]">
                      Hi {patientFirstName},<br />How can we help you <span className="text-emerald-200">today?</span>
                    </h2>
                    <p className="mt-4 max-w-[650px] text-[13px] leading-5.5 text-emerald-50/80 sm:text-[14px]">
                      Ask a question, explore our services, or book an appointment.<br className="hidden sm:block" /> MoveWell AI is here to support your health journey.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {[["Trusted guidance",ShieldCheck],["Personalized support",Sparkles],["Always available",CheckCircle2]].map(([label,Icon]) => (
                        <span key={label as string} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[11px] font-semibold text-white/90 ring-1 ring-white/10">
                          <Icon className="size-3.5 text-emerald-200" />{label as string}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_285px]">
                <div className="min-w-0">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {suggestions.map((suggestion,index) => {
                      const Icon=suggestion.icon;
                      const tone=["bg-emerald-50 text-emerald-700","bg-blue-50 text-blue-600","bg-orange-50 text-orange-600"][index];
                      return (
                        <button key={suggestion.text} type="button" onClick={() => handleSuggestionClick(suggestion.text)} disabled={isLoading} className="group relative min-h-[145px] rounded-[16px] border border-slate-200/80 bg-white p-5 text-left shadow-[0_6px_22px_rgba(15,23,42,.035)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,.07)] disabled:opacity-60">
                          <div className={`flex size-10 items-center justify-center rounded-[11px] ${tone}`}><Icon className="size-[19px]" /></div>
                          <ChevronRight className="absolute right-4 top-5 size-4 text-slate-300 group-hover:text-emerald-600" />
                          <p className="mt-4 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">{suggestion.eyebrow}</p>
                          <p className="mt-1.5 text-[14px] font-extrabold tracking-[-.025em]">{suggestion.title}</p>
                          <p className="mt-1.5 text-[12px] leading-4 text-slate-500">{suggestion.text}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5">
                    <h3 className="text-[14px] font-extrabold">Popular questions</h3>
                    <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {quickQuestions.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => handleSuggestionClick(q)}
                          className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          {q}
                          <ChevronRight className="size-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[16px] border border-emerald-100 bg-gradient-to-br from-[#f2fbf7] to-white p-5 shadow-[0_6px_22px_rgba(15,23,42,.03)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">
                          MoveWell AI
                        </p>
                        <h3 className="mt-1.5 text-[16px] font-extrabold tracking-[-.025em]">
                          What can I help with?
                        </h3>
                        <p className="mt-1 text-[12px] leading-4 text-slate-500">
                          Ask naturally and I can guide you through information and appointments.
                        </p>
                      </div>
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-emerald-100 text-emerald-700">
                        <Sparkles className="size-[18px]" />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {[
                        [BookOpen, "Learn", "Physiotherapy information"],
                        [CalendarDays, "Book", "Find an available appointment"],
                        [MessageCircleHeart, "Ask", "Get guidance about your care"],
                      ].map(([Icon, title, description]) => (
                        <button
                          key={title as string}
                          type="button"
                          onClick={() =>
                            handleSuggestionClick(
                              title === "Learn"
                                ? "Tell me about physiotherapy services"
                                : title === "Book"
                                  ? "I want to book an appointment"
                                  : "I have a question about my care"
                            )
                          }
                          className="group flex min-h-[72px] items-center gap-3 rounded-[12px] border border-slate-200/80 bg-white px-3.5 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_8px_20px_rgba(8,113,93,.07)]"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-emerald-50 text-emerald-700">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold">{title as string}</p>
                            <p className="mt-0.5 text-[11px] leading-3.5 text-slate-500">
                              {description as string}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="hidden space-y-4 xl:block">
                  <div className="rounded-[16px] border border-slate-200/80 bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,.035)]">
                    <div className="flex items-center justify-between"><h3 className="text-[13px] font-extrabold">Your next appointment</h3><button type="button" onClick={() => handleSuggestionClick("Show my upcoming appointments")} className="text-[12px] font-semibold text-emerald-700">View all</button></div>
                    <div className="mt-3 rounded-[12px] border border-slate-100 bg-[#fbfdfc] p-3.5">
                      <div className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-700"><CalendarDays className="size-5" /></div><div><p className="text-[11px] font-bold">No upcoming appointment</p><p className="mt-1 text-[12px] leading-4 text-slate-500">MoveWell AI can help you find a therapist and available time.</p></div></div>
                    </div>
                    <button type="button" onClick={() => handleSuggestionClick("I want to book an appointment")} className="mt-3 h-10 w-full rounded-[10px] bg-[#08715d] text-[12px] font-bold text-white hover:bg-[#075f4f]">Request a visit</button>
                  </div>

                  <div className="rounded-[16px] border border-slate-200/80 bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,.035)]">
                    <div className="flex items-center justify-between"><h3 className="text-[13px] font-extrabold">Your progress</h3><span className="text-[11px] font-semibold text-slate-300">Coming soon</span></div>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex size-[74px] items-center justify-center rounded-full border-[7px] border-emerald-50 bg-white">
                        <Clock3 className="size-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold">Care progress</p>
                        <p className="mt-1 text-[12px] leading-4 text-slate-500">
                          Progress tracking will appear here when available.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[16px] border border-slate-200/80 bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,.035)]">
                    <div className="flex items-center justify-between"><h3 className="text-[13px] font-extrabold">Health resources</h3><span className="text-[12px] font-semibold text-emerald-700">Explore</span></div>
                    <div className="mt-3 space-y-1.5">
                      {resources.map(([title,meta,Icon]) => <button key={title} type="button" onClick={() => handleSuggestionClick(`Tell me about ${title}`)} className="group flex w-full items-center gap-3 rounded-[10px] p-1.5 text-left hover:bg-slate-50"><div className="flex size-9 items-center justify-center rounded-[9px] bg-emerald-50 text-emerald-700"><Icon className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold">{title}</p><p className="text-[11px] text-slate-500">{meta}</p></div><ChevronRight className="size-3.5 text-slate-300" /></button>)}
                    </div>
                  </div>
                </aside>
              </div>

              <div className="mt-4">
                {renderComposer()}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  [Users,"Personal","Patient profile","Your account is protected"],
                  [Star,"Smart","Guided support","Personalized assistance"],
                  [LockKeyhole,"Secure","Patient privacy","Your data stays protected"],
                  [Clock3,"24/7","AI assistant","Get instant guidance"],
                ].map(([Icon,value,title,sub]) => <div key={title as string} className="flex min-h-[84px] items-center gap-3 rounded-[14px] border border-emerald-100 bg-[#f0fbf7] px-4"><div className="flex size-10 items-center justify-center rounded-full bg-[#d9f6eb] text-[#08715d]"><Icon className="size-[18px]" /></div><div><p className="text-[16px] font-extrabold">{value as string}</p><p className="text-[11px] font-semibold text-[#08715d]">{title as string}</p><p className="text-[10px] text-slate-500">{sub as string}</p></div></div>)}
              </div>

              <footer className="flex flex-col items-center justify-between gap-3 py-6 text-[11px] text-slate-400 sm:flex-row">
                <span>© 2026 MoveWell Physiotherapy Clinic. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service &nbsp; | &nbsp; Contact</span>
              </footer>
            </div>
          ) : (
            <div className="mx-auto flex h-[calc(100dvh-74px)] max-w-[1180px] flex-col px-3 py-3 sm:px-5 lg:px-6">
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[19px] border border-slate-200/80 bg-white shadow-[0_14px_45px_rgba(15,45,35,.07)]">
                <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3">
                  <button type="button" onClick={handleNewConversation} disabled={isLoading} className="flex size-9 items-center justify-center rounded-[10px] border border-slate-200 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><ArrowLeft className="size-4" /></button>
                  <div className="flex size-9 items-center justify-center rounded-[11px] bg-[#08715d] text-white"><Sparkles className="size-[17px]" /></div>
                  <div className="min-w-0 flex-1"><h2 className="truncate text-[13px] font-extrabold">MoveWell AI Assistant</h2><p className="truncate text-[9px] text-slate-500">Physiotherapy information & appointment assistance</p></div>
                  <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-semibold text-emerald-700 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" />Online</span>
                </div>
                <Conversation ref={conversationRef} className="conversation-scrollbar min-h-0 flex-1 bg-[#fbfcfc]">
                  <ConversationContent className="gap-6 px-4 py-5 pb-8 sm:px-7 sm:py-7">
                    {messages.map((msg) => {
                      const isUser=msg.role==="user";
                      const isAppointmentActionMessage=isUser&&msg.parts.some((p)=>p.type==="text"&&p.text.trim()==="Confirm appointment request");
                      const hasSuccessfulAvailabilityResult=!isUser&&msg.parts.some((part)=>{
                        if(part.type!=="tool-getAvailability"&&part.type!=="tool-findDoctorsWithAvailability") return false;
                        const t=part as unknown as ToolPartLike;
                        if(t.state!=="output-available") return false;
                        if(part.type==="tool-getAvailability"){const o=t.output as AvailabilityToolOutput|undefined;return o?.status==="success"&&Boolean(o.availableSlots?.length);}
                        const o=t.output as FindDoctorsWithAvailabilityOutput|undefined;return o?.status==="success"&&Boolean(o.doctors?.some(d=>d.availableSlots?.length));
                      });
                      const hasSuccessfulAppointmentResult=!isUser&&msg.parts.some((part)=>{if(part.type!=="tool-createAppointment")return false;const t=part as unknown as ToolPartLike;const o=t.output as CreateAppointmentToolOutput|undefined;return t.state==="output-available"&&o?.status==="created"&&Boolean(o.appointment);});
                      const structured=hasSuccessfulAvailabilityResult||hasSuccessfulAppointmentResult;
                      return <Message key={msg.id} from={msg.role} className="w-full"><div className={`flex w-full items-end gap-3 ${isUser?"justify-end":"justify-start"}`}>
                        {!isUser&&<Avatar className="size-8 shrink-0 border border-emerald-100 shadow-sm"><AvatarFallback className="bg-[#08715d] text-white"><Bot className="size-4"/></AvatarFallback></Avatar>}
                        <div className={`flex max-w-[92%] flex-col ${isUser?"items-end":"items-start"} sm:max-w-[78%]`}>
                          <span className="mb-1.5 px-1 text-[9px] font-semibold text-slate-400">{isUser?"You":"MoveWell AI"}</span>
                          <MessageContent className={structured?"w-full bg-transparent p-0 shadow-none":isAppointmentActionMessage?"rounded-[16px] border border-emerald-100 bg-emerald-50 px-4 py-3":isUser?"rounded-[17px] rounded-br-[6px] bg-[#08715d] px-4 py-3 text-white shadow-sm sm:px-5":"w-full rounded-[17px] rounded-bl-[6px] border border-slate-200 bg-white px-4 py-3.5 text-slate-800 shadow-sm sm:px-5 sm:py-4"}>
                            {msg.parts.map((part,index)=>{
                              if(part.type==="text"){if(!isUser&&structured)return null;if(isUser&&isAppointmentActionMessage)return <span key={`${msg.id}-${index}`} className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800"><CheckCircle2 className="size-4"/>Appointment request submitted</span>;if(isUser)return <span key={`${msg.id}-${index}`} className="text-[13px] leading-5.5 sm:text-[14px]">{part.text}</span>;return <MessageResponse key={`${msg.id}-${index}`} className="text-[13px] leading-5.5 sm:text-[14px]">{part.text}</MessageResponse>;}
                              if(!isUser&&part.type==="tool-getAvailability"){const t=part as unknown as ToolPartLike;if(t.state!=="output-available")return null;const o=t.output as AvailabilityToolOutput|undefined;return o?<div key={`${msg.id}-${index}`} className="w-full">{renderAvailabilityCard(o)}</div>:null;}
                              if(!isUser&&part.type==="tool-findDoctorsWithAvailability"){const t=part as unknown as ToolPartLike;if(t.state!=="output-available")return null;const o=t.output as FindDoctorsWithAvailabilityOutput|undefined;return o?<div key={`${msg.id}-${index}`} className="w-full">{renderDoctorsWithAvailability(o)}</div>:null;}
                              if(!isUser&&part.type==="tool-createAppointment"){const t=part as unknown as ToolPartLike;if(t.state!=="output-available")return null;const o=t.output as CreateAppointmentToolOutput|undefined;return o?<div key={`${msg.id}-${index}`} className="w-full">{renderAppointmentConfirmation(o)}</div>:null;}
                              return null;
                            })}
                          </MessageContent>
                          {!isUser&&msg.id===lastMessage?.id&&renderAppointmentForm()}
                          {!isUser&&msg.id===lastMessage?.id&&renderAppointmentReview()}
                          {!isUser&&msg.id===lastMessage?.id&&renderAppointmentSubmissionStatus()}
                        </div>
                        {isUser&&<Avatar className="size-8 shrink-0 border border-slate-200 bg-white shadow-sm"><AvatarFallback className="bg-white text-slate-700"><UserRound className="size-4"/></AvatarFallback></Avatar>}
                      </div></Message>;
                    })}
                    {isSubmitted&&<div className="flex items-end gap-3"><Avatar className="size-8 border border-emerald-100 shadow-sm"><AvatarFallback className="bg-[#08715d] text-white"><Bot className="size-4"/></AvatarFallback></Avatar><div><span className="mb-1.5 block px-1 text-[9px] text-slate-400">MoveWell AI</span><div className="rounded-[17px] border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-500 shadow-sm">Thinking <span className="ml-2">•••</span></div></div></div>}
                    {!isLoading&&lastMessage?.role==="assistant"&&!selectedAppointment&&<div className="pt-1"><div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[.14em] text-slate-400">Continue exploring</div><Suggestions className="gap-2 overflow-x-auto pb-1">{followUpSuggestions.map((s)=><Suggestion key={s} suggestion={s} onClick={handleSuggestionClick} className="shrink-0 rounded-full border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"/>)}</Suggestions></div>}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
                {renderComposer()}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
