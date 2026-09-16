// Shared Clerk `appearance` config so every Clerk-rendered surface
// (sign-in/up modal, UserButton popover, PricingTable) matches the
// app's dark theme (see app/globals.css) instead of Clerk's defaults.
export const clerkAppearance = {
  variables: {
    colorPrimary: "#fbbd0c", // --color-accent
    colorBackground: "#131316", // --color-panel
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText: "#f1f5f9", // slate-100
    colorText: "#f1f5f9",
    colorTextSecondary: "#94a3b8", // --color-muted
    colorNeutral: "#f1f5f9",
    colorDanger: "#f87171",
    colorSuccess: "#34d399",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-outfit), sans-serif",
  },
  elements: {
    card: "bg-panel border border-white/10 shadow-2xl shadow-black/40 rounded-2xl",
    headerTitle: "text-white",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButton:
      "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-100 transition-colors",
    socialButtonsBlockButtonText: "text-slate-100 font-medium",
    dividerLine: "bg-white/10",
    dividerText: "text-slate-500",
    formFieldLabel: "text-slate-300",
    formFieldInput:
      "bg-white/5 border border-white/10 text-slate-100 focus:border-accent rounded-lg transition-colors",
    formFieldInputShowPasswordButton: "text-slate-400 hover:text-slate-200",
    formButtonPrimary:
      "bg-amber-500 hover:bg-amber-600 text-white rounded-full normal-case shadow-none transition-colors",
    footer: "bg-transparent",
    footerActionText: "text-slate-400",
    footerActionLink: "text-amber-500 hover:text-amber-400",
    identityPreview: "bg-white/5 border border-white/10",
    identityPreviewText: "text-slate-200",
    identityPreviewEditButton: "text-amber-500 hover:text-amber-400",
    formResendCodeLink: "text-amber-500 hover:text-amber-400",
    otpCodeFieldInput: "bg-white/5 border border-white/10 text-slate-100",
    alertText: "text-red-400",
    formFieldWarningText: "text-amber-400",
    formFieldSuccessText: "text-emerald-400",
    modalBackdrop: "bg-black/60 backdrop-blur-sm",
    userButtonPopoverCard:
      "bg-panel border border-white/10 shadow-2xl shadow-black/40",
    userButtonPopoverActionButton: "text-slate-200 hover:bg-white/5",
    userButtonPopoverActionButtonText: "text-slate-200",
    userButtonPopoverActionButtonIcon: "text-slate-400",
    userButtonPopoverActionButton__addAccount: { display: "none" },
    userButtonPopoverFooter: "border-t border-white/10",
    userPreviewTextContainer: "text-slate-100",
    userPreviewSecondaryIdentifier: "text-slate-400",
    avatarBox: "size-9",
  },
};
