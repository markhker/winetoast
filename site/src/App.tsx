import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
	Toaster,
	winetoast,
	type WinetoastPosition,
	type WinetoastState,
} from "../../src";

type Theme = "light" | "dark";
type Route = "/" | "/docs" | "/docs/api" | "/docs/api/toaster" | "/docs/styling" | "/playground";
type ToastTrigger = Exclude<WinetoastState, "loading"> | "icon" | "promise";

const positions: WinetoastPosition[] = [
	"top-left",
	"top-center",
	"top-right",
	"bottom-left",
	"bottom-center",
	"bottom-right",
];

const toastTriggers: ToastTrigger[] = [
	"success",
	"error",
	"warning",
	"info",
	"action",
	"icon",
	"promise",
];

const docsLinks: { href: Route; label: string; eyebrow: string }[] = [
	{ href: "/docs", label: "Kickstart", eyebrow: "Basics" },
	{ href: "/docs/api", label: "winetoast", eyebrow: "API" },
	{ href: "/docs/api/toaster", label: "Toaster", eyebrow: "API" },
	{ href: "/docs/styling", label: "Styling", eyebrow: "Guides" },
];

const codeSamples = {
	setup: `import { winetoast, Toaster } from "winetoast";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <YourApp />
    </>
  );
}`,
	fire: `winetoast.success({
  title: "Saved",
  description: "Your changes are live.",
});`,
	promise: `winetoast.promise(saveSettings(), {
  loading: { title: "Saving..." },
  success: { title: "Saved" },
  error: { title: "Could not save" },
});`,
	position: `<Toaster position="top-right" />

winetoast.info({
  title: "Heads up",
  position: "bottom-center",
});`,
	styles: `winetoast.success({
  title: "Custom styled",
  fill: "#171717",
  styles: {
    title: "text-white",
    description: "text-white/70",
    badge: "bg-white/10",
  },
});`,
	variables: `:root {
  --winetoast-state-success: oklch(0.7 0.2 200);
  --winetoast-width: 350px;
  --winetoast-height: 40px;
  --winetoast-duration: 600ms;
}`,
} as const;

