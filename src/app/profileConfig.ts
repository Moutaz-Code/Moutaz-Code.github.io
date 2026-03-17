export const profileConfig = {
  name: "Moutaz",
  role: "Software Engineer",
  pitch:
    "I love to build thoughtful software — from full-stack applications and videogames to developer tools. Currently focused on graphics programming and clean architecture.",
  ctas: [
    { label: "View My Projects", href: "/projects", variant: "primary" as const },
    { label: "Resume", href: "/resume", variant: "secondary" as const },
    { label: "Contact Me", href: "/contact", variant: "secondary" as const },
  ],
  // Grouped skills for clarity and easy editing
  skills: [
    {
      group: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "C#"]
    },
    {
      group: "Frameworks",
      items: ["HTML", "CSS", "Tailwind CSS", "React", "Astro", "Node.js", "Express"]
    },
    {
      group: "Tools & Platforms",
      items: ["Git", "VS Code", "Figma", "Vercel"]
    },
    {
      group: "Game & Graphics",
      items: ["Unity", "WebGL", "Three.js", "Shadertoy"]
    },
    // Add more groups as needed, e.g. Data Science, DevOps, etc.
  ],
  experience: [
    {
      title: "IT Support Administrator",
      org: "Abu Dhabi University",
      period: "Summer 2025",
    },
    {
      title: "IT Help Desk",
      org: "Abu Dhabi University",
      period: "Fall 2024",
    },
    {
      title: "B.S. Information Technology",
      org: "Abu Dhabi University",
      period: "2021 – 2026",
    },
  ],
} as const;
