<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ $subjectLine }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:32px 16px;">
<tr>
<td align="center">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

    {{-- Header band --}}
    <tr>
        <td style="background-color:#4f46e5; padding:28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <span style="display:inline-block; width:32px; height:32px; background-color:#ffffff; border-radius:8px; text-align:center; line-height:32px; font-weight:700; color:#4f46e5; font-size:16px; vertical-align:middle;">S</span>
                        <span style="color:#ffffff; font-size:18px; font-weight:600; margin-left:10px; vertical-align:middle;">Synkro</span>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    {{-- Body --}}
    <tr>
        <td style="padding:32px;">
            <h1 style="margin:0 0 16px; font-size:20px; font-weight:700; color:#111827; line-height:1.4;">
                {{ $subjectLine }}
            </h1>

            <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.6;">
                Hi {{ $greetingName }},
            </p>

            @foreach ($lines as $line)
                <p style="margin:0 0 16px; font-size:15px; color:#374151; line-height:1.6;">
                    {{ $line }}
                </p>
            @endforeach

            @if (!empty($highlight))
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px; background-color:#f9fafb; border-radius:8px;">
                    <tr>
                        <td width="4" style="background-color:#4f46e5; border-radius:8px 0 0 8px; font-size:0; line-height:0;">&nbsp;</td>
                        <td style="padding:16px 20px;">
                            @if (!empty($highlight['label']))
                                <p style="margin:0 0 6px; font-size:12px; font-weight:700; color:#111827; text-transform:uppercase; letter-spacing:.03em;">
                                    {{ $highlight['label'] }}
                                </p>
                            @endif
                            @if (!empty($highlight['html']))
                                <div style="margin:0; font-size:15px; color:#374151; line-height:1.6;">{!! $highlight['content'] !!}</div>
                            @else
                                <p style="margin:0; font-size:15px; color:#374151; line-height:1.6; white-space:pre-line;">{{ $highlight['content'] }}</p>
                            @endif
                        </td>
                    </tr>
                </table>
            @endif

            @if ($actionUrl && $actionText)
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
                    <tr>
                        <td style="border-radius:8px; background-color:#4f46e5;">
                            <a href="{{ $actionUrl }}" target="_blank" style="display:inline-block; padding:12px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                                {{ $actionText }}
                            </a>
                        </td>
                    </tr>
                </table>
            @endif

            <p style="margin:24px 0 0; font-size:14px; color:#6b7280; line-height:1.6;">
                The Synkro Team
            </p>
        </td>
    </tr>

    {{-- Footer --}}
    <tr>
        <td style="padding:20px 32px; background-color:#f9fafb; border-top:1px solid #f3f4f6;">
            @if (!empty($footerNote))
                <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.6; text-align:center;">
                    {{ $footerNote }}
                </p>
            @else
                <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.6;">
                    You're receiving this because you have this email type enabled.
                    Manage your preferences in your
                    <a href="{{ route('settings.edit') }}" style="color:#4f46e5; text-decoration:underline;">notification settings</a>.
                </p>
            @endif
        </td>
    </tr>

</table>

</td>
</tr>
</table>
</body>
</html>