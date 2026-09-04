import catalog from "@/content/video-resources.pt-BR.json";

export type VideoResource = (typeof catalog.sources)[number];

const technologyByPath: Record<string, string> = {
  "html-fundamentals": "HTML",
  "css-fundamentals": "CSS",
  "javascript-fundamentals": "JavaScript",
  "python-fundamentals": "Python",
  "github-fundamentals": "Git",
  "sql-fundamentals-sqlite": "SQL",
};

export function getLessonVideoResources(lessonSlug: string, pathSlug: string): VideoResource[] {
  const technology = technologyByPath[pathSlug];
  return catalog.sources.filter((video) =>
    video.technology.split("/").includes(technology)
    && video.matches.some((match) => lessonSlug === `estudo-${match}` || lessonSlug.endsWith(`-estudo-${match}`)),
  );
}
