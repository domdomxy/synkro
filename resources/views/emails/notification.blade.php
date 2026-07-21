<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{{ $subjectLine }}</title>
</head>
<body style="margin:0; padding:0; background-color:#eef0f4; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

{{-- Preheader: shows in the inbox preview line, hidden in the body --}}
<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    {{ $lines[0] ?? $subjectLine }}
</div>
<div style="display:none; max-height:0; overflow:hidden;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef0f4; padding:40px 16px;">
<tr>
<td align="center">

    {{-- Wordmark above the card --}}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
            <td style="font-size:14px; font-weight:700; letter-spacing:.04em; color:#6366f1; text-transform:uppercase;">
                Synkro
            </td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 24px rgba(17,24,39,0.08), 0 1px 2px rgba(17,24,39,0.06);">

        {{-- Header --}}
        <tr>
            <td style="background-color:#4338ca; background-image:linear-gradient(135deg,#4f46e5 0%,#4338ca 60%,#3730a3 100%); padding:40px 40px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                                <tr>
                                    <td style="width:44px; height:44px; background-color:#ffffff; border-radius:12px; text-align:center; vertical-align:middle; font-weight:800; color:#4338ca; font-size:20px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                                        S
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0; font-size:22px; font-weight:700; color:#ffffff; line-height:1.35;">
                                {{ $subjectLine }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        {{-- Body --}}
        <tr>
            <td style="padding:36px 40px 40px;">
                <p style="margin:0 0 18px; font-size:15px; color:#374151; line-height:1.6;">
                    Hi {{ $greetingName }},
                </p>

                @foreach ($lines as $line)
                    <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.65;">
                        {!! \App\Support\NoteFormatter::line($line) !!}
                    </p>
                @endforeach

                @if (!empty($highlight))
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px; background-color:#f8f9fc; border:1px solid #eef0f6; border-radius:14px;">
                        <tr>
                            <td width="4" style="background-color:#6366f1; border-radius:14px 0 0 14px; font-size:0; line-height:0;">&nbsp;</td>
                            <td style="padding:20px 22px;">
                                @if (!empty($highlight['label']))
                                    <p style="margin:0 0 10px; font-size:11px; font-weight:700; color:#4338ca; text-transform:uppercase; letter-spacing:.06em;">
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

                @if ($actionUrl && $actionText)
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
                        <tr>
                            <td style="border-radius:10px; background-color:#4f46e5; box-shadow:0 4px 10px rgba(79,70,229,0.35);">
                                <a href="{{ $actionUrl }}" target="_blank" style="display:inline-block; padding:14px 32px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                                    {{ $actionText }} &nbsp;→
                                </a>
                            </td>
                        </tr>
                    </table>
                @endif

                <p style="margin:32px 0 0; font-size:14px; color:#9ca3af; line-height:1.6;">
                    — The Synkro Team
                </p>
            </td>
        </tr>

        {{-- Footer --}}
        <tr>
            <td style="padding:0 40px;">
                <div style="border-top:1px solid #f0f1f5;"></div>
            </td>
        </tr>
        <tr>
            <td style="padding:22px 40px 28px;">
                @if (!empty($footerNote))
                    <p style="margin:0; font-size:12.5px; color:#9ca3af; line-height:1.6; text-align:center;">
                        {{ $footerNote }}
                    </p>
                @else
                    <p style="margin:0; font-size:12.5px; color:#9ca3af; line-height:1.6; text-align:center;">
                        You're receiving this because you have this email type enabled.
                        Manage your preferences in your
                        <a href="{{ route('settings.edit') }}" style="color:#6366f1; text-decoration:underline;">notification settings</a>.
                    </p>
                @endif
            </td>
        </tr>

    </table>

    {{-- Sub-footer, outside the card --}}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr>
            <td style="font-size:12px; color:#9ca3af; text-align:center;">
                © {{ date('Y') }} Synkro
            </td>
        </tr>
    </table>

</td>
</tr>
</table>
</body>
</html>
