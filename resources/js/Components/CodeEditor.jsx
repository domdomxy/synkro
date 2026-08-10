import CodeMirror from '@uiw/react-codemirror';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { php } from '@codemirror/lang-php';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { sql } from '@codemirror/lang-sql';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { rust } from '@codemirror/lang-rust';
import { yaml } from '@codemirror/lang-yaml';
import { StreamLanguage } from '@codemirror/language';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { go } from '@codemirror/legacy-modes/mode/go';
import { perl } from '@codemirror/legacy-modes/mode/perl';
import useIsDarkMode from '@/hooks/useIsDarkMode';

// Maps a lowercase file extension to the CodeMirror language extension that
// gives it syntax highlighting. Extensions with no entry still open in the
// editor (see EDITABLE_EXTS in DeliverableViewer) - they just render as
// plain text, same as any other CodeMirror doc.
const LANGUAGE_BY_EXT = {
    js: javascript({ jsx: false }), mjs: javascript({ jsx: false }), cjs: javascript({ jsx: false }),
    jsx: javascript({ jsx: true }),
    ts: javascript({ typescript: true }),
    tsx: javascript({ jsx: true, typescript: true }),
    py: python(),
    php: php(),
    css: css(), scss: css(), less: css(),
    html: html(), htm: html(), vue: html(),
    json: json(),
    md: markdown(), markdown: markdown(),
    sql: sql(),
    c: cpp(), h: cpp(), cpp: cpp(), hpp: cpp(), cc: cpp(), cxx: cpp(),
    java: java(),
    rs: rust(),
    yml: yaml(), yaml: yaml(),
    sh: StreamLanguage.define(shell), bash: StreamLanguage.define(shell),
    rb: StreamLanguage.define(ruby),
    go: StreamLanguage.define(go),
    pl: StreamLanguage.define(perl),
};

export function getLanguageExtension(ext) {
    const lang = LANGUAGE_BY_EXT[ext?.toLowerCase()];
    return lang ? [lang] : [];
}

/**
 * Thin wrapper around CodeMirror so the rest of the app (DeliverableViewer)
 * doesn't need to know about extensions/themes directly. Follows the
 * light/dark theme the same way the rest of the app does, via
 * useIsDarkMode() (see resources/js/theme.js).
 */
export default function CodeEditor({ value, onChange, extension, readOnly = false, className = '' }) {
    const isDark = useIsDarkMode();

    return (
        <CodeMirror
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            theme={isDark ? githubDark : githubLight}
            extensions={getLanguageExtension(extension)}
            basicSetup={{ foldGutter: true, dropCursor: true, allowMultipleSelections: true }}
            className={className}
            height="100%"
            style={{ height: '100%', fontSize: '13px' }}
        />
    );
}
