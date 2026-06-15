"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./ai-chat.css";

interface Message {
	role: "user" | "assistant";
	content: string;
}

interface AIChatPopupProps {
	videoId: string;
	onVideoJump: (seconds: number) => void;
	onClose: () => void;
}

const QUICK_ACTIONS = [
	"What were the key decisions?",
	"Summarize the main points",
	"What are the action items?",
	"Who said what about...?",
];

function parseMmSsToSeconds(mmss: string): number {
	const parts = mmss.split(":");
	if (parts.length === 2) {
		return parseInt(parts[0] ?? "0", 10) * 60 + parseInt(parts[1] ?? "0", 10);
	}
	return 0;
}

function splitByLineBreak(text: string, keyOffset: number): React.ReactNode[] {
	return text
		.split("\n")
		.flatMap((line, idx) =>
			idx === 0 ? [line] : [<br key={`br-${keyOffset}-${idx}`} />, line],
		);
}

function renderBoldAndBreaks(
	text: string,
	keyOffset: number,
): React.ReactNode[] {
	const boldRegex = /\*\*(.+?)\*\*/g;
	const segments: React.ReactNode[] = [];
	let last = 0;
	let match: RegExpExecArray | null;
	let i = keyOffset;

	while ((match = boldRegex.exec(text)) !== null) {
		const before = text.slice(last, match.index);
		if (before) {
			segments.push(...splitByLineBreak(before, i));
			i++;
		}
		segments.push(<strong key={`b-${i++}`}>{match[1]}</strong>);
		last = match.index + match[0].length;
	}

	const tail = text.slice(last);
	if (tail) {
		segments.push(...splitByLineBreak(tail, i));
	}

	return segments;
}

function renderMessageContent(
	content: string,
	onVideoJump: (seconds: number) => void,
): React.ReactNode[] {
	const citationRegex = /\[(\d{1,2}:\d{2})\]/g;
	const parts: React.ReactNode[] = [];
	let last = 0;
	let match: RegExpExecArray | null;

	while ((match = citationRegex.exec(content)) !== null) {
		const before = content.slice(last, match.index);
		if (before) {
			parts.push(...renderBoldAndBreaks(before, parts.length));
		}
		const timestamp = match[1] ?? "";
		const seconds = parseMmSsToSeconds(timestamp);
		parts.push(
			<button
				key={`cite-${match.index}`}
				type="button"
				className="ai-citation"
				onClick={() => onVideoJump(seconds)}
			>
				{match[0]}
			</button>,
		);
		last = match.index + match[0].length;
	}

	const tail = content.slice(last);
	if (tail) {
		parts.push(...renderBoldAndBreaks(tail, parts.length + 1000));
	}

	return parts;
}

