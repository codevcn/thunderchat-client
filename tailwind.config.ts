// @filename tailwind.config.js

import type { Config } from "tailwindcss"

const config: Config = {
   darkMode: ["class"],
   content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/materials/**/*.{js,ts,tsx,mdx}",
   ],
   theme: {
      extend: {
         fontFamily: {
            sans: ["ui-sans-serif", "system-ui"],
            serif: ["ui-serif", "Georgia"],
            mono: ["ui-monospace", "SFMono-Regular"],
            roboto: ["var(--ggfont-roboto)"],
         },
         screens: {
            xs: "480px",
            sm: "640px",
            md: "768px",
            lg: "1024px",
            xl: "1280px",
            "screen-medium-chatting": "970px",
            "screen-large-chatting": "1275px",
         },
         backgroundImage: {
            "user-avt-bgimg": "var(--tdc-user-avt-bgimg)",
            "modal-text-bgimg": "var(--tdc-modal-text-bgimg)",
         },
         backgroundSize: {
            "regular-full-bgsize": "var(--tdc-full-bgsize)",
         },
         colors: {
            "regular-red-cl": "var(--tdc-regular-red-cl)",
            "regular-green-cl": "var(--tdc-regular-green-cl)",
            "regular-orange-cl": "var(--tdc-regular-orange-cl)",
            "regular-dark-gray-cl": "var(--tdc-regular-dark-gray-cl)",
            "regular-white-cl": "var(--tdc-regular-white-cl)",
            "regular-trans-cl": "var(--tdc-regular-trans-cl)",
            "regular-black-cl": "var(--tdc-regular-black-cl)",
            "regular-violet-cl": "var(--tdc-regular-violet-cl)",
            "regular-hover-card-cl": "var(--tdc-regular-hover-card-cl)",
            "regular-icon-cl": "var(--tdc-regular-icon-cl)",
            "regular-icon-btn-cl": "var(--tdc-regular-icon-btn-cl)",
            "regular-placeholder-cl": "var(--tdc-regular-placeholder-cl)",
            "regular-recipient-msg-time-cl": "var(--tdc-regular-recipient-msg-time-cl)",
            "regular-creator-msg-time-cl": "var(--tdc-regular-creator-msg-time-cl)",
            "regular-text-secondary-cl": "var(--tdc-regular-text-secondary-cl)",
            "regular-info-bar-bgcl": "var(--tdc-regular-info-bar-bgcl)",
            "regular-modal-board-bgcl": "var(--tdc-regular-modal-board-bgcl)",
            "regular-button-bgcl": "var(--tdc-regular-button-bgcl)",
            "regular-hover-bgcl": "var(--tdc-regular-hover-bgcl)",
            "regular-divider-cl": "var(--tdc-regular-divider-cl)",
            "regular-tooltip-bgcl": "var(--tdc-regular-tooltip-bgcl)",
            "regular-border-cl": "var(--tdc-regular-border-cl)",
            "expression-picker-bgcl": "var(--tdc-expression-picker-bgcl)",
            "regular-badge-bgcl": "var(--tdc-badge-bgcl)",
            "regular-dropdown-board-bgcl": "var(--tdc-regular-dropdown-board-bgcl)",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            card: {
               DEFAULT: "hsl(var(--card))",
               foreground: "hsl(var(--card-foreground))",
            },
            popover: {
               DEFAULT: "hsl(var(--popover))",
               foreground: "hsl(var(--popover-foreground))",
            },
            primary: {
               DEFAULT: "hsl(var(--primary))",
               foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
               DEFAULT: "hsl(var(--secondary))",
               foreground: "hsl(var(--secondary-foreground))",
            },
            muted: {
               DEFAULT: "hsl(var(--muted))",
               foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
               DEFAULT: "hsl(var(--accent))",
               foreground: "hsl(var(--accent-foreground))",
            },
            destructive: {
               DEFAULT: "hsl(var(--destructive))",
               foreground: "hsl(var(--destructive-foreground))",
            },
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            chart: {
               "1": "hsl(var(--chart-1))",
               "2": "hsl(var(--chart-2))",
               "3": "hsl(var(--chart-3))",
               "4": "hsl(var(--chart-4))",
               "5": "hsl(var(--chart-5))",
            },
         },
         fontSize: {
            "user-avt-fsize": "var(--tdc-user-avt-fsize)",
         },
         width: {
            "convs-card": "var(--tdc-convs-card-width)",
            "convs-list": "var(--tdc-convs-list-width)",
            "info-bar": "var(--tdc-info-bar-width)",
            "info-bar-mb": "var(--tdc-info-bar-mb-width)",
            "chat-n-info-container": "var(--tdc-chat-n-info-container-width)",
            "messages-list": "var(--tdc-messages-list-width)",
            "msgs-container": "var(--tdc-msgs-container-width)",
            "type-message-bar": "var(--tdc-type-message-bar-width)",
            "expression-picker": "var(--tdc-expression-picker-width)",
            sticker: "var(--tdc-sticker-width)",
         },
         height: {
            header: "var(--tdc-header-height)",
            "chat-container": "var(--tdc-chat-container-height)",
            "type-msg-bar": "var(--tdc-type-msg-bar-height)",
            "expression-picker": "var(--tdc-expression-picker-height)",
            "inside-expression-picker": "var(--tdc-inside-expression-picker-height)",
            "nav-expression-picker": "var(--tdc-nav-expression-picker-height)",
            sticker: "var(--tdc-sticker-height)",
         },
         inset: {
            "slide-info-bar": "var(--tdc-info-bar-width)",
            "slide-info-mb-bar": "var(--tdc-info-bar-mb-width)",
         },
         transitionTimingFunction: {
            "slide-info-bar-timing": "var(--tdc-slide-info-bar-timing)",
         },
         translate: {
            "slide-chat-container": "var(--tdc-slide-chat-container)",
            "slide-header-icons": "var(--tdc-slide-header-icons)",
         },
         animation: {
            "grow-icon": "grow-icon 0.4s forwards ease-out",
            "hide-icon": "hide-icon 0.4s forwards ease-out",
            "hide-placeholder": "hide-placeholder 0.15s forwards ease-in",
            "grow-placeholder": "grow-placeholder 0.15s forwards ease-out",
            "zoom-fade-in": "zoom-in 0.15s forwards ease, fade-in 0.15s forwards ease",
            "zoom-fade-out": "zoom-out 0.15s forwards ease, fade-out 0.15s forwards ease",
            "super-zoom-out-fade-in":
               "super-zoom-out 0.15s forwards ease, fade-in 0.15s forwards ease",
            "super-zoom-in-fade-out":
               "super-zoom-in 0.15s forwards ease, fade-out 0.15s forwards ease",
            "disappear-zoom-out-s40": "disappear-zoom-out-s40 0.15s forwards linear",
            "appear-zoom-in-s40": "appear-zoom-in-s40 0.15s forwards linear",
            "new-friend-message":
               "new-friend-message 0.2s var(--tdc-new-message-timing) 1 forwards",
            "new-user-message": "new-user-message 0.2s var(--tdc-new-message-timing) 1 forwards",
            "scale-up": "scale-up 0.2s ease-out forwards",
            "typing-message": "typing-message 1s ease-in-out infinite",
         },
         borderRadius: {
            lg: "var(--radius)",
            md: "calc(var(--radius) - 2px)",
            sm: "calc(var(--radius) - 4px)",
         },
         gradientColorStops: {
            "user-avt-gradient-stops-cl": "var(--tdc-user-avt-gradient-stops-cl)",
         },
      },
   },
   plugins: [require("tailwindcss-animate")],
}
export default config