const getRoute = (): Route => {
	const hash = window.location.hash.replace(/^#/, "");
	const path = hash || "/docs";

	if (
		path === "/" ||
		path === "/docs" ||
		path === "/docs/api" ||
		path === "/docs/api/toaster" ||
		path === "/docs/styling" ||
		path === "/playground"
	) {
		return path;
	}

	return "/docs";
};

const routeHref = (route: Route) => `#${route}`;

const titleCase = (value: string) =>
	value
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const CodeBlock = ({ children }: { children: string }) => (
	<pre className="code-block">
		<code>{children}</code>
	</pre>
);

const Section = ({
	children,
	title,
}: {
	children: ReactNode;
	title: string;
}) => (
	<section className="doc-section">
		<h2>{title}</h2>
		{children}
	</section>
);

const Shell = ({
	children,
	route,
	theme,
	onThemeChange,
}: {
	children: ReactNode;
	route: Route;
	theme: Theme;
	onThemeChange: (theme: Theme) => void;
}) => (
	<div className="site-shell" data-theme={theme}>
		<header className="topbar">
			<a className="brand" href={routeHref("/docs")}>
				Winetoast
			</a>
			<nav className="topnav" aria-label="Main">
				<a href="https://github.com/markhker/winetoast">GitHub</a>
				<a aria-current={route.startsWith("/docs") ? "page" : undefined} href={routeHref("/docs")}>
					Docs
				</a>
				<a aria-current={route === "/playground" ? "page" : undefined} href={routeHref("/playground")}>
					Playground
				</a>
				<button
					aria-label="Toggle theme"
					className="theme-toggle"
					type="button"
					onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
				>
					{theme === "dark" ? "Light" : "Dark"}
				</button>
			</nav>
		</header>
		{children}
		<footer className="footer">
			<span>Winetoast - MIT License</span>
			<a href={route === "/playground" ? routeHref("/docs") : routeHref("/playground")}>
				{route === "/playground" ? "Docs" : "Playground"} -&gt;
			</a>
		</footer>
	</div>
);

const DocsLayout = ({
	children,
	route,
}: {
	children: ReactNode;
	route: Route;
}) => {
	const groupedLinks = useMemo(() => {
		const groups = new Map<string, typeof docsLinks>();
		for (const item of docsLinks) {
			groups.set(item.eyebrow, [...(groups.get(item.eyebrow) ?? []), item]);
		}
		return Array.from(groups);
	}, []);

	return (
		<main className="docs-layout">
			<aside className="sidebar">
				{groupedLinks.map(([eyebrow, links]) => (
					<div className="sidebar-group" key={eyebrow}>
						<p>{eyebrow}</p>
						{links.map((link) => (
							<a
								aria-current={route === link.href ? "page" : undefined}
								href={routeHref(link.href)}
								key={link.href}
							>
								{link.label}
							</a>
						))}
					</div>
				))}
			</aside>
			<article className="doc-content">{children}</article>
		</main>
	);
};

const ButtonRow = ({ position }: { position: WinetoastPosition }) => (
	<div className="button-row">
		<button
			type="button"
			onClick={() =>
				winetoast.success({
					title: "Saved",
					description: "Your changes are live.",
					position,
				})
			}
		>
			Success
		</button>
		<button
			type="button"
			onClick={() =>
				winetoast.error({
					title: "Something broke",
					description: "Try again in a moment.",
					position,
				})
			}
		>
			Error
		</button>
		<button
			type="button"
			onClick={() =>
				winetoast.info({
					title: "Heads up",
					description: "This toast preserves your title casing.",
					position,
				})
			}
		>
			Info
		</button>
	</div>
);

const KickstartPage = ({ position }: { position: WinetoastPosition }) => (
	<>
		<h1>Getting Started</h1>
		<p className="lead">
			Winetoast is a tiny, opinionated toast component for React. It uses
			gooey SVG morphing and spring physics to create smooth notifications
			with very little setup.
		</p>

		<Section title="Installation">
			<CodeBlock>npm install winetoast</CodeBlock>
		</Section>

		<Section title="Quick Setup">
			<p>
				Add the <code>Toaster</code> component once near your app root, then
				call <code>winetoast</code> from anywhere.
			</p>
			<CodeBlock>{codeSamples.setup}</CodeBlock>
		</Section>

		<Section title="Fire a Toast">
			<ButtonRow position={position} />
			<CodeBlock>{codeSamples.fire}</CodeBlock>
		</Section>

		<Section title="Promise Toast">
			<ButtonRow position={position} />
			<CodeBlock>{codeSamples.promise}</CodeBlock>
		</Section>
	</>
);

const ApiPage = () => (
	<>
		<h1>winetoast</h1>
		<p className="lead">
			The global toast controller. Import it anywhere to fire or dismiss
			notifications.
		</p>

		<Section title="Methods">
			<div className="table-wrap">
				<table>
					<tbody>
						<tr>
							<td><code>winetoast.success(options)</code></td>
							<td>Green success toast.</td>
						</tr>
						<tr>
							<td><code>winetoast.error(options)</code></td>
							<td>Red error toast.</td>
						</tr>
						<tr>
							<td><code>winetoast.warning(options)</code></td>
							<td>Amber warning toast.</td>
						</tr>
						<tr>
							<td><code>winetoast.info(options)</code></td>
							<td>Blue info toast.</td>
						</tr>
						<tr>
							<td><code>winetoast.action(options)</code></td>
							<td>Toast with an action button.</td>
						</tr>
						<tr>
							<td><code>winetoast.show(options)</code></td>
							<td>Generic toast using the provided type.</td>
						</tr>
						<tr>
							<td><code>winetoast.promise(promise, opts)</code></td>
							<td>Loading to success or error flow.</td>
						</tr>
						<tr>
							<td><code>winetoast.dismiss(id)</code></td>
							<td>Dismiss a specific toast by id.</td>
						</tr>
						<tr>
							<td><code>winetoast.clear(position?)</code></td>
							<td>Clear all toasts, or only one position.</td>
						</tr>
					</tbody>
				</table>
			</div>
		</Section>

		<Section title="WinetoastOptions">
			<div className="table-wrap">
				<table>
					<tbody>
						<tr><td><code>title</code></td><td>Toast heading.</td></tr>
						<tr><td><code>description</code></td><td>Body content. Supports strings and JSX.</td></tr>
						<tr><td><code>position</code></td><td>Override position for this toast.</td></tr>
						<tr><td><code>duration</code></td><td>Auto-dismiss time in ms. Use null for sticky.</td></tr>
						<tr><td><code>icon</code></td><td>Custom icon, or null to hide the default.</td></tr>
						<tr><td><code>fill</code></td><td>SVG background fill color.</td></tr>
						<tr><td><code>styles</code></td><td>Class overrides for inner elements.</td></tr>
						<tr><td><code>roundness</code></td><td>Border radius in pixels.</td></tr>
						<tr><td><code>autopilot</code></td><td>Auto expand and collapse timing.</td></tr>
						<tr><td><code>button</code></td><td>Action button config.</td></tr>
					</tbody>
				</table>
			</div>
		</Section>
	</>
);

const ToasterPage = () => (
	<>
		<h1>Toaster</h1>
		<p className="lead">
			The viewport component that renders toasts. Add it once to your layout.
		</p>

		<CodeBlock>{`import { Toaster } from "winetoast";`}</CodeBlock>

		<Section title="Props">
			<div className="table-wrap">
				<table>
					<tbody>
						<tr><td><code>children</code></td><td>App content rendered alongside toasts.</td></tr>
						<tr><td><code>position</code></td><td>Default toast position. Defaults to top-right.</td></tr>
						<tr><td><code>offset</code></td><td>Distance from viewport edges.</td></tr>
						<tr><td><code>options</code></td><td>Default options merged into every toast.</td></tr>
						<tr><td><code>theme</code></td><td>light, dark, or system.</td></tr>
					</tbody>
				</table>
			</div>
		</Section>

		<Section title="Offset">
			<CodeBlock>{`<Toaster offset={20} />

<Toaster offset={{ top: 20, right: 16 }} />`}</CodeBlock>
		</Section>

		<Section title="Positions">
			<CodeBlock>{codeSamples.position}</CodeBlock>
			<p className="muted">
				Available positions: {positions.map((item) => <code key={item}>{item}</code>)}
			</p>
		</Section>
	</>
);

const StylingPage = ({ position }: { position: WinetoastPosition }) => (
	<>
		<h1>Styling</h1>
		<p className="lead">
			Winetoast is designed to look good out of the box, with escape hatches
			for custom fills, class names, icons, and CSS variables.
		</p>

		<Section title="Fill Color">
			<div className="button-row">
				<button
					type="button"
					onClick={() =>
						winetoast.success({
							title: "Dark accent",
							description: "Custom fill and text classes.",
							fill: "#171717",
							position,
							styles: {
								title: "docs-toast-light",
								description: "docs-toast-muted",
								badge: "docs-toast-badge",
							},
						})
					}
				>
					Dark accent
				</button>
				<button
					type="button"
					onClick={() =>
						winetoast.info({
							title: "Custom icon",
							icon: <span aria-hidden="true">+</span>,
							position,
						})
					}
				>
					Custom icon
				</button>
			</div>
			<CodeBlock>{codeSamples.styles}</CodeBlock>
		</Section>

		<Section title="Autopilot">
			<CodeBlock>{`winetoast.info({
  title: "Manual expand",
  description: "Hover to expand this toast.",
  autopilot: false,
});`}</CodeBlock>
		</Section>

		<Section title="CSS Variables">
			<CodeBlock>{codeSamples.variables}</CodeBlock>
		</Section>
	</>
);

const fireToast = (trigger: ToastTrigger, position: WinetoastPosition) => {
	if (trigger === "success") {
		winetoast.success({
			title: "Success",
			description: "Everything saved correctly.",
			position,
		});
		return;
	}

	if (trigger === "error") {
		winetoast.error({
			title: "Error",
			description: "Something needs attention.",
			position,
		});
		return;
	}

	if (trigger === "warning") {
		winetoast.warning({
			title: "Warning",
			description: "Review this before continuing.",
			position,
		});
		return;
	}

	if (trigger === "info") {
		winetoast.info({
			title: "Test data test",
			description: "The title keeps the casing you pass in.",
			position,
		});
		return;
	}

	if (trigger === "action") {
		winetoast.action({
			title: "Undo change?",
			description: "This toast includes an action button.",
			position,
			button: {
				title: "Undo",
				onClick: () => winetoast.info({ title: "Undone", position }),
			},
		});
		return;
	}

	if (trigger === "icon") {
		winetoast.info({
			title: "Custom icon",
			description: "Any React node can replace the badge icon.",
			position,
			icon: <span aria-hidden="true">+</span>,
		});
		return;
	}

	const promise = new Promise<string>((resolve) => {
		window.setTimeout(() => resolve("Done"), 1200);
	});

	winetoast.promise(promise, {
		loading: { title: "Loading...", position },
		success: { title: "Promise resolved", description: "The async work finished.", position },
		error: { title: "Promise failed", position },
	});
};

const PlaygroundPage = ({
	position,
	onPositionChange,
}: {
	position: WinetoastPosition;
	onPositionChange: (position: WinetoastPosition) => void;
}) => (
	<main className="playground">
		<section className="hero">
			<p className="eyebrow">Live demo</p>
			<h1>Playground<span>.</span></h1>
			<p>Pick a position, then click any toast type to fire it live.</p>
		</section>

		<section className="control-panel" aria-label="Toast controls">
			<div className="pill-group" role="group" aria-label="Toast position">
				{positions.map((item) => (
					<button
						aria-pressed={position === item}
						className={position === item ? "selected" : undefined}
						key={item}
						type="button"
						onClick={() => onPositionChange(item)}
					>
						{item}
					</button>
				))}
			</div>

			<div className="divider" />

			<div className="pill-group" role="group" aria-label="Toast type">
				{toastTriggers.map((item) => (
					<button key={item} type="button" onClick={() => fireToast(item, position)}>
						{titleCase(item)}
					</button>
				))}
			</div>
		</section>
	</main>
);

const renderPage = (
	route: Route,
	position: WinetoastPosition,
	onPositionChange: (position: WinetoastPosition) => void,
) => {
	if (route === "/docs/api") return <ApiPage />;
	if (route === "/docs/api/toaster") return <ToasterPage />;
	if (route === "/docs/styling") return <StylingPage position={position} />;
	if (route === "/playground") {
		return <PlaygroundPage position={position} onPositionChange={onPositionChange} />;
	}
	return <KickstartPage position={position} />;
};

export const App = () => {
	const [route, setRoute] = useState<Route>(() => getRoute());
	const [theme, setTheme] = useState<Theme>(() =>
		window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
	);
	const [position, setPosition] = useState<WinetoastPosition>("top-right");

	useEffect(() => {
		const onHashChange = () => setRoute(getRoute());
		window.addEventListener("hashchange", onHashChange);
		if (!window.location.hash) window.location.hash = routeHref("/docs");
		return () => window.removeEventListener("hashchange", onHashChange);
	}, []);

	const page = renderPage(route, position, setPosition);

	return (
		<Shell route={route} theme={theme} onThemeChange={setTheme}>
			{route === "/playground" ? (
				page
			) : (
				<DocsLayout route={route}>{page}</DocsLayout>
			)}
			<Toaster position={position} theme={theme} offset={24} />
		</Shell>
	);
};
