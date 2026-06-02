import {
  AUTHOR_DESCRIPTION,
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "../config";

export const DEFAULT_LOCALE = "en-US";
export const LOCALES = [DEFAULT_LOCALE, "pt-BR"];

export const LOCALE_INFO = {
  "en-US": {
    prefix: "",
    lang: "en-US",
    label: "English",
    switchLabel: "Português",
    home: "/",
    posts: "/posts/",
    about: "/about/",
    newsletter: "/newsletter/",
    rss: "/rss.xml",
    llms: "/llms.txt",
  },
  "pt-BR": {
    prefix: "/pt-BR",
    lang: "pt-BR",
    label: "Português (Brasil)",
    switchLabel: "English",
    home: "/pt-BR/",
    posts: "/pt-BR/posts/",
    about: "/pt-BR/about/",
    newsletter: "/pt-BR/newsletter/",
    rss: "/pt-BR/rss.xml",
    llms: "/pt-BR/llms.txt",
  },
};

export const COPY = {
  "en-US": {
    siteTitle: SITE_TITLE,
    siteDescription: SITE_DESCRIPTION,
    authorDescription: AUTHOR_DESCRIPTION,
    nav: {
      home: "home",
      posts: "posts",
      about: "about",
      newsletter: "newsletter",
    },
    header: {
      profileImageAlt: "Mauricio's profile photo",
    },
    home: {
      recentPosts: "Here's my most recent posts",
      rssPrefix: "You can also",
      rssLink: "subscribe with RSS!",
    },
    about: {
      pageTitle: `About ${AUTHOR_NAME} | ${SITE_TITLE}`,
      pageDescription: `Learn more about ${AUTHOR_NAME}, a software engineer writing practical notes about web development, open source, tooling, and building products.`,
      heading: `About ${AUTHOR_NAME}`,
      intro:
        "I'm a software engineer writing practical notes about web development, open source, tooling, and the lessons I learn while building products.",
      details:
        "This blog is where I collect implementation notes, deployment guides, debugging write-ups, and reflections from real projects. I write for other engineers who want pragmatic, experience-based details rather than polished marketing copy.",
      linksPrefix: "You can also find me on",
      linksSuffix: "and through the",
      newsletterLink: "newsletter",
      rssPrefix: "If you prefer feeds, subscribe to the",
      rssLink: "blog RSS feed",
    },
    posts: {
      pageTitle: `Posts | ${SITE_TITLE}`,
      pageDescription:
        "Browse Mauricio's software engineering posts about web development, open source, tooling, and practical lessons learned.",
      empty: "No posts in this language yet.",
      rssPrefix: "You can also",
      rssLink: "subscribe with RSS!",
    },
    tags: {
      title: "View posts by tag",
      heading: (tag) => `Posts tagged with \"${tag}\"`,
      pageTitle: (tag) => `Posts tagged ${tag} | ${SITE_TITLE}`,
      pageDescription: (tag) =>
        `Software engineering posts tagged ${tag} on Mauricio's blog.`,
    },
    newsletter: {
      pageTitle: `Newsletter | ${SITE_TITLE}`,
      pageDescription:
        "A newsletter about web development, software engineering, open source, and practical lessons from building products.",
      heading: "Mauricio's Newsletter",
      subtitle: "a weekly dose of code and life",
      intro:
        "Every week, I share what's on my mind about web development, software engineering, and the occasional personal story.",
      details:
        "From practical tips and lessons learned to thoughts on the industry and life as a developer — no spam, just honest content.",
      emailPlaceholder: "you@example.com",
      emailLabel: "Email address",
      submit: "Subscribe",
      submitting: "Subscribing...",
      unavailable:
        "Newsletter subscriptions are temporarily unavailable. You can still read the archive or subscribe with RSS.",
      success: "Thanks for subscribing! Check your email to confirm.",
      error: "Something went wrong. Please try again.",
      archive: "View the archive",
      rss: "Subscribe via RSS",
    },
    post: {
      dateLocale: "en-US",
      lastUpdated: "last updated on",
      heroAlt: (title) => `Hero image for ${title}`,
      imageAlt: (title) => `Social preview for ${title}`,
    },
    footer: {
      openSource: "This blog is open source",
    },
    llms: {
      corePages: "Core pages",
      posts: "Posts",
      homeDescription: "Latest posts and topic tags.",
      aboutDescription: "Author profile and contact/social links.",
      postsDescription: "Full blog archive.",
      newsletterDescription: "Email updates, archive, and newsletter RSS.",
      rssDescription: "Feed for new posts.",
      sitemapDescription: "Crawlable URL index.",
    },
  },
  "pt-BR": {
    siteTitle: "Blog do Mauricio",
    siteDescription:
      "Notas práticas de engenharia de software sobre desenvolvimento web, open source, ferramentas e lições aprendidas construindo produtos.",
    authorDescription:
      "Engenheiro de software escrevendo sobre desenvolvimento web, open source, ferramentas e lições práticas de construção de produtos.",
    nav: {
      home: "início",
      posts: "posts",
      about: "sobre",
      newsletter: "newsletter",
    },
    header: {
      profileImageAlt: "Foto de perfil do Mauricio",
    },
    home: {
      recentPosts: "Meus posts mais recentes",
      rssPrefix: "Você também pode",
      rssLink: "assinar via RSS!",
    },
    about: {
      pageTitle: `Sobre ${AUTHOR_NAME} | Blog do Mauricio`,
      pageDescription: `Conheça ${AUTHOR_NAME}, engenheiro de software que escreve notas práticas sobre desenvolvimento web, open source, ferramentas e construção de produtos.`,
      heading: `Sobre ${AUTHOR_NAME}`,
      intro:
        "Sou engenheiro de software e escrevo notas práticas sobre desenvolvimento web, open source, ferramentas e as lições que aprendo construindo produtos.",
      details:
        "Este blog reúne anotações de implementação, guias de deploy, relatos de debugging e reflexões de projetos reais. Escrevo para outras pessoas engenheiras que querem detalhes pragmáticos baseados em experiência, não copy de marketing.",
      linksPrefix: "Você também me encontra no",
      linksSuffix: "e pela",
      newsletterLink: "newsletter",
      rssPrefix: "Se preferir feeds, assine o",
      rssLink: "RSS do blog",
    },
    posts: {
      pageTitle: "Posts | Blog do Mauricio",
      pageDescription:
        "Navegue pelos posts em português sobre desenvolvimento web, open source, ferramentas e lições práticas de engenharia de software.",
      empty: "Ainda não há posts em português.",
      rssPrefix: "Você também pode",
      rssLink: "assinar via RSS!",
    },
    tags: {
      title: "Ver posts por tag",
      heading: (tag) => `Posts marcados com \"${tag}\"`,
      pageTitle: (tag) => `Posts marcados com ${tag} | Blog do Mauricio`,
      pageDescription: (tag) => `Posts em português marcados com ${tag}.`,
    },
    newsletter: {
      pageTitle: "Newsletter | Blog do Mauricio",
      pageDescription:
        "Uma newsletter sobre desenvolvimento web, engenharia de software, open source e lições práticas construindo produtos.",
      heading: "Newsletter do Mauricio",
      subtitle: "uma dose semanal de código e vida",
      intro:
        "Toda semana, compartilho o que estou pensando sobre desenvolvimento web, engenharia de software e algumas histórias pessoais.",
      details:
        "De dicas práticas e lições aprendidas a reflexões sobre a indústria e a vida como pessoa desenvolvedora — sem spam, só conteúdo honesto.",
      emailPlaceholder: "voce@exemplo.com",
      emailLabel: "Endereço de email",
      submit: "Assinar",
      submitting: "Assinando...",
      unavailable:
        "As assinaturas da newsletter estão temporariamente indisponíveis. Você ainda pode ler o arquivo ou assinar via RSS.",
      success: "Obrigado por assinar! Confira seu email para confirmar.",
      error: "Algo deu errado. Tente novamente.",
      archive: "Ver o arquivo",
      rss: "Assinar via RSS",
    },
    post: {
      dateLocale: "pt-BR",
      lastUpdated: "atualizado em",
      heroAlt: (title) => `Imagem de destaque para ${title}`,
      imageAlt: (title) => `Prévia social de ${title}`,
    },
    footer: {
      openSource: "Este blog é open source",
    },
    llms: {
      corePages: "Páginas principais",
      posts: "Posts",
      homeDescription: "Posts recentes e tags de tópicos.",
      aboutDescription: "Perfil do autor e links de contato/redes.",
      postsDescription: "Arquivo completo do blog.",
      newsletterDescription:
        "Atualizações por email, arquivo e RSS da newsletter.",
      rssDescription: "Feed para novos posts em português.",
      sitemapDescription: "Índice de URLs para crawlers.",
    },
  },
};

export function getLocaleInfo(locale = DEFAULT_LOCALE) {
  return LOCALE_INFO[locale] ?? LOCALE_INFO[DEFAULT_LOCALE];
}

export function getLocaleCopy(locale = DEFAULT_LOCALE) {
  return COPY[locale] ?? COPY[DEFAULT_LOCALE];
}

export function getPostLocale(post) {
  return post?.data?.locale ?? DEFAULT_LOCALE;
}

export function getLocalizedPosts(posts, locale) {
  return posts.filter((post) => getPostLocale(post) === locale);
}

export function sortPosts(posts) {
  return [...posts].sort(
    (a, b) =>
      new Date(b.data.updated || b.data.added).valueOf() -
      new Date(a.data.updated || a.data.added).valueOf(),
  );
}

export function localizedPath(locale, path) {
  const info = getLocaleInfo(locale);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${info.prefix}${normalizedPath}`.replace(/\/+/g, "/");
}

export function getLocaleAlternates(path) {
  return LOCALES.map((locale) => ({
    locale,
    path: localizedPath(locale, path),
  }));
}
