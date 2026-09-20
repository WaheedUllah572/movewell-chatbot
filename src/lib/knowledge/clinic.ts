export const clinicKnowledge = {
  clinic: {
    name: "MoveWell Physiotherapy Clinic",
    location: "Mulhouse, France",
    phone: "+33 3 89 00 00 00",
    email: "contact@movewell-demo.fr",
    hours: {
      monday: "08:00–19:00",
      tuesday: "08:00–19:00",
      wednesday: "08:00–19:00",
      thursday: "08:00–19:00",
      friday: "08:00–19:00",
      saturday: "09:00–13:00",
      sunday: "Closed",
    },
  },

  services: [
    {
      name: "General Physiotherapy",
      description:
        "Assessment and rehabilitation support for common musculoskeletal problems.",
    },
    {
      name: "Back & Neck Pain",
      description:
        "Exercise-based rehabilitation and mobility support for back and neck problems.",
    },
    {
      name: "Sports Rehabilitation",
      description:
        "Recovery and return-to-sport support following sports-related injuries.",
    },
    {
      name: "Post-Surgery Rehabilitation",
      description:
        "Rehabilitation support following approved surgical procedures.",
    },
    {
      name: "Therapeutic Exercise",
      description:
        "Personalized movement and strengthening exercises based on individual needs.",
    },
    {
      name: "Mobility & Injury Prevention",
      description:
        "Movement-focused support designed to improve mobility and reduce injury risk.",
    },
  ],

  therapists: [
    {
      name: "Dr. Sophie Martin",
      specialties: [
        "Musculoskeletal physiotherapy",
        "Back and neck rehabilitation",
      ],
      availability: "Monday–Friday",
    },
    {
      name: "Thomas Bernard",
      specialties: [
        "Sports rehabilitation",
        "Injury prevention",
      ],
      availability: "Monday, Wednesday, Friday",
    },
  ],

  appointments: {
    process: [
      "Patient chooses a preferred date and time.",
      "The assistant collects basic contact information.",
      "An appointment request is prepared.",
      "Clinic staff confirms the appointment.",
    ],
    requiredInformation: [
      "Reason for appointment",
      "Preferred date",
      "Preferred time",
      "Full name",
      "Phone number",
      "Email address",
    ],
    status:
      "Appointment information is for demonstration purposes only. The chatbot does not directly confirm appointments.",
  },

  safety: {
    role:
      "The assistant provides general physiotherapy information and administrative assistance.",
    limitations: [
      "It does not diagnose medical conditions.",
      "It does not prescribe or recommend medication dosages.",
      "It does not replace assessment by a qualified healthcare professional.",
      "It must not claim that a patient has been examined.",
      "Urgent or potentially serious symptoms should be directed to appropriate urgent medical care.",
    ],
  },

  generalInformation: [
    {
      topic: "Physiotherapy",
      content:
        "Physiotherapy can support movement, rehabilitation, mobility, strength, and recovery from various musculoskeletal conditions and injuries.",
    },
    {
      topic: "Back pain",
      content:
        "Physiotherapy may support people with back pain through assessment, movement education, therapeutic exercise, and rehabilitation. Individual assessment is important because causes and appropriate management can vary.",
    },
    {
      topic: "Sports rehabilitation",
      content:
        "Sports rehabilitation focuses on recovery, restoring movement and strength, and supporting a gradual return to activity.",
    },
  ],
} as const;