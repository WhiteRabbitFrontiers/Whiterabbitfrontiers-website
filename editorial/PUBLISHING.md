# Radar publishing workflow

GitHub remains the source of truth; Vercel continues to deploy the production build to the existing domain. No hosting or DNS changes are required. Run `npm run build`; the output directory is `dist`.

## Research → review → approval → publication

1. Keep confidential working research outside this repository: this GitHub repository is public. Existing `radar/` notes and editorial-system branches are publicly accessible in GitHub even when absent from the website. Neither research directory is copied to the website build.
2. After approval to store the material in this public repository, prepare the reader-facing article body in `editorial/articles/<slug>.md`. Supported Markdown: headings, paragraphs, bold, italic, bullet lists, and `[label](https://...)` source links. Raw HTML is escaped. Tables and code fences are rejected.
3. Add its metadata to `editorial/publication.json` with `status: "review"` and `approvedRevision: null`. Every article needs a slug, title, summary, source path, category, date, evidence status, existing WebP artwork, and meaningful image alternative text. The date is the editorial date, not an automatic claim of first publication.
4. Run `npm run preview:editorial`. It writes a **private local review build** to `/tmp/wrf-private-preview`, including review articles and their cards. Never deploy this directory or serve it on a public preview URL. Open it through a private/local review session. `dist` always remains the production destination.
5. Review exact wording, sources, evidence rating, artwork and destination with Wendy. Article, card, date, evidence and artwork selection are included in the printed SHA-256 revision. Research approval is not publication approval.
6. After Wendy approves that exact revision, set `status: "published"` and paste its printed revision into `approvedRevision`. Run `npm run test:publishing` and `npm run build`. A later content or metadata edit invalidates approval and blocks the build until reviewed again.
7. Submit and merge the approved change into `main`. Vercel's existing GitHub integration deploys `dist`. Confirm the resulting public article and Radar category link; do not equate a merged commit with a verified deployment.

An approved article automatically receives a reader-facing HTML page and a Radar card in its category. There is no separate page-copy list or manual card step for new articles. Supported categories: `intelligence`, `mind`, `life`, `matter`, `earth`, `society`.

## Existing pages and privacy

`pages` explicitly lists the six grandfathered public HTML pages. New generated articles belong in `articles`, not in `pages`. Referenced root WebP images are copied automatically. The build checks local page links, anchors and images, rejects unsafe paths, cleans stale output and excludes draft Markdown, editorial registers, repository configuration and unreferenced files. Do not replace this with a recursive repository copy.

The approval hash binds the article metadata and Markdown revision, including the artwork filename. Existing artwork files must not be overwritten to bypass artwork review. A public image change and template changes require their own review in the pull request.

The production build never includes articles marked `draft` or `review`. The JSON manifest and all research sources remain outside `dist`. No email is sent by this workflow. Newsletter signup confirmation and delivery need a separate end-to-end test.


## Initial rollout

The manifest starts with no new articles. Existing six pages are preserved. ER-100 and the AI special edition remain outside this change; adding their public source and approving their website publication require separate editorial decisions. Keep private review files outside the public repository.
