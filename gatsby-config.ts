import "dotenv/config"
import path from "path"

import type { GatsbyConfig } from "gatsby"

import {
  supportedLanguages,
  defaultLanguage,
  ignoreLanguages,
} from "./src/utils/languages"

import { IS_PREVIEW } from "./src/utils/env"

const siteUrl = `https://ethereum.org`

const ignoreContent = (process.env.IGNORE_CONTENT || "")
  .split(",")
  .filter(Boolean)

const ignoreTranslations = ignoreLanguages.map(
  (lang) => `**/translations\/${lang}`
)

const config: GatsbyConfig = {
  graphqlTypegen: true,
  siteMetadata: {
    // `title` & `description` pulls from respective ${lang}.json files in PageMetadata.js
    title: `ethereum.org`,
    description: `Ethereum is a global, decentralized platform for money and new kinds of applications. On Ethereum, you can write code that controls money, and build applications accessible anywhere in the world.`,
    url: siteUrl,
    siteUrl,
    author: `@ethereum`,
    defaultLanguage,
    supportedLanguages,
    editContentUrl: `https://github.com/ethereum/ethereum-org-website/tree/dev/`,
  },
  plugins: [
    // i18n support
    {
      resolve: `gatsby-theme-i18n`,
      options: {
        defaultLang: defaultLanguage,
        prefixDefault: true,
        locales: supportedLanguages.length
          ? supportedLanguages.join(" ")
          : null,
        configPath: path.resolve(`./i18n/config.json`),
      },
    },
    {
      resolve: `gatsby-theme-i18n-react-intl`,
      options: {
        defaultLocale: `./src/intl/en.json`,
      },
    },
    // Web app manifest
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `ethereum.org`,
        short_name: `ethereum.org`,
        start_url: `/en/`,
        background_color: `#ffffff`,
        theme_color: `#222222`,
        display: `standalone`,
        icon: `src/assets/favicon.png`,
      },
    },
    // Sitemap generator (ethereum.org/sitemap.xml)
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        query: `{
          site {
            siteMetadata {
              siteUrl
            }
          }
          allSitePage {
            nodes {
              path
            }
          }
        }`,
        resolvePages: ({ site, allSitePage: { nodes: allPages } }) => {
          return allPages
            .filter((page) => {
              // Filter out 404 pages
              return !page.path.includes("404")
            })
            .map((page) => ({ ...page, siteUrl: site.siteMetadata.siteUrl }))
        },
        serialize: ({ path, siteUrl }: { path: string; siteUrl: string }) => {
          const url = `${siteUrl}${path}`
          const changefreq = path.includes(`/${defaultLanguage}/`)
            ? `weekly`
            : `monthly`
          const priority = path.includes(`/${defaultLanguage}/`) ? 0.7 : 0.5
          return {
            url,
            changefreq,
            priority,
          }
        },
      },
    },
    // Ability to set custom IDs for headings (for translations)
    // i.e. https://www.markdownguide.org/extended-syntax/#heading-ids
    `gatsby-remark-autolink-headers`,
    // Image support in markdown
    `gatsby-remark-images`,
    `gatsby-remark-copy-linked-files`,
    // READING time
    "gatsby-remark-reading-time",
    // MDX support
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        // process all `.md` files as MDX
        extensions: [`.mdx`, `.md`],
        // Workaround to fix `backgroundColor` bug:
        // https://github.com/gatsbyjs/gatsby/issues/25272
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              backgroundColor: `transparent`,
              maxWidth: 1200,
            },
          },
        ],
        // Note: in order for MDX to work with gatsby-remark-plugins
        // The plugin must be listed top-level & in gatsbyRemarkPlugins
        // See: https://www.gatsbyjs.org/docs/mdx/plugins/
        gatsbyRemarkPlugins: [
          {
            // Local plugin to adjust the images urls of the translated md files
            resolve: path.resolve(`./plugins/gatsby-remark-image-urls`),
          },
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              enableCustomId: true,
              elements: [`h1`, `h2`, `h3`, `h4`],
              className: `header-anchor`,
            },
          },
          {
            resolve: `gatsby-remark-images`,
            options: {
              backgroundColor: `transparent`,
              maxWidth: 1200,
            },
          },
          {
            resolve: `gatsby-remark-copy-linked-files`,
            options: {
              maxWidth: 1200,
            },
          },
        ],
        remarkPlugins: [],
      },
    },
    // SEO tags
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-react-helmet-canonical-urls`,
      options: {
        siteUrl,
        noQueryString: true,
      },
    },
    // Needed for `gatsby-plugin-image`
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    // SVG support
    {
      resolve: "gatsby-plugin-react-svg",
      options: {
        rule: {
          include: /assets/,
        },
      },
    },
    // CSS in JS
    `gatsby-plugin-styled-components`,
    // Source assets
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `assets`,
        path: path.resolve(`src/assets`),
      },
    },
    // Process files from /src/content/ (used in gatsby-node.js)
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `content`,
        path: path.resolve(`src/content`),
        ignore: [...ignoreContent, ...ignoreTranslations],
      },
    },
    // Source data
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `data`,
        path: path.resolve(`src/data`),
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: path.resolve(`src/data/translation-reports`),
      },
    },
    // Process files within /src/data/
    `gatsby-transformer-csv`,
    // Process JSON files
    `gatsby-transformer-json`,
    // Add git information on File fields from latest commit: date, author and email
    // Used for `Last updated` fields
    {
      resolve: `gatsby-transformer-gitinfo`,
      options: {
        include: /\.md$|\.csv/i, // Only .md & .csv files
      },
    },
    // Needed for Gatsby Cloud redirect support
    {
      resolve: `gatsby-plugin-gatsby-cloud`,
      options: {
        generateMatchPathRewrites: false,
      },
    },
    // Creates `_redirects` & `_headers` build files for Netlify
    {
      resolve: `gatsby-plugin-netlify`,
      options: {
        generateMatchPathRewrites: false,
      },
    },
  ],
  // https://www.gatsbyjs.com/docs/reference/release-notes/v2.28/#feature-flags-in-gatsby-configjs
  flags: {
    FAST_DEV: true, // DEV_SSR, QUERY_ON_DEMAND & LAZY_IMAGES
  },
}

// Avoid loading Matomo in preview deploys since NODE_ENV is `production` in
// there and it will send testing data as production otherwise
if (!IS_PREVIEW) {
  config.plugins = [
    ...(config.plugins || []),
    // Matomo analtyics
    {
      resolve: "gatsby-plugin-matomo",
      options: {
        siteId: "4",
        matomoUrl: "https://matomo.ethereum.org",
        siteUrl,
        matomoPhpScript: "matomo.php",
        matomoJsScript: "matomo.js",
        trackLoad: false,
      },
    },
  ]
}

export default config
