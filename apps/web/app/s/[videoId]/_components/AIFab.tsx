"use client";

import "./ai-chat.css";

interface AIFabProps {
	onClick: () => void;
}

export function AIFab({ onClick }: AIFabProps) {
	return (
		<button
			type="button"
			className="ai-fab"
			onClick={onClick}
			aria-label="Open AI assistant"
		>
			<span className="ai-fab-aura" />
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					d="M12 2L13.09 8.26L19 6L14.74 10.91L21 12L14.74 13.09L19 18L13.09 15.74L12 22L10.91 15.74L5 18L9.26 13.09L3 12L9.26 10.91L5 6L10.91 8.26L12 2Z"
					fill="white"
					fillOpacity="0.95"
				/>
			</svg>
		</button>
	);
}
