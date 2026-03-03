export const profileConfig = {
  name: "Moutaz",
  role: "Software Engineer",
  pitch:
    "I build thoughtful software — from full-stack applications to developer tools. Currently focused on web engineering and clean architecture.",
  ctas: [
    { label: "View Projects", href: "/projects", variant: "primary" as const },
    { label: "Resume", href: "/resume", variant: "secondary" as const },
  ],
  skills: [
    "TypeScript",
    "JavaScript",
    "C#",
    "Python",
    "React",
    "Astro",
    "Node.js",
    "Unity",
    "Tailwind CSS",
    ".NET",
    "Git",
    "WebGL",
  ],
  experience: [
    {
      title: "Software Engineering Intern",
      org: "Company Name",
      period: "Summer 2025",
    },
    {
      title: "B.S. Computer Science",
      org: "University Name",
      period: "2022 – 2026",
    },
  ],
} as const;
