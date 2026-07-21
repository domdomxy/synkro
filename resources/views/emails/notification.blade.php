<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{{ $subjectLine }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

{{-- Preheader: shows in the inbox preview line, hidden in the body --}}
<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    {{ $lines[0] ?? $subjectLine }}
</div>
<div style="display:none; max-height:0; overflow:hidden;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:48px 16px;">
<tr>
<td align="center">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:24px;">

        {{-- Icon mark --}}
        <tr>
            <td align="center" style="padding:48px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="width:64px; height:64px; background-color:#4f46e5; border-radius:18px; text-align:center; vertical-align:middle;">
                            <div style="width:64px; height:64px; line-height:64px; text-align:center;">
                                <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;">
                                    <path d="M24 8.5c0-2-2-3.5-5-3.5h-4c-3 0-5.5 2-5.5 4.5S11.5 13 14 13h4c3 0 5.5 2 5.5 4.5S21 22 18 22h-4c-3 0-5-1.5-5-3.5" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
                                    <circle cx="24" cy="22" r="2.2" fill="#ffffff"/>
                                </svg>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        {{-- Headline --}}
        <tr>
            <td align="center" style="padding:24px 40px 0;">
                <p style="margin:0; font-size:26px; font-weight:700; color:#111827; line-height:1.3; text-align:center;">
                    {{ $subjectLine }}
                </p>
            </td>
        </tr>

        {{-- Body --}}
        <tr>
            <td style="padding:20px 40px 8px;">
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
            <td align="center" style="padding:16px 40px 8px;">
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
            <td style="padding:36px 40px 40px;">
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
