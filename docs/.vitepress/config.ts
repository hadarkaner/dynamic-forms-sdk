import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en",
  title: "Dynamic Forms SDK",
  description: "Forms that update without a redeploy — SDK, portal, and full documentation",
  cleanUrls: true,
  // Served at https://hadarkaner.github.io/dynamic-forms-sdk/ — a GitHub Pages
  // project site is mounted under /<repo-name>/, not the domain root.
  base: "/dynamic-forms-sdk/",
  ignoreDeadLinks: false,

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Get Started", link: "/get-started" },
      { text: "How to Use", link: "/how-to-use" },
      { text: "Examples", link: "/examples" },
      { text: "Architecture", link: "/implementation" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [{ text: "Why this exists", link: "/" }],
      },
      {
        text: "Guides",
        items: [
          { text: "Get Started", link: "/get-started" },
          { text: "How to Use (API)", link: "/how-to-use" },
          { text: "Code Examples", link: "/examples" },
        ],
      },
      {
        text: "Behind the Scenes",
        items: [
          { text: "Architecture & Implementation", link: "/implementation" },
          { text: "Testing the Full Flow", link: "/testing" },
        ],
      },
      {
        text: "Media",
        items: [
          { text: "Screenshots", link: "/screenshots" },
          { text: "Demo Videos", link: "/video" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/hadarkaner/dynamic-forms-sdk" }],
  },
});
