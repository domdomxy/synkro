<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{{ $subjectLine }}</title>
<style>
    /* Gmail and most mobile clients honor media queries inside a <style> block
       even though inline styles stay the safest baseline for everything else. */
    @media only screen and (max-width: 600px) {
        .email-outer-pad { padding: 24px 12px !important; }
        .email-card { border-radius: 16px !important; width: 100% !important; }
        .email-pad-lg { padding-left: 24px !important; padding-right: 24px !important; }
    }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

{{-- Preheader: shows in the inbox preview line, hidden in the body --}}
<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    {{ $lines[0] ?? $subjectLine }}
</div>
<div style="display:none; max-height:0; overflow:hidden;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;">
<tr>
<td align="center" class="email-outer-pad" style="padding:48px 16px;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card" style="max-width:520px; background-color:#ffffff; border-radius:24px;">

        {{-- Wordmark: plain text, not SVG. Gmail (web and mobile app) strips
             inline <svg> from the rendered HTML, which left the icon tile
             empty. Text always renders, including with images disabled. --}}
        <tr>
            <td align="center" style="padding:48px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width:64px; height:64px; background-color:#4f46e5; border-radius:18px; text-align:center; vertical-align:middle;">
                            <div style="width:64px; height:64px; line-height:64px; text-align:center; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:26px; font-weight:800; color:#ffffff;">
                                S
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        {{-- Headline --}}
        <tr>
            <td align="center" class="email-pad-lg" style="padding:24px 40px 0;">
                <p style="margin:0; font-size:26px; font-weight:700; color:#111827; line-height:1.3; text-align:center;">
                    {{ $subjectLine }}
                </p>
            </td>
        </tr>

        {{-- Body --}}
        <tr>
            <td class="email-pad-lg" style="padding:20px 40px 8px;">
                <p style="margin:0 0 16px; font-size:15px; color:#6b7280; line-height:1.6; text-align:center;">
                    Hi {{ $greetingName }},
                </p>

                @foreach ($lines as $line)
                    <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.65; text-align:center;">
                        {!! \App\Support\NoteFormatter::line($line) !!}
                    </p>
                @endforeach

                @if (!empty($highlight))
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 8px; background-color:#f9fafb; border:1px solid #f0f1f5; border-radius:14px;">
                        <tr>
                            <td style="padding:20px 22px; text-align:left;">
                                @if (!empty($highlight['label']))
                                    <p style="margin:0 0 8px; font-size:11px; font-weight:700; color:#4f46e5; text-transform:uppercase; letter-spacing:.06em;">
                                        {{ $highlight['label'] }}
                                    </p>
                                @endif
                                @if (!empty($highlight['html']))
                                    <div style="margin:0; font-size:15px; color:#374151; line-height:1.65;">{!! $highlight['content'] !!}</div>
                                @else
                                    <p style="margin:0; font-size:15px; color:#374151; line-height:1.65; white-space:pre-line;">{!! \App\Support\NoteFormatter::line($highlight['content']) !!}</p>
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
            <td align="center" class="email-pad-lg" style="padding:16px 40px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="border-radius:999px; background-color:#111827;">
                            <a href="{{ $actionUrl }}" target="_blank" style="display:inline-block; padding:15px 36px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">
                                {{ $actionText }}
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        @endif

        {{-- Footer --}}
        <tr>
            <td class="email-pad-lg" style="padding:36px 40px 40px;">
                <div style="border-top:1px solid #f0f1f5; padding-top:20px;">
                    @if (!empty($footerNote))
                        <p style="margin:0; font-size:12.5px; color:#9ca3af; line-height:1.6; text-align:center;">
                            {{ $footerNote }}
                        </p>
                    @else
                        <p style="margin:0; font-size:12.5px; color:#9ca3af; line-height:1.6; text-align:center;">
                            You're receiving this because you have this email type enabled.
                            Manage your preferences in your
                            <a href="{{ route('settings.edit') }}" style="color:#4f46e5; text-decoration:underline;">notification settings</a>.
                        </p>
                    @endif
                    <p style="margin:14px 0 0; font-size:12px; color:#c1c5cd; line-height:1.6; text-align:center;">
                        Synkro · © {{ date('Y') }}
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
