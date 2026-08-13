import { useId, useMemo, useState } from 'react';
import {
    AreaChart,
    BarChart,
    ComposedChart,
    Area,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { computeYAxisWidth } from '@/utils/chartAxis';
import ClickableLegend from '@/Components/ClickableLegend';
import ChartTooltip from '@/Components/ChartTooltip';
import EmptyChartState from '@/Components/EmptyChartState';

/**
 * Shared "Activity" chart card body for the user and admin dashboards.
 * Both pages plot the same shape of data (a date-bucketed count per series,
 * switchable between area / bar / combo) so the only thing that ever
 * differed between them was which series exist and how tall the card is.
 * That duplication used to live twice, in full, inline in each page; it now
 * lives here once, with the visual language pushed further than either copy
 * had on its own:
 *
 *   - Area and bar fills use a soft top-to-bottom gradient instead of a
 *     flat color, so the chart reads with some depth against the card.
 *   - Every line (including the combo chart's comparison lines) gets a
 *     subtle drop-shadow glow, and a ringed dot that only appears on hover.
 *   - Hovering shows a glassy custom tooltip (ChartTooltip) instead of
 *     recharts' plain white box, with a soft cursor highlight behind it.
 *   - Bars get a touch more corner rounding and a capped width so they
 *     stay tidy on both dense and sparse ranges.
 *
 * The legend doubles as a series filter (see ClickableLegend); that filter
 * state is owned here now instead of being threaded through the page, since
 * nothing outside the chart card ever needed it.
 *
 * `series` is an ordered list of `{ key, name, color, dash? }`. The first
 * entry is the "primary" series: it renders as the filled Area in area mode
 * and as the Bar in combo mode. Every other entry renders as a Line, using
 * its own `dash` (an SVG strokeDasharray) to stay distinguishable when
 * several lines share the chart.
 */
export default function ActivityChart({
    chartType,
    data,
    series,
    height = 240,
    emptyTitle = 'No activity in this period',
    emptySubtitle,
}) {
    const rawId = useId();
    const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');

    const [selectedKeys, setSelectedKeys] = useState([]);
    const toggleKey = (key) =>
        setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    const isHidden = (key) => selectedKeys.length > 0 && !selectedKeys.includes(key);

    const keys = useMemo(() => series.map((s) => s.key), [series]);
    const yAxisWidth = useMemo(() => computeYAxisWidth(data, keys), [data, keys]);
    const hasActivity = useMemo(
        () => data?.some((row) => keys.reduce((sum, key) => sum + (row?.[key] ?? 0), 0) > 0),
        [data, keys]
    );
    const colorMap = useMemo(
        () => Object.fromEntries(series.map(({ key, color }) => [key, color])),
        [series]
    );

    if (!hasActivity) {
        return <EmptyChartState height={height} title={emptyTitle} subtitle={emptySubtitle} />;
    }

    const [primary, ...rest] = series;

    const axisProps = {
        tick: { fontSize: 11, fill: 'currentColor' },
        axisLine: { stroke: '#9ca3af', strokeOpacity: 0.4 },
        tickLine: { stroke: '#9ca3af', strokeOpacity: 0.4 },
    };

    const gradients = (
        <defs>
            {series.map(({ key, color }) => (
                <linearGradient key={`fill-${key}`} id={`${uid}-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.38} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
            ))}
            {series.map(({ key, color }) => (
                <linearGradient key={`bar-${key}`} id={`${uid}-bar-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.55} />
                </linearGradient>
            ))}
            <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.25" floodOpacity="0.4" />
            </filter>
        </defs>
    );

    const grid = <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" strokeOpacity={0.22} vertical={false} />;

    const tooltip = (
        <Tooltip
            content={<ChartTooltip colorMap={colorMap} />}
            cursor={
                chartType === 'bar' || chartType === 'combo'
                    ? { fill: '#6366f1', fillOpacity: 0.07, radius: 4 }
                    : { stroke: '#9ca3af', strokeDasharray: '4 4', strokeOpacity: 0.5 }
            }
        />
    );

    const legend = (
        <Legend content={(props) => <ClickableLegend {...props} selectedKeys={selectedKeys} onToggle={toggleKey} colorMap={colorMap} />} />
    );

    const lineProps = (key, name, color, dash) => ({
        type: 'monotone',
        dataKey: key,
        name,
        stroke: color,
        strokeWidth: 2.25,
        dot: false,
        activeDot: { r: 5, strokeWidth: 2, stroke: 'var(--chart-active-dot-stroke, #fff)' },
        strokeDasharray: dash,
        hide: isHidden(key),
        filter: `url(#${uid}-glow)`,
        animationDuration: 650,
        animationEasing: 'ease-out',
    });
    return (
        <ResponsiveContainer width="100%" height={height} className="text-gray-600 dark:text-gray-300">
            {chartType === 'bar' ? (
                <BarChart data={data} margin={{ top: 5, right: 8, bottom: 5, left: 0 }} barCategoryGap="12%" barGap={2}>
                    {gradients}
                    {grid}
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis width={yAxisWidth} {...axisProps} allowDecimals={false} />
                    {tooltip}
                    {legend}
                    {series.map(({ key, name, color }) => (
                        <Bar
                            key={key}
                            dataKey={key}
                            name={name}
                            fill={`url(#${uid}-bar-${key})`}
                            radius={[3, 3, 0, 0]}
                            minPointSize={3}
                            hide={isHidden(key)}
                            animationDuration={650}
                            animationEasing="ease-out"
                        />
                    ))}
                </BarChart>
            ) : chartType === 'combo' ? (
                <ComposedChart data={data} margin={{ top: 5, right: 8, bottom: 5, left: 0 }} barCategoryGap="20%">
                    {gradients}
                    {grid}
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis width={yAxisWidth} {...axisProps} allowDecimals={false} />
                    {tooltip}
                    {legend}
                    <Bar
                        dataKey={primary.key}
                        name={primary.name}
                        fill={`url(#${uid}-bar-${primary.key})`}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={64}
                        minPointSize={3}
                        hide={isHidden(primary.key)}
                        animationDuration={650}
                        animationEasing="ease-out"
                    />
                    {rest.map(({ key, name, color, dash }) => (
                        <Line
                            key={key}
                            {...lineProps(key, name, color, dash)}
                        />
                    ))}
                </ComposedChart>
            ) : (
                <AreaChart data={data} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                    {gradients}
                    {grid}
                    <XAxis dataKey="label" {...axisProps} />
                    <YAxis width={yAxisWidth} {...axisProps} allowDecimals={false} />
                    {tooltip}
                    {legend}
                    <Area
                        type="monotone"
                        dataKey={primary.key}
                        name={primary.name}
                        stroke={primary.color}
                        strokeWidth={2.25}
                        fill={`url(#${uid}-fill-${primary.key})`}
                        activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--chart-active-dot-stroke, #fff)' }}
                        hide={isHidden(primary.key)}
                        filter={`url(#${uid}-glow)`}
                        animationDuration={650}
                        animationEasing="ease-out"
                    />
                    {rest.map(({ key, name, color, dash }) => (
                        <Line
                            key={key}
                            {...lineProps(key, name, color, dash)}
                        />
                    ))}
                </AreaChart>
            )}
        </ResponsiveContainer>
    );
}
