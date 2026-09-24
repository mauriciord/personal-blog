import satori from 'satori';
import { readFile } from 'node:fs/promises';

// Astro bundles this module into dist/chunks; walk back to the checked-in asset
// from either the source module (dev) or generated chunk (build).
const fontPromise = readFile(new URL('../../src/assets/og-font.woff', import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;

const accents = [
	{ left: 1006, top: 112, color: '#e5ffc3', rotate: -13 },
	{ left: 1061, top: 165, color: '#252525', rotate: 12 },
	{ left: 986, top: 198, color: '#b4c9ff', rotate: 8 },
	{ left: 1090, top: 225, color: '#ffb3a7', rotate: -9 },
];

export async function renderOgSvg({ title, locale = 'en-US' }) {
	const isPortuguese = locale.toLowerCase().startsWith('pt');
	const label = isPortuguese ? 'ESCRITOS & IDEIAS' : 'WRITING & IDEAS';
	const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Mauricio’s blog';
	const fontSize = safeTitle.length > 150 ? 39 : safeTitle.length > 100 ? 46 : safeTitle.length > 60 ? 54 : 68;
	const fontData = await fontPromise;
	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: WIDTH,
					height: HEIGHT,
					backgroundColor: '#efefef',
					color: '#252525',
					fontFamily: 'IA Writer Mono',
					position: 'relative',
					display: 'flex',
					flexDirection: 'column',
					padding: '62px 76px 54px',
					boxSizing: 'border-box',
					border: '1px solid #252525',
				},
				children: [
					{
						type: 'div',
						props: {
							style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #252525', paddingBottom: 20 },
							children: [{ type: 'div', props: { style: { fontSize: 20, letterSpacing: '0.12em' }, children: label } }],
						},
					},
					{
						type: 'div',
						props: {
							style: { flex: 1, display: 'flex', alignItems: 'center', padding: '35px 145px 26px 0', maxWidth: 1000 },
							children: { type: 'div', props: { style: { fontSize: fontSize, lineHeight: 1.25, letterSpacing: '-0.045em', fontWeight: 400, overflowWrap: 'break-word', wordBreak: 'break-word' }, children: safeTitle } },
						},
					},
					{
						type: 'div',
						props: {
							style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #252525', paddingTop: 20 },
							children: [{ type: 'div', props: { style: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 25 }, children: [{ type: 'div', props: { style: { width: 12, height: 12, backgroundColor: '#252525' }, children: '' } }, 'mauriciord.dev'] } }],
						},
					},
					...accents.map(({ left, top, color, rotate }) => ({
						type: 'div', props: { style: { position: 'absolute', left, top, width: 28, height: 28, color, fontSize: 54, lineHeight: '28px', transform: `rotate(${rotate}deg)` }, children: '×' },
					})),
				],
			},
		},
		{ width: WIDTH, height: HEIGHT, fonts: [{ name: 'IA Writer Mono', data: fontData, weight: 400, style: 'normal' }] },
	);
	return svg;
}
