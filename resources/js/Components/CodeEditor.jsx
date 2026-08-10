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
import { search, setSearchQuery, getSearchQuery, findNext, findPrevious, closeSearchPanel, SearchQuery } from '@codemirror/search';
import { EditorView } from '@codemirror/view';
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

// The default CodeMirror find/replace panel is unstyled and docks full-width
// under the toolbar, unlike the compact floating find widget most editors
// (VS Code included) use. `createPanel` lets us swap in our own DOM/markup
// while still running on @codemirror/search's built-in match-highlighting,
// SearchQuery state, and find-next/previous commands - so behavior (Mod-F to
// open, Enter/Shift-Enter to step, Escape to close, live highlighting) stays
// exactly the same, only the widget's look changes.
function svgIcon(pathData, size = 13) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.25');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    svg.appendChild(path);
    return svg;
}

function makeIconButton(pathData, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cm-vsFindIconBtn';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.appendChild(svgIcon(pathData));
    return btn;
}

function makeToggleButton(text, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cm-vsFindToggleBtn';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed', 'false');
    btn.title = label;
    btn.textContent = text;
    return btn;
}

function buildFindPanel(view) {
    const startQuery = getSearchQuery(view.state);

    const dom = document.createElement('div');
    dom.className = 'cm-vsFindPanel';

    const inputWrap = document.createElement('div');
    inputWrap.className = 'cm-vsFindInputWrap';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Find';
    input.setAttribute('main-field', 'true');
    input.value = startQuery.search;
    inputWrap.appendChild(input);

    const caseBtn = makeToggleButton('Aa', 'Match Case');
    const wordBtn = makeToggleButton('ab', 'Match Whole Word');
    const regexBtn = makeToggleButton('.*', 'Use Regular Expression');
    caseBtn.dataset.pressed = String(startQuery.caseSensitive);
    wordBtn.dataset.pressed = String(startQuery.wholeWord);
    regexBtn.dataset.pressed = String(startQuery.regexp);
    [caseBtn, wordBtn, regexBtn].forEach((btn) => btn.setAttribute('aria-pressed', btn.dataset.pressed));
    inputWrap.append(caseBtn, wordBtn, regexBtn);

    const countEl = document.createElement('span');
    countEl.className = 'cm-vsFindCount';

    const prevBtn = makeIconButton('M18 15l-6-6-6 6', 'Previous Match');
    const nextBtn = makeIconButton('M6 9l6 6 6-6', 'Next Match');
    const closeBtn = makeIconButton('M6 18L18 6M6 6l12 12', 'Close (Escape)');

    dom.append(inputWrap, countEl, prevBtn, nextBtn, closeBtn);

    function currentQuery() {
        return new SearchQuery({
            search: input.value,
            caseSensitive: caseBtn.dataset.pressed === 'true',
            wholeWord: wordBtn.dataset.pressed === 'true',
            regexp: regexBtn.dataset.pressed === 'true',
        });
    }

    function dispatchQuery() {
        view.dispatch({ effects: setSearchQuery.of(currentQuery()) });
    }

    function updateCount() {
        const query = getSearchQuery(view.state);
        if (!query.search || !query.valid) {
            countEl.textContent = 'No results';
            countEl.classList.toggle('cm-vsFindCount-empty', !!query.search);
            return;
        }
        const sel = view.state.selection.main;
        let total = 0;
        let activeIndex = 0;
        const cursor = query.getCursor(view.state);
        for (let result = cursor.next(); !result.done && total < 1000; result = cursor.next()) {
            total += 1;
            if (result.value.from <= sel.from && sel.to <= result.value.to) activeIndex = total;
        }
        countEl.classList.remove('cm-vsFindCount-empty');
        countEl.textContent = total === 0 ? 'No results' : `${activeIndex || 1} of ${total}${total === 1000 ? '+' : ''}`;
    }

    input.addEventListener('input', () => {
        dispatchQuery();
        updateCount();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.shiftKey ? findPrevious : findNext)(view);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeSearchPanel(view);
        }
    });

    [
        [caseBtn, 'caseSensitive'],
        [wordBtn, 'wholeWord'],
        [regexBtn, 'regexp'],
    ].forEach(([btn]) => {
        btn.addEventListener('click', () => {
            const pressed = btn.dataset.pressed !== 'true';
            btn.dataset.pressed = String(pressed);
            btn.setAttribute('aria-pressed', String(pressed));
            dispatchQuery();
            updateCount();
        });
    });

    prevBtn.addEventListener('click', () => findPrevious(view));
    nextBtn.addEventListener('click', () => findNext(view));
    closeBtn.addEventListener('click', () => closeSearchPanel(view));

    return {
        dom,
        top: true,
        mount() {
            input.focus();
            input.select();
            updateCount();
        },
        update(update) {
            if (update.docChanged || update.selectionSet) updateCount();
        },
    };
}

