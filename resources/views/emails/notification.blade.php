<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>{{ $subjectLine }}</title>
<style>
    /* Gmail and most mobile clients honor media queries inside a <style> block
       even though inline styles stay the safest baseline for everything else. */
    @media only screen and (max-width: 600px) {
        .email-outer-pad { padding: 20px 10px !important; }
        .email-card { border-radius: 18px !important; width: 100% !important; }
        .email-pad-lg { padding-left: 24px !important; padding-right: 24px !important; }
        .email-brand-pad { padding: 22px 24px !important; }
        .email-heading { font-size: 22px !important; }
        /* Widen the CTA to a full-width, thumb-sized tap target instead of a
           narrow auto-width pill - easier to hit accurately on a phone and
           gives short labels ("Save", "View") the same generous hit area as
           longer ones. */
        .email-btn-table { width: 100% !important; }
        .email-btn-link { display: block !important; width: 100% !important; padding: 16px 24px !important; font-size: 15px !important; box-sizing: border-box !important; text-align: center !important; }
    }

    /* Without this, clients that auto-invert colors for dark mode (Gmail in particular)
       darken the page background (#eef0f4) and the card (#ffffff) into two different dark
       grays. Worse: Gmail's own Android/iOS app already wraps every message in its own dark
       card chrome, so giving our own outer wrapper a *third* distinct dark fill just creates
       another visible seam one layer further out - a card inside a card inside Gmail's own
       card. Making the outer background transparent lets it inherit whatever surface color
       the client is already using, and defining the card with a thin border instead of a
       background-color difference (the same approach Google's own emails use) gives it
       shape without introducing another mismatched fill. */
    @media (prefers-color-scheme: dark) {
        .email-bg { background-color:transparent !important; }
        .email-card { background-color:#111318 !important; border:1px solid #262a33 !important; }
        .email-brand-strip { background-color:#0d0e12 !important; border-bottom:1px solid #262a33 !important; }
        .email-heading { color:#f5f6f8 !important; }
        .email-greeting { color:#9297a3 !important; }
        .email-line { color:#c5c9d2 !important; }
        .email-highlight { background-color:#181a20 !important; border-color:#262a33 !important; }
        .email-highlight-accent { background-color:#6366f1 !important; }
        .email-highlight-label { color:#9ca3ff !important; }
        .email-highlight-content { color:#c5c9d2 !important; }
        .email-mono-chip { background-color:#0d0e12 !important; border-color:#33384a !important; }
        .email-highlight-mono { color:#f5f6f8 !important; }
        .email-highlight-hint { color:#7b8091 !important; }
        .email-btn-cell { background-color:#6366f1 !important; }
        .email-footer-divider { border-color:#262a33 !important; }
        .email-footer-text { color:#7b8091 !important; }
        .email-footer-text a { color:#9ca3ff !important; }
        .email-copyright { color:#4c505c !important; }
        .email-wordmark-tile { background-color:#6366f1 !important; }
    }

    /* Gmail's own dark-mode rewriting doesn't reliably honor prefers-color-scheme in every
       client (notably some Gmail Android/iOS versions), but it does tag elements it has
       auto-darkened with a data-ogsc attribute that CSS can target - so the same overrides
       are duplicated against that selector as a second line of defense. */
    [data-ogsc] .email-bg { background-color:transparent !important; }
    [data-ogsc] .email-card { background-color:#111318 !important; border:1px solid #262a33 !important; }
    [data-ogsc] .email-brand-strip { background-color:#0d0e12 !important; border-bottom:1px solid #262a33 !important; }
    [data-ogsc] .email-heading { color:#f5f6f8 !important; }
    [data-ogsc] .email-greeting { color:#9297a3 !important; }
    [data-ogsc] .email-line { color:#c5c9d2 !important; }
    [data-ogsc] .email-highlight { background-color:#181a20 !important; border-color:#262a33 !important; }
    [data-ogsc] .email-highlight-accent { background-color:#6366f1 !important; }
    [data-ogsc] .email-highlight-label { color:#9ca3ff !important; }
    [data-ogsc] .email-highlight-content { color:#c5c9d2 !important; }
    [data-ogsc] .email-mono-chip { background-color:#0d0e12 !important; border-color:#33384a !important; }
    [data-ogsc] .email-highlight-mono { color:#f5f6f8 !important; }
    [data-ogsc] .email-highlight-hint { color:#7b8091 !important; }
    [data-ogsc] .email-btn-cell { background-color:#6366f1 !important; }
    [data-ogsc] .email-footer-divider { border-color:#262a33 !important; }
    [data-ogsc] .email-footer-text { color:#7b8091 !important; }
    [data-ogsc] .email-footer-text a { color:#9ca3ff !important; }
    [data-ogsc] .email-copyright { color:#4c505c !important; }
    [data-ogsc] .email-wordmark-tile { background-color:#6366f1 !important; }

    /* Bold text produced by NoteFormatter (including bolded time indicators like
       expiry windows, grace periods, and durations) gets a very light tinted chip
       background rather than just heavier type - the eye should be able to find
       "how long do I have" at a glance without reading the whole sentence. */
    .email-line strong, .email-highlight-content strong {
        background-color: #eef0ff;
        color: #4338ca;
        padding: 1px 6px;
        border-radius: 5px;
        font-weight: 700;
    }
    @media (prefers-color-scheme: dark) {
        .email-line strong, .email-highlight-content strong { background-color: rgba(129,140,248,0.16) !important; color: #a5b4fc !important; }
    }
    [data-ogsc] .email-line strong, [data-ogsc] .email-highlight-content strong { background-color: rgba(129,140,248,0.16) !important; color: #a5b4fc !important; }
</style>
</head>
<body class="email-bg" style="margin:0; padding:0; background-color:#eef0f4; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

{{-- Preheader: shows in the inbox preview line, hidden in the body --}}
<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    {{ $lines[0] ?? $subjectLine }}
</div>
<div style="display:none; max-height:0; overflow:hidden;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#eef0f4;">
<tr>
<td align="center" class="email-outer-pad" style="padding:40px 16px;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card" style="max-width:540px; background-color:#ffffff; border-radius:20px; overflow:hidden;">

        {{-- Brand strip: a slim left-aligned wordmark row rather than a centered logo
             tile. Reads more like product mail (Linear/Stripe-style) than a centered
             "certificate" layout, and gives every message the same recognizable
             top-of-inbox silhouette even with images off, since the wordmark is
             plain text in a table cell, never an <svg> (Gmail strips inline SVG from
             rendered HTML on both web and mobile). --}}
        <tr>
            <td class="email-brand-strip email-brand-pad" style="padding:26px 40px; background-color:#f6f7fb; border-bottom:1px solid #eceef3;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                        <td valign="middle" style="padding-right:10px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td class="email-wordmark-tile" style="width:30px; height:30px; background-color:#4f46e5; border-radius:9px; text-align:center; vertical-align:middle; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:16px; font-weight:800; color:#ffffff; line-height:30px;">
                                        S
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td valign="middle" style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:15px; font-weight:700; letter-spacing:0.2px; color:#111827;">
                            Synkro
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        {{-- Headline --}}
        <tr>
            <td class="email-pad-lg" style="padding:32px 40px 0;">
                <p class="email-heading" style="margin:0; font-size:24px; font-weight:800; color:#111827; line-height:1.3; text-align:left; letter-spacing:-0.2px;">
                    {{ $subjectLine }}
                </p>
            </td>
        </tr>

        {{-- Body --}}
        <tr>
            <td class="email-pad-lg" style="padding:14px 40px 4px;">
                <p class="email-greeting" style="margin:0 0 14px; font-size:15px; color:#6b7280; line-height:1.6; text-align:left;">
                    Hi {{ $greetingName }},
                </p>

                @foreach ($lines as $line)
                    <p class="email-line" style="margin:0 0 14px; font-size:15.5px; color:#374151; line-height:1.65; text-align:left;">
                        {!! \App\Support\NoteFormatter::line($line) !!}
                    </p>
                @endforeach

                @if (!empty($highlight))
                    {{-- Left accent bar instead of a flat filled box, so a highlight reads as
                         "called out from the text" rather than another same-weight card
                         stacked under the paragraph above it. --}}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-highlight" style="margin:10px 0 10px; background-color:#f9fafb; border:1px solid #eef0f4; border-radius:12px;">
                        <tr>
                            @if (empty($highlight['mono']))
                            <td class="email-highlight-accent" width="4" style="background-color:#4f46e5; border-radius:12px 0 0 12px;">&nbsp;</td>
                            @endif
                            <td style="padding:18px 20px; text-align:{{ !empty($highlight['mono']) ? 'center' : 'left' }};">
                                @if (!empty($highlight['label']))
                                    <p class="email-highlight-label" style="margin:0 0 8px; font-size:11px; font-weight:700; color:#4f46e5; text-transform:uppercase; letter-spacing:.06em; text-align:{{ !empty($highlight['mono']) ? 'center' : 'left' }};">
                                        {{ $highlight['label'] }}
                                    </p>
                                @endif
                                @if (!empty($highlight['mono']))
                                    {{-- Password/code display: monospace and letter-spaced so every
                                         character is unambiguous, and user-select:all so a single
                                         click (where the client honors it) selects the whole value
                                         instead of requiring a careful drag or triple-click. --}}
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" class="email-mono-chip" style="padding:14px 16px; background-color:#ffffff; border:1px dashed #d1d5db; border-radius:10px;">
                                                <span class="email-highlight-mono" style="font-family:'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size:20px; font-weight:700; letter-spacing:2px; color:#111827; word-break:break-all; -webkit-user-select:all; user-select:all;">
                                                    {{ $highlight['content'] }}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                    <p class="email-highlight-hint" style="margin:10px 0 0; font-size:12px; color:#9ca3af; line-height:1.5; text-align:center;">
                                        {{ $highlight['hint'] ?? 'Tap and hold the code above to copy it, or select it manually.' }}
                                    </p>
                                @elseif (!empty($highlight['html']))
                                    <div class="email-highlight-content" style="margin:0; font-size:15px; color:#374151; line-height:1.65;">{!! $highlight['content'] !!}</div>
                                @else
                                    <p class="email-highlight-content" style="margin:0; font-size:15px; color:#374151; line-height:1.65; white-space:pre-line;">{!! \App\Support\NoteFormatter::line($highlight['content']) !!}</p>
                                @endif
                            </td>
                        </tr>
                    </table>
                @endif
            </td>
        </tr>

        {{-- CTA --}}
        @if ($actionUrl && $actionText)
        <tr>
            <td align="left" class="email-pad-lg" style="padding:14px 40px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0" class="email-btn-table">
                    <tr>
                        <td class="email-btn-cell" align="center" style="border-radius:12px; background-color:#4f46e5;">
                            <a href="{{ $actionUrl }}" target="_blank" class="email-btn-link" style="display:inline-block; padding:14px 28px; font-size:14.5px; font-weight:600; letter-spacing:.01em; color:#ffffff; text-decoration:none; border-radius:12px;">
                                {{ $actionText }} &rarr;
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        @endif

        {{-- Footer --}}
        <tr>
            <td class="email-pad-lg" style="padding:32px 40px 36px;">
                <div class="email-footer-divider" style="border-top:1px solid #eceef3; padding-top:20px;">
                    @if (!empty($footerNote))
                        <p class="email-footer-text" style="margin:0; font-size:12.5px; color:#9ca3af; line-height:1.6; text-align:left;">
                            {!! \App\Support\NoteFormatter::line($footerNote) !!}
                        </p>
                    @else
                        <p class="email-footer-text" style="margin:0; font-size:12.5px; color:#9ca3af; line-height:1.6; text-align:left;">
                            You're getting this because this notification type is turned on for your account.
                            You can turn it off anytime in your
                            <a href="{{ route('settings.edit') }}" style="color:#4f46e5; text-decoration:underline;">notification settings</a>.
                        </p>
                    @endif
                    <p class="email-copyright" style="margin:14px 0 0; font-size:12px; color:#c1c5cd; line-height:1.6; text-align:left;">
                        Synkro &middot; &copy; {{ date('Y') }}
                    </p>
                </div>
            </td>
        </tr>

    </table>

</td>
</tr>
</table>
</body>
</html>
