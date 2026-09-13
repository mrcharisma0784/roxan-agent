import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as Camera, B as FilePen, D as Keyboard, E as ListTree, F as FolderInput, G as Copy, I as FileX2, J as CirclePlus, K as Compass, L as FileText, N as FolderX, O as Image, P as FolderPlus, Q as ChevronDown, R as FileSymlink, S as MousePointer2, U as Download, W as Database, X as ChevronUp, Y as CircleMinus, Z as ChevronRight, _ as Plus, a as Square, b as PackageMinus, d as Search, et as Brain, f as ScanSearch, g as Plug, h as Reply, it as ArrowDownUp, j as Globe, k as ImagePlus, m as Rocket, n as Wrench, o as SquareTerminal, p as Route, q as CodeXml, rt as ArrowDown, t as X, tt as BookOpenCheck, u as Send, v as PenLine, w as MessageCircleQuestion, x as MousePointerClick, y as PackagePlus, z as FilePlus2 } from "../_libs/lucide-react.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as supportsReasoning, c as cn, i as isConfigured, n as hasFirecrawl, o as useRoxan, r as hasMemory, s as Button } from "./router-DOtJEhh5.mjs";
import { t as Textarea } from "./textarea-C9H5KQb_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/chat-view-Drv6_oFp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName$4 = "/home/ubuntu/roxan-agent-v2/src/components/chat/composer.tsx";
function Composer({ disabled, streaming, webSearchEnabled, firecrawlReady, onToggleWebSearch, memoryReady, onOpenSettings, reasoningEnabled, reasoningSupported, onToggleReasoning, onSend, onStop, replyTo, onClearReply }) {
	const ref = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const imageRef = (0, import_react.useRef)(null);
	const dragStartRef = (0, import_react.useRef)(null);
	const dragOffsetRef = (0, import_react.useRef)(0);
	const [toolsOpen, setToolsOpen] = (0, import_react.useState)(false);
	const [dragOffset, setDragOffset] = (0, import_react.useState)(0);
	const [attachments, setAttachments] = (0, import_react.useState)([]);
	const [pendingUploads, setPendingUploads] = (0, import_react.useState)(0);
	function resize() {
		const el = ref.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
	}
	function submit() {
		const el = ref.current;
		if (!el || streaming || pendingUploads > 0 || attachments.some((attachment) => attachment.error)) return;
		const value = el.value.trim();
		if (!value && attachments.length === 0) return;
		onSend(value, attachments);
		el.value = "";
		setAttachments([]);
		resize();
		onClearReply?.();
		setToolsOpen(false);
	}
	async function fileDataUrl(file, kind) {
		if (kind !== "image" || typeof createImageBitmap === "undefined") return await new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.readAsDataURL(file);
		});
		try {
			const bitmap = await createImageBitmap(file);
			const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.round(bitmap.width * scale));
			canvas.height = Math.max(1, Math.round(bitmap.height * scale));
			canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			bitmap.close();
			return canvas.toDataURL("image/jpeg", .84);
		} catch {
			return await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result));
				reader.readAsDataURL(file);
			});
		}
	}
	function addFiles(kind, files) {
		if (!files) return;
		const selected = Array.from(files).slice(0, Math.max(0, 3 - attachments.length));
		if (!selected.length) return;
		setPendingUploads((count) => count + selected.length);
		const textExtensions = /\.(txt|md|markdown|json|csv|tsv|yaml|yml|xml|html|htm|css|js|jsx|ts|tsx|py|java|c|cpp|h|sql|log|ini|toml)$/i;
		selected.forEach((file) => {
			const unsupported = kind === "file" && !textExtensions.test(file.name) && !/^text\//i.test(file.type);
			fileDataUrl(file, kind).then((dataUrl) => setAttachments((current) => current.length >= 3 ? current : [...current, {
				name: file.name,
				type: file.type,
				dataUrl,
				kind,
				error: unsupported ? "Bu dosya türü desteklenmiyor; metin tabanlı bir dosya ekleyin." : void 0
			}])).finally(() => setPendingUploads((count) => Math.max(0, count - 1)));
		});
		setToolsOpen(false);
	}
	function onKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	}
	function startDrag(e) {
		dragStartRef.current = e.clientY;
		e.currentTarget.setPointerCapture?.(e.pointerId);
	}
	function moveDrag(e) {
		if (dragStartRef.current === null) return;
		const next = Math.max(0, e.clientY - dragStartRef.current);
		dragOffsetRef.current = next;
		setDragOffset(next);
	}
	function endDrag() {
		if (dragOffsetRef.current > 72) setToolsOpen(false);
		dragStartRef.current = null;
		dragOffsetRef.current = 0;
		setDragOffset(0);
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
		onSubmit: (e) => {
			e.preventDefault();
			submit();
		},
		className: "relative mx-auto w-full max-w-2xl shrink-0 px-3 pb-20 sm:px-4 sm:pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
				ref: fileRef,
				type: "file",
				multiple: true,
				className: "hidden",
				onChange: (e) => addFiles("file", e.target.files)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 18,
				columnNumber: 162
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
				ref: imageRef,
				type: "file",
				accept: "image/*",
				multiple: true,
				className: "hidden",
				onChange: (e) => addFiles("image", e.target.files)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 18,
				columnNumber: 276
			}, this),
			toolsOpen ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
				type: "button",
				className: "fixed inset-0 z-20 border-0 bg-bg/50",
				"aria-label": "Araçlar panelini kapat",
				onClick: () => setToolsOpen(false)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 18,
				columnNumber: 424
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "composer-tools-sheet",
				role: "group",
				"aria-label": "Araçlar",
				style: { "--panel-drag-offset": `${dragOffset}px` },
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					className: "grid h-7 w-full cursor-grab place-items-center border-0 bg-transparent touch-none",
					"aria-label": "Paneli kapat",
					onClick: () => setToolsOpen(false),
					onPointerDown: startDrag,
					onPointerMove: moveDrag,
					onPointerUp: endDrag,
					onPointerCancel: endDrag,
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "block h-1 w-10 rounded-full bg-subtle" }, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 18,
						columnNumber: 988
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 18,
					columnNumber: 711
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "mx-auto flex w-full max-w-2xl flex-col gap-0.5 px-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							className: "flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm text-fg hover:bg-bg-subtle",
							onClick: () => fileRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FilePlus2, { className: "size-4 text-muted" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 1300
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Upload a file" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 1343
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 1124
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							className: "flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm text-fg hover:bg-bg-subtle",
							onClick: () => imageRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ImagePlus, { className: "size-4 text-muted" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 1555
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Gallery" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 1598
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 1378
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "my-1 h-px bg-border/70" }, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 1627
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToolToggle, {
							checked: Boolean(webSearchEnabled),
							unavailable: !firecrawlReady,
							onClick: () => firecrawlReady ? onToggleWebSearch?.(!webSearchEnabled) : onOpenSettings?.(),
							icon: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Globe, { className: "size-4 text-muted" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 1846
							}, this),
							label: "Web Search",
							hint: !firecrawlReady ? "FireCrawl anahtarı gerekli" : void 0
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 1669
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToolToggle, {
							checked: Boolean(reasoningEnabled && reasoningSupported),
							disabled: !reasoningSupported,
							onClick: () => onToggleReasoning?.(!reasoningEnabled),
							icon: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Brain, { className: "size-4 text-muted" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 2136
							}, this),
							label: "Reasoning",
							hint: !reasoningSupported ? "Model desteklemiyor" : void 0
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 1974
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							className: "flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-sm text-fg hover:bg-bg-subtle",
							onClick: () => {
								onOpenSettings?.();
								if (typeof window !== "undefined") window.location.hash = "memory";
							},
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "inline-flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Database, { className: "size-4 text-muted" }, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 2562
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Memory" }, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 2604
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 2513
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronRight, { className: "size-4 text-subtle" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 2630
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 2260
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "my-1 h-px bg-border/70" }, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 2686
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							disabled: true,
							className: "flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm text-muted opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Wrench, { className: "size-4" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 2867
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "Add Skill" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 2896
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 2728
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 18,
					columnNumber: 1055
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 18,
				columnNumber: 569
			}, this)] }, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 18,
				columnNumber: 422
			}, this) : null,
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex flex-col rounded-2xl bg-bg-elevated p-2 pl-3.5 shadow-border focus-within:shadow-border-hover",
				children: [
					replyTo ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "mb-1 flex w-fit max-w-full items-center gap-2 rounded-xl border-l-2 border-fg/60 bg-bg-subtle px-2.5 py-2 text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "truncate",
							children: [
								"Reply to \"",
								replyTo.content.slice(0, 100),
								replyTo.content.length > 100 ? "…" : "",
								"\""
							]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 3219
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							className: "text-subtle hover:text-fg",
							onClick: onClearReply,
							"aria-label": "Reply'i kaldır",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(X, { className: "size-3.5" }, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 3457
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 3346
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 18,
						columnNumber: 3077
					}, this) : null,
					attachments.length ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "mb-1 flex flex-wrap gap-1.5",
						children: attachments.map((attachment, index) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							title: attachment.error,
							className: cn("inline-flex max-w-full items-center gap-1.5 rounded-lg bg-bg-subtle px-2 py-1 text-xs text-fg", attachment.error && "bg-danger/15 text-danger ring-1 ring-danger/40"),
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: cn("text-muted", attachment.error && "text-danger"),
									children: attachment.kind === "image" ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Image, { className: "size-3.5" }, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 18,
										columnNumber: 3963
									}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileText, { className: "size-3.5" }, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 18,
										columnNumber: 3996
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 3862
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "max-w-40 truncate",
									children: attachment.name
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 4037
								}, this),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
									type: "button",
									className: "text-subtle hover:text-fg",
									onClick: () => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index)),
									"aria-label": `${attachment.name} ekini kaldır`,
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(X, { className: "size-3" }, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 18,
										columnNumber: 4303
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 4097
								}, this)
							]
						}, `${attachment.name}-${index}`, true, {
							fileName: _jsxFileName$4,
							lineNumber: 18,
							columnNumber: 3613
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 18,
						columnNumber: 3528
					}, this) : null,
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-end gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
								type: "button",
								size: "iconSm",
								variant: "outline",
								className: cn("mb-0.5 size-9 shrink-0 rounded-full", toolsOpen && "[&_svg]:rotate-45"),
								"aria-label": "Araçları aç",
								onClick: () => setToolsOpen((open) => !open),
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Plus, { className: "size-4" }, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 4610
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 4397
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Textarea, {
								ref,
								rows: 1,
								name: "message",
								placeholder: "Mesajını yaz",
								disabled: disabled || pendingUploads > 0,
								onInput: resize,
								onKeyDown,
								className: "max-h-40 min-h-7 py-2.5 text-sm"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 4646
							}, this),
							streaming ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
								type: "button",
								size: "iconSm",
								variant: "subtle",
								className: "mb-0.5 size-9 shrink-0 rounded-full",
								onClick: onStop,
								"aria-label": "Durdur",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Square, { className: "size-3.5 fill-current" }, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 4995
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 4857
							}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
								type: "submit",
								size: "iconSm",
								className: "mb-0.5 size-9 shrink-0 rounded-full",
								disabled: disabled || pendingUploads > 0 || attachments.some((attachment) => Boolean(attachment.error)),
								"aria-label": "Gönder",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Send, { className: "size-4" }, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 18,
									columnNumber: 5260
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 18,
								columnNumber: 5051
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 18,
						columnNumber: 4359
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 18,
				columnNumber: 2950
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName$4,
		lineNumber: 18,
		columnNumber: 10
	}, this);
}
function ToolToggle({ checked, unavailable, disabled, onClick, icon, label, hint }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
		type: "button",
		role: "switch",
		"aria-checked": checked,
		disabled,
		className: cn("flex w-full items-center justify-between gap-4 rounded-lg px-2.5 py-2.5 text-left text-sm text-fg hover:bg-bg-subtle disabled:opacity-40", unavailable && "opacity-40"),
		onClick,
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
			className: "inline-flex items-center gap-2",
			children: [icon, /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
				className: "inline-flex flex-col gap-0.5",
				children: [label, hint ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("small", {
					className: "text-xs text-subtle",
					children: hint
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 20,
					columnNumber: 625
				}, this) : null]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 20,
				columnNumber: 563
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$4,
			lineNumber: 20,
			columnNumber: 508
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
			className: cn("inline-flex h-5 w-8 items-center rounded-full bg-border p-0.5", checked && !disabled && "bg-accent"),
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: cn("size-3.5 rounded-full bg-muted", checked && !disabled && "translate-x-3 bg-accent-fg") }, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 20,
				columnNumber: 823
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName$4,
			lineNumber: 20,
			columnNumber: 700
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName$4,
		lineNumber: 20,
		columnNumber: 227
	}, this);
}
var ALL_TOOLS = [
	{
		num: "01",
		label: "Dosya ve Dizin İşlemleri",
		tools: [
			{
				id: "file_read",
				icon: FileText,
				active: "File Reading",
				done: "File Read"
			},
			{
				id: "file_create",
				icon: FilePlus2,
				active: "File Creating",
				done: "File Created"
			},
			{
				id: "file_edit",
				icon: FilePen,
				active: "File Editing",
				done: "File Edited"
			},
			{
				id: "file_delete",
				icon: FileX2,
				active: "File Deleting",
				done: "File Deleted"
			},
			{
				id: "file_move",
				icon: FileSymlink,
				active: "File Moving",
				done: "File Moved"
			},
			{
				id: "dir_list",
				icon: ListTree,
				active: "Directory Listing",
				done: "Directory Listed"
			},
			{
				id: "dir_create",
				icon: FolderPlus,
				active: "Directory Creating",
				done: "Directory Created"
			},
			{
				id: "dir_delete",
				icon: FolderX,
				active: "Directory Deleting",
				done: "Directory Deleted"
			},
			{
				id: "dir_move",
				icon: FolderInput,
				active: "Directory Moving",
				done: "Directory Moved"
			}
		]
	},
	{
		num: "02",
		label: "Keşif ve Arama",
		tools: [
			{
				id: "explore",
				icon: Search,
				active: "Exploring",
				done: "Explored"
			},
			{
				id: "web_search",
				icon: Globe,
				active: "Web Searching",
				done: "Web Searched"
			},
			{
				id: "workspace_instructions_read",
				icon: BookOpenCheck,
				active: "Workspace Instructions Reading",
				done: "Workspace Instructions Read"
			}
		]
	},
	{
		num: "03",
		label: "Çalıştırma",
		tools: [{
			id: "command_exec",
			icon: SquareTerminal,
			active: "Command Executing",
			done: "Command Executed"
		}]
	},
	{
		num: "04",
		label: "Görsel Doğrulama",
		tools: [{
			id: "image_view",
			icon: Image,
			active: "Image Viewing",
			done: "Image Viewed"
		}]
	},
	{
		num: "05",
		label: "Tarayıcı ve Web Kullanımı",
		tools: [
			{
				id: "page_navigate",
				icon: Compass,
				active: "Page Navigating",
				done: "Page Navigated"
			},
			{
				id: "element_click",
				icon: MousePointerClick,
				active: "Element Clicking",
				done: "Element Clicked"
			},
			{
				id: "form_type",
				icon: Keyboard,
				active: "Form Typing",
				done: "Form Typed"
			},
			{
				id: "element_hover",
				icon: MousePointer2,
				active: "Element Hovering",
				done: "Element Hovered"
			},
			{
				id: "page_scroll",
				icon: ArrowDownUp,
				active: "Page Scrolling",
				done: "Page Scrolled"
			},
			{
				id: "dom_inspect",
				icon: CodeXml,
				active: "DOM Inspecting",
				done: "DOM Inspected"
			},
			{
				id: "screenshot",
				icon: Camera,
				active: "Screenshot Capturing",
				done: "Screenshot Captured"
			}
		]
	},
	{
		num: "06",
		label: "Biliş ve İletişim",
		tools: [
			{
				id: "reasoning",
				icon: Brain,
				active: "Reasoning",
				done: "Reasoned"
			},
			{
				id: "planning",
				icon: Route,
				active: "Planning",
				done: "Planned"
			},
			{
				id: "asking",
				icon: MessageCircleQuestion,
				active: "Asking",
				done: "Asked"
			},
			{
				id: "ask",
				icon: MessageCircleQuestion,
				active: "Soru hazırlanıyor",
				done: "Soru hazır"
			}
		]
	},
	{
		num: "07",
		label: "Beceri Yönetimi",
		tools: [{
			id: "skills_load",
			icon: PackagePlus,
			active: "Skills Loading",
			done: "Skills Loaded"
		}, {
			id: "skills_unload",
			icon: PackageMinus,
			active: "Skills Unloading",
			done: "Skills Unloaded"
		}]
	},
	{
		num: "08",
		label: "Hafıza Yönetimi",
		tools: [
			{
				id: "memory_add",
				icon: CirclePlus,
				active: "Memory Adding",
				done: "Memory Added"
			},
			{
				id: "memory_recall",
				icon: ScanSearch,
				active: "Memory Recalling",
				done: "Memory Recalled"
			},
			{
				id: "memory_edit",
				icon: PenLine,
				active: "Memory Editing",
				done: "Memory Edited"
			},
			{
				id: "memory_remove",
				icon: CircleMinus,
				active: "Memory Removing",
				done: "Memory Removed"
			}
		]
	},
	{
		num: "09",
		label: "Entegrasyon ve API",
		tools: [{
			id: "api_request",
			icon: Plug,
			active: "API Requesting",
			done: "API Requested"
		}, {
			id: "deploy",
			icon: Rocket,
			active: "Deploying",
			done: "Deployed"
		}]
	}
].flatMap((category) => category.tools);
function findTool(id) {
	return ALL_TOOLS.find((tool) => tool.id === id);
}
var _jsxFileName$3 = "/home/ubuntu/roxan-agent-v2/src/components/chat/tool-call-row.tsx";
function ToolCallRow({ toolCall }) {
	const [expanded, setExpanded] = (0, import_react.useState)(false);
	const tool = findTool(toolCall.toolId);
	const Icon = tool?.icon ?? Plug;
	const isActive = toolCall.status === "active";
	const isDone = toolCall.status === "done";
	const isError = toolCall.status === "error";
	const label = isDone ? tool?.done ?? toolCall.toolId : tool?.active ?? toolCall.toolId;
	const expandable = !isActive && (toolCall.input !== void 0 || toolCall.output !== void 0);
	const displayLabel = toolCall.toolId === "command_exec" ? "Bash" : label;
	async function copyContent(value) {
		try {
			await navigator.clipboard.writeText(formatContent(value));
			toast("Tool içeriği kopyalandı.");
		} catch {
			toast("İçerik kopyalanamadı.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "w-full min-w-0 overflow-hidden font-sans",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
			type: "button",
			className: cn("flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-subtle transition-colors hover:bg-bg-subtle", expandable ? "cursor-pointer" : "cursor-default", isActive && "bg-bg-subtle text-fg", isDone && "text-muted", isError && "text-danger"),
			onClick: () => expandable && setExpanded((value) => !value),
			"aria-expanded": expandable ? expanded : void 0,
			disabled: !expandable,
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Icon, {
					className: "size-3.5 shrink-0",
					strokeWidth: 1.75
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 11,
					columnNumber: 507
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: cn("min-w-0 truncate", isActive && "tool-row-shimmer"),
					children: displayLabel
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 11,
					columnNumber: 564
				}, this),
				toolCall.detail ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "min-w-0 flex-1 truncate text-xs text-subtle",
					children: toolCall.detail
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 11,
					columnNumber: 677
				}, this) : null,
				expandable ? expanded ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronUp, {
					className: "ml-auto size-3.5 shrink-0 text-subtle",
					strokeWidth: 1.8
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 11,
					columnNumber: 797
				}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ChevronDown, {
					className: "ml-auto size-3.5 shrink-0 text-subtle",
					strokeWidth: 1.8
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 11,
					columnNumber: 881
				}, this) : null
			]
		}, void 0, true, {
			fileName: _jsxFileName$3,
			lineNumber: 11,
			columnNumber: 68
		}, this), expanded ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "mt-1 mb-1.5 ml-2 w-[calc(100%-0.5rem)] max-w-full min-w-0 overflow-hidden rounded-xl bg-bg-subtle shadow-border",
			children: [toolCall.input !== void 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToolDetailBlock, {
				title: "Ne yapıldı?",
				value: toolCall.input,
				onCopy: copyContent,
				toolId: toolCall.toolId
			}, void 0, false, {
				fileName: _jsxFileName$3,
				lineNumber: 11,
				columnNumber: 1155
			}, this) : null, toolCall.output !== void 0 ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToolDetailBlock, {
				title: "Sonuç",
				value: toolCall.output,
				onCopy: copyContent,
				toolId: toolCall.toolId
			}, void 0, false, {
				fileName: _jsxFileName$3,
				lineNumber: 11,
				columnNumber: 1304
			}, this) : null]
		}, void 0, true, {
			fileName: _jsxFileName$3,
			lineNumber: 11,
			columnNumber: 994
		}, this) : null]
	}, void 0, true, {
		fileName: _jsxFileName$3,
		lineNumber: 11,
		columnNumber: 10
	}, this);
}
function ToolDetailBlock({ title, value, onCopy, toolId }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "min-w-0 max-w-full border-t border-border first:border-t-0",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-muted uppercase",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: title }, void 0, false, {
				fileName: _jsxFileName$3,
				lineNumber: 13,
				columnNumber: 358
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
				type: "button",
				onClick: () => onCopy(value),
				"aria-label": `${title} içeriğini kopyala`,
				className: "grid size-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-bg-elevated hover:text-fg",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Copy, {
					className: "size-3.5",
					strokeWidth: 1.7
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 13,
					columnNumber: 581
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName$3,
				lineNumber: 13,
				columnNumber: 378
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName$3,
			lineNumber: 13,
			columnNumber: 230
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "max-h-72 max-w-full min-w-0 overflow-x-auto overflow-y-auto px-2.5 pb-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap text-fg",
			children: friendlyContent(value, toolId)
		}, void 0, false, {
			fileName: _jsxFileName$3,
			lineNumber: 13,
			columnNumber: 643
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName$3,
		lineNumber: 13,
		columnNumber: 154
	}, this);
}
function friendlyContent(value, toolId) {
	if (typeof value === "string") return value;
	if (!value || typeof value !== "object") return String(value ?? "");
	const record = value;
	if (toolId === "web_search") {
		const rows = Array.isArray(record.results) ? record.results : record.data && typeof record.data === "object" && Array.isArray(record.data.results) ? record.data.results : [];
		if (rows.length) return rows.map((item) => {
			const row = item;
			return `• ${String(row.title ?? row.name ?? row.url ?? "Sayfa")}${row.url ? `\n  ${String(row.url)}` : ""}`;
		}).join("\n");
	}
	const lines = [
		"title",
		"name",
		"url",
		"query",
		"path",
		"command",
		"summary",
		"description",
		"status",
		"message"
	].filter((key) => record[key] !== void 0 && record[key] !== null).map((key) => `${friendlyKey(key)}: ${String(record[key])}`);
	if (lines.length) return lines.join("\n");
	const serialized = JSON.stringify(value, null, 2);
	return serialized && serialized !== "{}" ? serialized.slice(0, 24e3) : "Tool tamamlandı.";
}
function friendlyKey(key) {
	return {
		url: "Adres",
		query: "Arama",
		path: "Dosya",
		command: "Komut",
		title: "Başlık",
		status: "Durum",
		message: "Mesaj"
	}[key] ?? key;
}
function formatContent(value) {
	return typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? String(value);
}
var _jsxFileName$2 = "/home/ubuntu/roxan-agent-v2/src/components/chat/tool-call-list.tsx";
function ToolCallList({ toolCalls }) {
	if (!toolCalls || toolCalls.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "rise-in mb-0.5 flex flex-col gap-px",
		children: toolCalls.map((toolCall) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToolCallRow, { toolCall }, toolCall.callId, false, {
			fileName: _jsxFileName$2,
			lineNumber: 9,
			columnNumber: 9
		}, this))
	}, void 0, false, {
		fileName: _jsxFileName$2,
		lineNumber: 7,
		columnNumber: 5
	}, this);
}
var _jsxFileName$1 = "/home/ubuntu/roxan-agent-v2/src/components/chat/message-bubble.tsx";
function MessageBubble({ message, streaming, onReply, onReplyClick, id }) {
	const isUser = message.role === "user";
	const emptyStream = streaming && !message.content && !message.error && (!message.toolCalls || message.toolCalls.length === 0);
	const canActions = !isUser && Boolean(message.content || message.error) && !streaming;
	async function copyResponse() {
		const value = message.content || message.error || "";
		try {
			await navigator.clipboard.writeText(value);
			toast("Yanıt kopyalandı.");
		} catch {
			toast("Yanıt kopyalanamadı.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		id,
		className: cn("flex w-full min-w-0", isUser ? "flex-col items-end justify-end gap-1" : "flex-col items-start justify-start gap-1"),
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: cn("max-w-full min-w-0 overflow-hidden text-sm leading-relaxed text-fg sm:max-w-xl", isUser ? "self-end rounded-2xl rounded-br-md bg-bg-elevated px-4 py-2.5 shadow-border" : "flex flex-col gap-2 rounded-2xl rounded-bl-md bg-bg-elevated px-4 py-2.5 shadow-border"),
				children: [
					message.attachments?.length ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "mb-1 flex flex-wrap gap-1.5",
						children: message.attachments.map((attachment) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "inline-flex max-w-full items-center gap-1.5 rounded-lg bg-bg-subtle px-2 py-1 text-xs text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "text-muted",
								children: attachment.kind === "image" ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Image, { className: "size-3.5" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 8,
									columnNumber: 336
								}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(FileText, { className: "size-3.5" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 8,
									columnNumber: 369
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 8,
								columnNumber: 276
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "max-w-40 truncate",
								children: attachment.name
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 8,
								columnNumber: 410
							}, this)]
						}, `${attachment.name}-${attachment.kind}`, true, {
							fileName: _jsxFileName$1,
							lineNumber: 8,
							columnNumber: 118
						}, this))
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 8,
						columnNumber: 32
					}, this) : null,
					!isUser ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToolCallList, { toolCalls: message.toolCalls }, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 9,
						columnNumber: 12
					}, this) : null,
					!isUser ? message.toolCalls?.map((call) => {
						const data = call.output && typeof call.output === "object" ? call.output : null;
						const nested = data?.data && typeof data.data === "object" ? data.data : data;
						const url = typeof nested?.downloadUrl === "string" ? nested.downloadUrl : "";
						const filename = typeof nested?.filename === "string" ? nested.filename : "roxan-project.zip";
						return url ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
							href: url,
							download: filename,
							className: "flex items-center gap-3 rounded-xl border border-border bg-bg-subtle p-3 text-left hover:bg-bg-elevated",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "grid size-10 place-items-center rounded-lg bg-bg-elevated",
								children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Download, { className: "size-5 text-muted" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 9,
									columnNumber: 770
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 694
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", {
									className: "block truncate text-sm text-fg",
									children: [filename.replace(/\.zip$/i, ""), " "]
								}, void 0, true, {
									fileName: _jsxFileName$1,
									lineNumber: 9,
									columnNumber: 845
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-xs text-muted",
									children: "ZIP · İndirmek için dokun"
								}, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 9,
									columnNumber: 939
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 819
							}, this)]
						}, `output-${call.callId}`, true, {
							fileName: _jsxFileName$1,
							lineNumber: 9,
							columnNumber: 514
						}, this) : null;
					}) : null,
					emptyStream ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "flex h-6 items-center gap-1.5",
						"aria-label": "Yazıyor",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "typing-dot size-1.5 rounded-full bg-muted" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 1122
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "typing-dot size-1.5 rounded-full bg-muted" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 1184
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "typing-dot size-1.5 rounded-full bg-muted" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 1246
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 9,
						columnNumber: 1053
					}, this) : message.content || message.error ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "min-w-0 break-words",
						children: [
							message.content ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MarkdownText, { value: message.content }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 1409
							}, this) : null,
							streaming && message.content ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-fg align-middle" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 1489
							}, this) : null,
							message.error ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: message.content ? "mt-1 block text-danger" : "text-danger",
								children: message.error
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 9,
								columnNumber: 1598
							}, this) : null
						]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 9,
						columnNumber: 1353
					}, this) : null
				]
			}, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 7,
				columnNumber: 818
			}, this),
			isUser && message.replyTo ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
				type: "button",
				className: "mr-0 flex max-w-xl items-center gap-1.5 self-end border-r-2 border-border px-2 text-xs text-muted hover:text-fg",
				onClick: () => onReplyClick?.(message.replyTo.id),
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Reply, { className: "size-3 -scale-x-100" }, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 9,
					columnNumber: 1952
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "truncate",
					children: "Replied to Agent"
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 9,
					columnNumber: 1993
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 9,
				columnNumber: 1754
			}, this) : null,
			canActions ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "ml-2 flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					className: "grid size-7 place-items-center rounded-lg text-muted hover:bg-bg-subtle hover:text-fg",
					onClick: copyResponse,
					"aria-label": "Yanıtı kopyala",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Copy, { className: "size-3.5" }, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 9,
						columnNumber: 2291
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 9,
					columnNumber: 2120
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					className: "grid size-7 place-items-center rounded-lg text-muted hover:bg-bg-subtle hover:text-fg",
					onClick: onReply,
					"aria-label": "Bu yanıta cevap ver",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Reply, { className: "size-3.5" }, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 9,
						columnNumber: 2500
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 9,
					columnNumber: 2329
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 9,
				columnNumber: 2074
			}, this) : null
		]
	}, void 0, true, {
		fileName: _jsxFileName$1,
		lineNumber: 7,
		columnNumber: 673
	}, this);
}
function MarkdownText({ value }) {
	const lines = value.replace(/\r\n?/g, "\n").split("\n");
	const output = [];
	let list = [];
	let code = false;
	let codeLines = [];
	const flushList = () => {
		if (list.length) {
			output.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("ul", {
				className: "my-2 list-disc space-y-1 pl-5",
				children: list.map((item, index) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("li", { children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineText, { value: item }, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 10,
					columnNumber: 393
				}, this) }, index, false, {
					fileName: _jsxFileName$1,
					lineNumber: 10,
					columnNumber: 377
				}, this))
			}, `list-${output.length}`, false, {
				fileName: _jsxFileName$1,
				lineNumber: 10,
				columnNumber: 274
			}, this));
			list = [];
		}
	};
	lines.forEach((line, index) => {
		if (line.trim().startsWith("```")) {
			flushList();
			if (code) {
				output.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("pre", {
					className: "my-2 max-w-full overflow-x-auto rounded-lg bg-bg-subtle p-3 text-xs leading-relaxed",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("code", { children: codeLines.join("\n") }, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 10,
						columnNumber: 681
					}, this)
				}, `code-${index}`, false, {
					fileName: _jsxFileName$1,
					lineNumber: 10,
					columnNumber: 558
				}, this));
				codeLines = [];
			}
			code = !code;
			return;
		}
		if (code) {
			codeLines.push(line);
			return;
		}
		const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
		if (bullet) {
			list.push(bullet[1]);
			return;
		}
		flushList();
		const heading = line.match(/^\s*(#{1,3})\s+(.+)$/);
		if (heading) {
			const size = heading[1].length === 1 ? "text-lg" : heading[1].length === 2 ? "text-base" : "text-sm";
			output.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
				className: cn("mt-3 mb-1 font-semibold", size),
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineText, { value: heading[2] }, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 10,
					columnNumber: 1163
				}, this)
			}, index, false, {
				fileName: _jsxFileName$1,
				lineNumber: 10,
				columnNumber: 1099
			}, this));
		} else if (line.trim()) output.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
			className: "m-0 min-w-0",
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(InlineText, { value: line }, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 10,
				columnNumber: 1279
			}, this)
		}, index, false, {
			fileName: _jsxFileName$1,
			lineNumber: 10,
			columnNumber: 1240
		}, this));
		else output.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "h-2" }, index, false, {
			fileName: _jsxFileName$1,
			lineNumber: 10,
			columnNumber: 1330
		}, this));
	});
	flushList();
	if (codeLines.length) output.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("pre", {
		className: "my-2 max-w-full overflow-x-auto rounded-lg bg-bg-subtle p-3 text-xs",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("code", { children: codeLines.join("\n") }, void 0, false, {
			fileName: _jsxFileName$1,
			lineNumber: 10,
			columnNumber: 1520
		}, this)
	}, "code-tail", false, {
		fileName: _jsxFileName$1,
		lineNumber: 10,
		columnNumber: 1419
	}, this));
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "min-w-0",
		children: output
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 10,
		columnNumber: 1571
	}, this);
}
function InlineText({ value }) {
	const pieces = value.split(/(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|https?:\/\/[^\s<]+|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);
	const result = [];
	for (let index = 0; index < pieces.length; index += 1) {
		const piece = pieces[index];
		if (!piece) continue;
		if (piece.startsWith("[") && pieces[index + 2]) {
			result.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
				href: pieces[index + 2],
				target: "_blank",
				rel: "noreferrer",
				className: "break-all text-accent underline underline-offset-2 hover:opacity-80",
				children: pieces[index + 1]
			}, index, false, {
				fileName: _jsxFileName$1,
				lineNumber: 11,
				columnNumber: 418
			}, this));
			index += 2;
		} else if (/^https?:\/\//.test(piece)) result.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
			href: piece.replace(/[),.;!?]+$/, ""),
			target: "_blank",
			rel: "noreferrer",
			className: "break-all text-accent underline underline-offset-2 hover:opacity-80",
			children: piece
		}, index, false, {
			fileName: _jsxFileName$1,
			lineNumber: 11,
			columnNumber: 660
		}, this));
		else if (piece.startsWith("`") && piece.endsWith("`")) result.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("code", {
			className: "rounded bg-bg-subtle px-1 py-0.5 text-[0.9em]",
			children: piece.slice(1, -1)
		}, index, false, {
			fileName: _jsxFileName$1,
			lineNumber: 11,
			columnNumber: 908
		}, this));
		else if (piece.startsWith("**") && piece.endsWith("**") || piece.startsWith("__") && piece.endsWith("__")) result.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", { children: piece.slice(2, -2) }, index, false, {
			fileName: _jsxFileName$1,
			lineNumber: 11,
			columnNumber: 1137
		}, this));
		else if (piece.startsWith("*") && piece.endsWith("*") || piece.startsWith("_") && piece.endsWith("_")) result.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("em", { children: piece.slice(1, -1) }, index, false, {
			fileName: _jsxFileName$1,
			lineNumber: 11,
			columnNumber: 1308
		}, this));
		else result.push(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_react.Fragment, { children: piece }, index, false, {
			fileName: _jsxFileName$1,
			lineNumber: 11,
			columnNumber: 1369
		}, this));
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: result }, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 11,
		columnNumber: 1421
	}, this);
}
function fallbackHttpMessage(status) {
	if (status === 401) return "Yetkisiz (401). API token geçersiz olabilir.";
	if (status === 403) return "Erişim reddedildi (403). Account ID / token izinlerini kontrol et.";
	if (status === 404) return "Bulunamadı (404). Model adı veya Account ID hatalı olabilir.";
	if (status === 429) return "Kota aşıldı (429). Biraz bekleyip tekrar dene.";
	if (status >= 500) return `Sunucu hatası (${status}).`;
	return `Yanıt alınamadı (${status}).`;
}
async function readErrorMessage(response) {
	const raw = await response.text();
	if (!raw.trim()) return fallbackHttpMessage(response.status);
	if (/<(!doctype|html|head|body)\b/i.test(raw)) {
		if (response.status === 521) return "Sunucu erişilemiyor (521). Roxan eski Worker adresini kullanmıyor; Ayarlar'daki Account ID, API Token ve modeli kaydedip tekrar dene.";
		return fallbackHttpMessage(response.status);
	}
	try {
		const data = JSON.parse(raw);
		if (data.message) return data.message;
		if (data.error) return data.error;
	} catch {}
	const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 280);
	return `${fallbackHttpMessage(response.status)} ${snippet}`;
}
async function streamChat(payload, handlers, signal) {
	let response;
	try {
		response = await fetch("/api/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			signal
		});
	} catch (error) {
		if (signal?.aborted) throw error;
		const detail = error instanceof Error ? error.message : "ağ hatası";
		throw new Error(`Sohbet servisine bağlanılamadı. ${detail}`);
	}
	if (!response.ok) throw new Error(await readErrorMessage(response));
	if (!response.body) throw new Error("Boş yanıt alındı. Proxy yanıt gövdesi döndürmedi.");
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	let sawEvent = false;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed.startsWith("data:")) continue;
			const data = trimmed.slice(5).trim();
			if (!data || data === "[DONE]") continue;
			let event;
			try {
				event = JSON.parse(data);
			} catch {
				continue;
			}
			sawEvent = true;
			if (event.type === "delta" && event.text) handlers.onDelta(event.text);
			if (event.type === "tool_call") handlers.onToolCall?.(event);
			if (event.type === "tool_result") handlers.onToolResult?.(event);
			if (event.type === "ask") handlers.onAsk?.(event);
			if (event.type === "error") throw new Error(event.message);
		}
	}
	if (!sawEvent) throw new Error("Sunucu olay göndermeden kapandı. Model veya Account ID'yi kontrol et.");
}
var _jsxFileName = "/home/ubuntu/roxan-agent-v2/src/components/chat/chat-view.tsx";
function ChatView({ buildMode = false, initialPrompt } = {}) {
	const navigate = useNavigate();
	const hydrated = useRoxan((state) => state.hydrated);
	const settings = useRoxan((state) => state.settings);
	const chatModelMode = useRoxan((state) => state.chatModelMode);
	const webSearchEnabled = useRoxan((state) => state.webSearchEnabled);
	const setWebSearchEnabled = useRoxan((state) => state.setWebSearchEnabled);
	const reasoningEnabled = useRoxan((state) => state.reasoningEnabled);
	const setReasoningEnabled = useRoxan((state) => state.setReasoningEnabled);
	const conversations = useRoxan((state) => state.conversations);
	const activeId = useRoxan((state) => state.activeConversationId);
	const streamingId = useRoxan((state) => state.streamingId);
	const abortRef = (0, import_react.useRef)(null);
	const buildStartedRef = (0, import_react.useRef)(false);
	const bottomRef = (0, import_react.useRef)(null);
	const scrollRef = (0, import_react.useRef)(null);
	const [showJumpToLatest, setShowJumpToLatest] = (0, import_react.useState)(false);
	const [replyTo, setReplyTo] = (0, import_react.useState)(null);
	const [askQueue, setAskQueue] = (0, import_react.useState)([]);
	const messages = (conversations.find((item) => item.id === activeId) ?? conversations[0])?.messages ?? [];
	const configured = isConfigured(settings);
	const firecrawlReady = hasFirecrawl(settings);
	const memoryReady = hasMemory(settings);
	const reasoningSupported = supportsReasoning(chatModelMode === "flash" ? settings.modelProfiles.flashModel : settings.modelProfiles.defaultModel);
	const empty = messages.length === 0;
	(0, import_react.useEffect)(() => {
		const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (!showJumpToLatest) bottomRef.current?.scrollIntoView({
			behavior: reduce ? "auto" : "smooth",
			block: "end"
		});
	}, [
		messages,
		streamingId,
		showJumpToLatest
	]);
	function handleScroll() {
		const element = scrollRef.current;
		if (!element) return;
		setShowJumpToLatest(element.scrollHeight - element.scrollTop - element.clientHeight > 120);
	}
	function jumpToLatest() {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth"
		});
		setShowJumpToLatest(false);
	}
	(0, import_react.useEffect)(() => {
		return () => abortRef.current?.abort();
	}, []);
	(0, import_react.useEffect)(() => {
		if (buildMode && initialPrompt && !buildStartedRef.current) {
			buildStartedRef.current = true;
			useRoxan.getState().newConversation();
			setTimeout(() => void send(initialPrompt, [], true), 0);
		}
	}, [buildMode, initialPrompt]);
	(0, import_react.useEffect)(() => {
		if (buildMode) return;
		const handleBuildSubmit = (event) => {
			const content = event.detail;
			if (content) send(content, [], true);
		};
		window.addEventListener("roxan:build-submit", handleBuildSubmit);
		return () => window.removeEventListener("roxan:build-submit", handleBuildSubmit);
	});
	async function send(content, attachments = [], workspaceMode = buildMode) {
		if (content.trim().toLowerCase() === "/ask") {
			setAskQueue((queue) => [...queue, {
				question: "Projenin hedef kitlesi kim?",
				options: [
					"Bireysel kullanıcılar",
					"Küçük işletmeler",
					"Kurumsal ekipler"
				]
			}]);
			return;
		}
		if (!configured) {
			toast("Önce ayarlardan bağlantıyı tamamla.");
			navigate({ to: "/settings" });
			return;
		}
		if (/(hatırla|unut|hafızaya|memory|mem0)/i.test(content) && !memoryReady) {
			toast("Memory bağlı değil. Ayarlardan Mem0 API Key ekle.");
			navigate({ to: "/settings" });
			return;
		}
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		const { assistantId } = useRoxan.getState().startTurn(content, attachments.map(({ name, kind, type, dataUrl }) => ({
			name,
			kind,
			type,
			dataUrl
		})), replyTo || void 0, workspaceMode ? "build" : "chat");
		const snapshot = useRoxan.getState();
		const active = snapshot.conversations.find((item) => item.id === snapshot.activeConversationId);
		const history = (active?.messages ?? []).filter((message) => message.id !== assistantId && (message.content.trim() || Boolean(message.attachments?.length)) && !message.error).map((message) => {
			const isCurrentUser = message.role === "user" && message.id === active?.messages.filter((item) => item.role === "user").at(-1)?.id;
			const attachmentsText = message.attachments?.map((attachment) => `Ek dosya: ${attachment.name}`).join("\n") || "";
			const priorImages = active?.messages.filter((item) => item.role === "user").flatMap((item) => item.attachments || []).filter((attachment) => attachment.kind === "image" && attachment.dataUrl).slice(-3) || [];
			const imageContext = isCurrentUser && !message.attachments?.length && priorImages.length ? priorImages : message.attachments || [];
			const content = isCurrentUser && imageContext.length ? [{
				type: "text",
				text: `${message.content || "Ekli görseli incele."}\n${attachmentsText}`
			}, ...imageContext.filter((attachment) => attachment.kind === "image" && attachment.dataUrl).map((attachment) => ({
				type: "image_url",
				image_url: { url: attachment.dataUrl }
			}))] : message.content || attachmentsText;
			return {
				role: message.role,
				content
			};
		});
		const currentUser = history[history.length - 1];
		if (currentUser && attachments.length > 0) currentUser.content = [
			{
				type: "text",
				text: typeof currentUser.content === "string" && currentUser.content.trim() ? currentUser.content : "Ekli dosya ve görselleri incele."
			},
			...attachments.filter((attachment) => attachment.kind === "image").map((attachment) => ({
				type: "image_url",
				image_url: { url: attachment.dataUrl }
			})),
			...attachments.filter((attachment) => attachment.kind === "file").map((attachment) => ({
				type: "text",
				text: `Ekli dosya: ${attachment.name}\n${attachment.dataUrl}`
			}))
		];
		try {
			await streamChat({
				settings: {
					...snapshot.settings,
					model: workspaceMode ? snapshot.settings.modelProfiles.agenticModel : chatModelMode === "flash" ? snapshot.settings.modelProfiles.flashModel : snapshot.settings.modelProfiles.defaultModel
				},
				messages: history,
				webSearchEnabled: snapshot.webSearchEnabled && hasFirecrawl(snapshot.settings),
				reasoningEnabled: snapshot.reasoningEnabled && supportsReasoning(workspaceMode ? snapshot.settings.modelProfiles.agenticModel : chatModelMode === "flash" ? snapshot.settings.modelProfiles.flashModel : snapshot.settings.modelProfiles.defaultModel),
				workspaceMode,
				chatModelMode,
				workspaceId: workspaceMode && typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default"
			}, {
				onDelta: (delta) => useRoxan.getState().appendAssistant(assistantId, delta),
				onToolCall: (event) => {
					useRoxan.getState().pushToolCall(assistantId, {
						callId: event.callId,
						toolId: event.toolId,
						status: "active",
						detail: event.detail,
						input: event.data ?? event.detail
					});
				},
				onToolResult: (event) => {
					useRoxan.getState().updateToolCall(assistantId, event.callId, {
						status: event.error ? "error" : "done",
						detail: event.detail,
						output: event.data ?? event.detail
					});
				},
				onAsk: (event) => {
					setAskQueue((queue) => [...queue, {
						question: event.question,
						options: event.options || []
					}]);
				}
			}, controller.signal);
			useRoxan.getState().finishTurn(assistantId);
		} catch (error) {
			if (controller.signal.aborted) {
				useRoxan.getState().finishTurn(assistantId);
				return;
			}
			const message = error instanceof Error ? error.message : "Yanıt alınamadı.";
			if (/failed to fetch|networkerror|network error|load failed/i.test(message)) {
				useRoxan.getState().finishTurn(assistantId);
				toast("Bağlantı kesildi; mesajını tekrar göndererek devam edebilirsin.");
				return;
			}
			useRoxan.getState().failTurn(assistantId, message);
		}
	}
	function stop() {
		abortRef.current?.abort();
		const id = useRoxan.getState().streamingId;
		if (id) useRoxan.getState().finishTurn(id);
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "relative flex min-h-0 flex-1 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				ref: scrollRef,
				onScroll: handleScroll,
				className: "flex min-h-0 flex-1 flex-col overflow-y-auto",
				children: empty ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(EmptyState, {
					configured,
					ready: hydrated
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 173,
					columnNumber: 11
				}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-5",
					children: [messages.filter((message) => message.role !== "system").map((message) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MessageBubble, {
						id: `message-${message.id}`,
						message,
						streaming: message.id === streamingId,
						onReply: message.role === "assistant" ? () => setReplyTo({
							id: message.id,
							content: message.content || message.error || ""
						}) : void 0,
						onReplyClick: (id) => {
							document.getElementById(`message-${id}`)?.scrollIntoView({
								behavior: "smooth",
								block: "center"
							});
						}
					}, message.id, false, {
						fileName: _jsxFileName,
						lineNumber: 179,
						columnNumber: 17
					}, this)), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { ref: bottomRef }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 188,
						columnNumber: 13
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 175,
					columnNumber: 11
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 171,
				columnNumber: 7
			}, this),
			showJumpToLatest ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
				type: "button",
				variant: "outline",
				size: "icon",
				className: "absolute bottom-44 left-1/2 z-10 size-10 -translate-x-1/2 rounded-full bg-bg-elevated shadow-border-hover",
				onClick: jumpToLatest,
				"aria-label": "En yeni mesaja git",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ArrowDown, { className: "size-4" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 192,
					columnNumber: 252
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 192,
				columnNumber: 27
			}, this) : null,
			askQueue.length ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AskPanel, {
				item: askQueue[0],
				onAnswer: (answer) => {
					setAskQueue((queue) => queue.slice(1));
					send(answer, [], buildMode);
				},
				onSkip: () => setAskQueue((queue) => queue.slice(1)),
				position: askQueue.length
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 193,
				columnNumber: 26
			}, this) : null,
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Composer, {
				disabled: !hydrated,
				streaming: Boolean(streamingId),
				webSearchEnabled: webSearchEnabled && firecrawlReady,
				firecrawlReady,
				onToggleWebSearch: setWebSearchEnabled,
				memoryReady,
				onOpenSettings: () => void navigate({ to: "/settings" }),
				reasoningEnabled,
				reasoningSupported,
				onToggleReasoning: setReasoningEnabled,
				onSend: send,
				onStop: stop,
				replyTo,
				onClearReply: () => setReplyTo(null)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 194,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 170,
		columnNumber: 5
	}, this);
}
function AskPanel({ item, onAnswer, onSkip, position }) {
	const [value, setValue] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "absolute bottom-44 left-1/2 z-20 w-[min(92vw,36rem)] -translate-x-1/2 rounded-2xl bg-bg-elevated p-3 shadow-border-hover",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mb-2 flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "shrink-0 text-xs text-muted",
					children: [
						1,
						" of ",
						position
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 214,
					columnNumber: 413
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "m-0 min-w-0 flex-1 text-sm leading-relaxed text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("strong", {
						className: "mr-1",
						children: "Q:"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 214,
						columnNumber: 549
					}, this), item.question]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 214,
					columnNumber: 483
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 214,
				columnNumber: 368
			}, this),
			item.options.length ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mb-2 flex flex-col gap-1.5",
				children: item.options.map((option, index) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					className: "rounded-xl bg-bg-subtle px-3 py-2 text-left text-xs text-fg hover:bg-border",
					onClick: () => onAnswer(option),
					children: [
						index + 1,
						") ",
						option
					]
				}, `${option}-${index}`, true, {
					fileName: _jsxFileName,
					lineNumber: 214,
					columnNumber: 714
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 214,
				columnNumber: 633
			}, this) : null,
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
				className: "flex gap-2",
				onSubmit: (event) => {
					event.preventDefault();
					if (value.trim()) {
						onAnswer(value.trim());
						setValue("");
					}
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("input", {
						value,
						onChange: (event) => setValue(event.target.value),
						placeholder: "Kendi yanıtını yaz",
						className: "min-w-0 flex-1 rounded-xl bg-bg-subtle px-3 py-2 text-sm text-fg outline-none"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 214,
						columnNumber: 1069
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
						type: "submit",
						size: "sm",
						children: "Gönder"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 214,
						columnNumber: 1266
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						onClick: onSkip,
						children: "Atla"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 214,
						columnNumber: 1313
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 214,
				columnNumber: 930
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 214,
		columnNumber: 230
	}, this);
}
function EmptyState({ configured, ready }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex flex-1 flex-col items-center justify-center px-6 pb-8 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
			className: "rise-in font-display text-5xl tracking-tight text-fg italic sm:text-6xl",
			children: "Roxan"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 218,
			columnNumber: 7
		}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
			className: "rise-in-delay mt-3 max-w-sm text-sm leading-relaxed text-muted",
			children: ready && !configured ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
				"Bağlantı henüz kurulmadı.",
				" ",
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
					to: "/settings",
					className: "text-fg underline decoration-border underline-offset-4",
					children: "Ayarlardan"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 225,
					columnNumber: 13
				}, this),
				" ",
				"Cloudflare Account ID, API Token ve modeli gir."
			] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 223,
				columnNumber: 11
			}, this) : "Ne üzerinde çalışalım?"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 221,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 217,
		columnNumber: 5
	}, this);
}
//#endregion
export { ChatView as t };
