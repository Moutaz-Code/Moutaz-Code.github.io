export const siteConfig = {
  siteName: "Moutaz",
  siteTagline: "Software Engineer",
  siteUrl: "https://moutaz-code-github-io.vercel.app/",
  defaultOgImage: "/og/default.png",
  twitterHandle: undefined as string | undefined,

  socialLinks: {
    github: "https://github.com/Moutaz-Code",
    linkedin: "https://linkedin.com/in/moutaz",
    email: "mailto:hello@example.com",
    itch: undefined as string | undefined,
    shadertoy: undefined as string | undefined,
  },

  navItems: [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Blog", href: "/blog" },
    { label: "Tags", href: "/tags" },
    { label: "Search", href: "/search" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Resume", href: "/resume" },
  ],
} as const;

export type NavItem = (typeof siteConfig.navItems)[number];