// `search({ top: true, createPanel })` swaps the built-in bottom-docked,
// unstyled panel for the compact floating widget above; the theme below
// positions it (absolute, top-right, over the code rather than pushing it
// down) and styles it - rounded pill, dark/light aware, indigo accents to
// match the rest of the app - plus the match-highlight colors underneath it.
function buildSearchExtensions(isDark) {
    const border = isDark ? '#30363d' : '#e5e7eb';
    const bg = isDark ? '#161b22' : '#ffffff';
    const text = isDark ? '#e6edf3' : '#111827';
    const muted = isDark ? '#8b949e' : '#6b7280';
    const hoverBg = isDark ? '#21262d' : '#f3f4f6';
    const accent = '#6366f1';

    return [
        search({ top: true, createPanel: buildFindPanel }),
        EditorView.theme(
            {
                '.cm-panels, .cm-panels-top': {
                    position: 'static',
                    background: 'transparent',
                    border: 'none',
                },
                '&': { position: 'relative' },
                '.cm-panel.cm-vsFindPanel': {
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    left: 'auto',
                    zIndex: '20',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '4px',
                    borderRadius: '8px',
                    border: `1px solid ${border}`,
                    backgroundColor: bg,
                    boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.45)' : '0 4px 16px rgba(0,0,0,0.12)',
                },
                '.cm-vsFindInputWrap': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '0 4px',
                    height: '26px',
                    borderRadius: '6px',
                    border: `1px solid ${border}`,
                    backgroundColor: isDark ? '#0d1117' : '#f9fafb',
                },
                '.cm-vsFindInputWrap:focus-within': {
                    borderColor: accent,
                    boxShadow: `0 0 0 1px ${accent}`,
                },
                '.cm-vsFindPanel input[type="text"]': {
                    width: '130px',
                    height: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: text,
                    fontSize: '12.5px',
                },
                '.cm-vsFindToggleBtn': {
                    width: '20px',
                    height: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    border: '1px solid transparent',
                    background: 'transparent',
                    color: muted,
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                },
                '.cm-vsFindToggleBtn:hover': { backgroundColor: hoverBg },
                '.cm-vsFindToggleBtn[aria-pressed="true"]': {
                    color: accent,
                    borderColor: accent,
                    backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                },
                '.cm-vsFindCount': {
                    minWidth: '64px',
                    padding: '0 6px',
                    fontSize: '11.5px',
                    color: muted,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                },
                '.cm-vsFindCount-empty': { color: '#f87171' },
                '.cm-vsFindIconBtn': {
                    width: '24px',
                    height: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: muted,
                    cursor: 'pointer',
                },
                '.cm-vsFindIconBtn:hover': { backgroundColor: hoverBg, color: text },
                '.cm-searchMatch': {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                },
                '.cm-searchMatch-selected': {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.55)' : 'rgba(99, 102, 241, 0.4)',
                },
            },
            { dark: isDark },
        ),
    ];
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
            extensions={[...getLanguageExtension(extension), ...buildSearchExtensions(isDark)]}
            basicSetup={{ foldGutter: true, dropCursor: true, allowMultipleSelections: true }}
            className={className}
            height="100%"
            style={{ height: '100%', fontSize: '13px' }}
        />
    );
}