export function AIChatPopup({
	videoId,
	onVideoJump,
	onClose,
}: AIChatPopupProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const abortRef = useRef<AbortController | null>(null);

	const resizeState = useRef<{
		startX: number;
		startY: number;
		startW: number;
		startH: number;
	} | null>(null);

	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [onClose]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isStreaming]);

	const adjustTextarea = () => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
	};

	const sendMessage = useCallback(
		async (text: string) => {
			const trimmed = text.trim();
			if (!trimmed || isStreaming) return;

			const userMsg: Message = { role: "user", content: trimmed };
			const nextMessages = [...messages, userMsg];
			setMessages(nextMessages);
			setInput("");
			if (textareaRef.current) textareaRef.current.style.height = "auto";
			setIsStreaming(true);

			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			let assistantContent = "";

			try {
				const response = await fetch("/api/video/ai/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						videoId,
						messages: nextMessages.map((m) => ({
							role: m.role,
							content: m.content,
						})),
					}),
					signal: controller.signal,
				});

				if (!response.ok || !response.body) {
					throw new Error(`Request failed: ${response.status}`);
				}

				setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

				const reader = response.body.getReader();
				const decoder = new TextDecoder();

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split("\n");

					for (const line of lines) {
						const trimmedLine = line.trim();
						if (!trimmedLine.startsWith("data:")) continue;
						const payload = trimmedLine.slice(5).trim();
						if (payload === "[DONE]") break;

						try {
							const parsed = JSON.parse(payload) as { token?: string };
							if (parsed.token) {
								assistantContent += parsed.token;
								setMessages((prev) => {
									const updated = [...prev];
									const last = updated[updated.length - 1];
									if (last?.role === "assistant") {
										updated[updated.length - 1] = {
											...last,
											content: assistantContent,
										};
									}
									return updated;
								});
							}
						} catch {
							// non-JSON SSE lines skipped
						}
					}
				}
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setMessages((prev) => [
						...prev,
						{
							role: "assistant",
							content: "Something went wrong. Please try again.",
						},
					]);
				}
			} finally {
				setIsStreaming(false);
				abortRef.current = null;
			}
		},
		[videoId, messages, isStreaming],
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	const onResizeMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		const el = popupRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		resizeState.current = {
			startX: e.clientX,
			startY: e.clientY,
			startW: rect.width,
			startH: rect.height,
		};

		const onMove = (ev: MouseEvent) => {
			if (!resizeState.current || !popupRef.current) return;
			const dx = resizeState.current.startX - ev.clientX;
			const dy = resizeState.current.startY - ev.clientY;
			const newW = Math.max(300, resizeState.current.startW + dx);
			const newH = Math.max(360, resizeState.current.startH + dy);
			popupRef.current.style.width = `${newW}px`;
			popupRef.current.style.height = `${newH}px`;
		};

		const onUp = () => {
			resizeState.current = null;
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};

		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	};

	const hasMessages = messages.length > 0;

	return (
		<div ref={popupRef} className="ai-popup">
			<div className="ai-resize-handle" onMouseDown={onResizeMouseDown} />

			<div className="ai-popup-header">
				<span className="ai-popup-title">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<defs>
							<linearGradient
								id="hdrGrad"
								x1="3"
								y1="2"
								x2="21"
								y2="22"
								gradientUnits="userSpaceOnUse"
							>
								<stop stopColor="#c4b5fd" />
								<stop offset="1" stopColor="#93c5fd" />
							</linearGradient>
						</defs>
						<path
							d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z"
							fill="url(#hdrGrad)"
						/>
					</svg>
					AI Assistant
				</span>
				<button
					type="button"
					className="ai-popup-close"
					onClick={onClose}
					aria-label="Close AI assistant"
				>
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M1 1l10 10M11 1L1 11"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
						/>
					</svg>
				</button>
			</div>

			<div className="ai-messages">
				{!hasMessages && (
					<div className="ai-welcome">
						<p className="ai-welcome-heading">
							Ask anything about this meeting
						</p>
						<div className="ai-chips">
							{QUICK_ACTIONS.map((action) => (
								<button
									key={action}
									type="button"
									className="ai-chip"
									onClick={() => sendMessage(action)}
								>
									{action}
								</button>
							))}
						</div>
					</div>
				)}

				{messages.map((msg, idx) => (
					<div key={idx} className={`ai-message ${msg.role}`}>
						<div className="ai-bubble">
							{msg.role === "assistant"
								? renderMessageContent(msg.content, onVideoJump)
								: msg.content}
						</div>
					</div>
				))}

				{isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
					<div className="ai-typing">
						<span className="ai-typing-dot" />
						<span className="ai-typing-dot" />
						<span className="ai-typing-dot" />
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			<div className="ai-input-bar">
				<textarea
					ref={textareaRef}
					className="ai-textarea"
					placeholder="Ask a question..."
					value={input}
					rows={1}
					onChange={(e) => {
						setInput(e.target.value);
						adjustTextarea();
					}}
					onKeyDown={handleKeyDown}
					disabled={isStreaming}
				/>
				<button
					type="button"
					className="ai-send-btn"
					onClick={() => sendMessage(input)}
					disabled={!input.trim() || isStreaming}
					aria-label="Send message"
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<path d="M1 7.5L14 1L7.5 14L6.5 8.5L1 7.5Z" fill="white" />
					</svg>
				</button>
			</div>
		</div>
	);
}
