// Used by forms that live inside an overlay panel (Settings/Account), where a
// real Inertia visit (post/patch/etc.) briefly replaces whatever page is
// mounted behind the panel with the standalone Settings/Account page, then
// useRouteOverlay has to detect that and visit back - a visible flash. These
// controllers just validate-and-redirect-back, so a plain fetch gets the
// same result (saved data, same validation errors) without ever navigating.
//
// Callers that show data which lives in a shared Inertia prop (e.g.
// auth.user's name/email in the header) should follow a successful save with
// router.reload({ only: [...] }) to pick up the change - that's a same-page
// partial data reload, not a navigation, so it doesn't cause the same flash.

function getCsrfToken() {
    return decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '');
}

/**
 * @param {string} url
 * @param {{method?: string, data?: object|FormData, isFormData?: boolean}} options
 * @returns {Promise<{ok: boolean, errors: Record<string, string>|null, status: number}>}
 */
export async function silentSubmit(url, { method = 'POST', data = {}, isFormData = false } = {}) {
    const headers = {
        Accept: 'application/json',
        'X-XSRF-TOKEN': getCsrfToken(),
    };

    let body;
    if (isFormData) {
        body = data instanceof FormData
            ? data
            : Object.entries(data).reduce((fd, [key, value]) => (fd.append(key, value), fd), new FormData());
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
    }

    try {
        // redirect: 'manual' stops fetch from following the controller's
        // Redirect::route(...)/back() on success - we don't want that page
        // loaded, just to know the save went through.
        const res = await fetch(url, { method, headers, body, redirect: 'manual' });

        if (res.type === 'opaqueredirect' || res.ok) {
            return { ok: true, errors: null, status: res.status };
        }

        if (res.status === 422) {
            const json = await res.json().catch(() => null);
            const errors = {};
            Object.entries(json?.errors ?? {}).forEach(([key, messages]) => {
                errors[key] = Array.isArray(messages) ? messages[0] : messages;
            });
            return { ok: false, errors, status: 422 };
        }

        return { ok: false, errors: null, status: res.status };
    } catch {
        return { ok: false, errors: null, status: 0 };
    }
}
