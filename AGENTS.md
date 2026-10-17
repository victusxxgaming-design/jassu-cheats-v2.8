<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use TanStack's native view transitions for navigation and SiteMotion for shared content reveals; this preserves route state and avoids delaying redirects.
- Keep site-wide motion in semantic global styles and use the same animation paths for every device motion preference; this preserves the required animated experience.
