"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageCircleIcon, SendIcon, XIcon } from "lucide-react";

const statusLabel = {
  PENDING: "View request (Pending)",
  ACTIVE: "View conversation",
  DECLINED: "View request (Declined)",
};

const MessageSellerButton = ({ productId, className = "" }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { openSignIn } = useClerk();
  const router = useRouter();

  const [state, setState] = useState(null); // { isOwnStore, conversation }
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchState = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`/api/messages/product/${productId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setState(data);
      } catch (error) {
        // Non-critical; button just won't show a specific state.
      }
    };
    fetchState();
  }, [user, productId]);

  if (!isLoaded || (user && state?.isOwnStore)) return null;

  const handleClick = () => {
    if (!user) return openSignIn();
    if (state?.conversation) {
      router.push(`/messages/${state.conversation.id}`);
    } else {
      setShowComposer(true);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setSending(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/messages/start",
        { productId, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push(`/messages/${data.conversation.id}`);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          "shrink-0 flex items-center justify-center gap-2 h-[52px] px-6 rounded-lg border border-white/10 bg-panel hover:border-accent/60 text-sm font-semibold text-slate-200 transition-colors"
        }
      >
        <MessageCircleIcon size={18} />
        {state?.conversation ? statusLabel[state.conversation.status] : "Ask the Seller"}
      </button>

      {showComposer && (
        <div
          onClick={() => !sending && setShowComposer(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col gap-4 w-full max-w-sm mx-auto bg-panel border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-6"
          >
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="absolute top-5 right-5 size-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white transition-colors"
            >
              <XIcon size={18} />
            </button>

            <h2 className="text-lg font-semibold text-white pr-8">Ask about this product</h2>
            <p className="text-xs text-muted -mt-2">
              The seller will need to accept before you can keep chatting.
            </p>

            <form onSubmit={handleSend} className="flex flex-col gap-4">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. Is this still in stock in size M?"
                rows={4}
                className="w-full resize-none bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 py-3 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-sm py-3 rounded-lg transition-colors"
              >
                <SendIcon size={15} />
                {sending ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageSellerButton;
