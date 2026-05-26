/**
 * Preload a batch of image URLs so the caller can wait for them to be
 * decoded by the browser before flipping a loading flag off.
 *
 * Why this exists:
 *   When a list page (Feed / Explore / etc.) shows a loader that hides
 *   the moment the JSON arrives, the user sees a blank/empty card grid
 *   for ~200-800ms while avatars + cover images stream in over the
 *   network. Awaiting this helper before clearing the loader keeps the
 *   spinner visible until the whole page can actually render its
 *   pictures.
 *
 * Failure semantics:
 *   - Each image is given a hard `timeoutMs` so one broken URL can't
 *     hang the loader forever.
 *   - Errors and timeouts both *resolve* (not reject) — a broken image
 *     is a UX paper-cut, not a reason to keep the spinner spinning.
 *   - Duplicate / falsy URLs are filtered, so it's safe to call with
 *     raw `.map(item => item.foo?.avatarUrl)` output.
 */
export function preloadImages(
    urls: Array<string | null | undefined>,
    timeoutMs = 6000,
): Promise<void> {
    const unique = Array.from(
        new Set(urls.filter((u): u is string => typeof u === 'string' && u.length > 0)),
    );

    if (unique.length === 0) return Promise.resolve();

    const promises = unique.map(
        (url) =>
            new Promise<void>((resolve) => {
                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    resolve();
                };

                const img = new Image();
                img.onload = finish;
                img.onerror = finish; // treat broken images as "loaded" so spinner can clear
                img.src = url;

                // Hard per-image safety timeout. A single slow CDN response
                // shouldn't keep the whole page in a loading state.
                window.setTimeout(finish, timeoutMs);
            }),
    );

    return Promise.all(promises).then(() => undefined);
}
