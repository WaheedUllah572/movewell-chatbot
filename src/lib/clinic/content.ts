export const clinicServices = [
  {
    name: "General Physiotherapy",
    description:
      "Assessment and rehabilitation for common musculoskeletal problems.",
  },
  {
    name: "Back & Neck Pain",
    description:
      "Exercise-based rehabilitation and mobility support.",
  },
  {
    name: "Sports Rehabilitation",
    description:
      "Recovery and return-to-sport support.",
  },
  {
    name: "Post-Surgery Rehabilitation",
    description:
      "Rehabilitation following approved surgical procedures.",
  },
  {
    name: "Therapeutic Exercise",
    description:
      "Personalized movement and strengthening programs.",
  },
  {
    name: "Mobility & Injury Prevention",
    description:
      "Exercises to improve movement and reduce injury risk.",
  },
] as const;

export const clinicTherapists = [
  {
    name: "Dr. Sophie Martin",
    focus: [
      "Musculoskeletal physiotherapy",
      "Back and neck rehabilitation",
    ],
    availability: "Monday–Friday",
  },
  {
    name: "Thomas Bernard",
    focus: [
      "Sports rehabilitation",
      "Injury prevention",
    ],
    availability: "Monday, Wednesday, Friday",
  },
] as const;