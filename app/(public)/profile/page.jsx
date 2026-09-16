"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  CameraIcon,
  CheckIcon,
  KeyRoundIcon,
  LogOutIcon,
  MailIcon,
  StarIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react";
import Loading from "@/components/Loading";

const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-panel border border-white/10 rounded-2xl p-6 sm:p-8">
    <div className="flex items-center gap-3 mb-1">
      <Icon size={18} className="text-accent" />
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
    {description && <p className="text-sm text-muted mb-6">{description}</p>}
    <div className={description ? "" : "mt-6"}>{children}</div>
  </div>
);

const FormField = ({ label, name, ...rest }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-2">
      {label}
    </label>
    <input
      id={name}
      name={name}
      className="w-full h-11 bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 outline-none transition-colors"
      {...rest}
    />
  </div>
);

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [name, setName] = useState({ firstName: "", lastName: "" });
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/");
      } else {
        setName({ firstName: user.firstName || "", lastName: user.lastName || "" });
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return <Loading />;
  }

  const nameDirty = name.firstName !== (user.firstName || "") || name.lastName !== (user.lastName || "");

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await user.setProfileImage({ file });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleNameSave = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await user.update({ firstName: name.firstName, lastName: name.lastName });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await user.updatePassword({
        ...(user.passwordEnabled ? { currentPassword: passwordForm.currentPassword } : {}),
        newPassword: passwordForm.newPassword,
        signOutOfOtherSessions: true,
      });
      toast.success(user.passwordEnabled ? "Password updated" : "Password set");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    setEmailBusy(true);
    try {
      const email = await user.createEmailAddress({ email: newEmail });
      await email.prepareVerification({ strategy: "email_code" });
      setPendingEmail(email);
      toast.success("Verification code sent");
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
    } finally {
      setEmailBusy(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!pendingEmail || !verificationCode) return;
    setEmailBusy(true);
    try {
      await pendingEmail.attemptVerification({ code: verificationCode });
      toast.success("Email verified");
      setPendingEmail(null);
      setVerificationCode("");
      setNewEmail("");
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
    } finally {
      setEmailBusy(false);
    }
  };

  const handleRemoveEmail = async (email) => {
    if (!window.confirm(`Remove ${email.emailAddress}?`)) return;
    try {
      await email.destroy();
      toast.success("Email removed");
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
    }
  };

  const handleMakePrimary = async (email) => {
    try {
      await user.update({ primaryEmailAddressId: email.id });
      toast.success("Primary email updated");
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
    }
  };

  const handleSignOut = () => signOut(() => router.push("/"));

  const handleDeleteAccount = async () => {
    if (!window.confirm("This will permanently delete your account. Continue?")) return;
    setDeleting(true);
    try {
      await user.delete();
      router.push("/");
    } catch (error) {
      toast.error(error?.errors?.[0]?.longMessage || error.message);
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto px-6 xl:px-0 py-10">
      <h1 className="text-2xl text-muted mb-8">
        My <span className="text-white font-semibold">Account</span>
      </h1>

      <div className="flex flex-col gap-6">
        {/* Header / avatar card */}
        <div className="bg-panel border border-white/10 rounded-2xl p-6 sm:p-8 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="size-20 rounded-full overflow-hidden bg-white/5 border border-white/10">
              <Image
                src={user.imageUrl}
                alt={user.fullName || "Profile"}
                width={80}
                height={80}
                className="size-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 size-7 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-white transition-colors disabled:opacity-60"
            >
              <CameraIcon size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-semibold text-white truncate">{user.fullName || "Unnamed user"}</p>
            <p className="text-sm text-muted truncate">{user.primaryEmailAddress?.emailAddress}</p>
            <p className="text-xs text-slate-500 mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* Personal info */}
        <Section icon={UserIcon} title="Personal information">
          <form onSubmit={handleNameSave} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="First name"
                name="firstName"
                type="text"
                value={name.firstName}
                onChange={(e) => setName({ ...name, firstName: e.target.value })}
                placeholder="First name"
              />
              <FormField
                label="Last name"
                name="lastName"
                type="text"
                value={name.lastName}
                onChange={(e) => setName({ ...name, lastName: e.target.value })}
                placeholder="Last name"
              />
            </div>
            <button
              type="submit"
              disabled={!nameDirty || savingName}
              className="self-start px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:bg-white/5 disabled:text-muted disabled:cursor-not-allowed text-slate-900 font-bold text-sm transition-colors"
            >
              {savingName ? "Saving..." : "Save changes"}
            </button>
          </form>
        </Section>

        {/* Email addresses */}
        <Section icon={MailIcon} title="Email addresses">
          <div className="flex flex-col gap-3 mb-5">
            {user.emailAddresses.map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-slate-100 truncate">{email.emailAddress}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {email.id === user.primaryEmailAddressId ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent">
                      <StarIcon size={11} /> Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMakePrimary(email)}
                      className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
                    >
                      Make primary
                    </button>
                  )}
                  {email.id !== user.primaryEmailAddressId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="size-7 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-red-400 transition-colors"
                    >
                      <Trash2Icon size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pendingEmail ? (
            <form onSubmit={handleVerifyEmail} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter verification code"
                className="flex-1 h-11 bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={emailBusy}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-slate-900 font-bold text-sm transition-colors"
              >
                <CheckIcon size={15} /> Verify
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingEmail(null);
                  setVerificationCode("");
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
              >
                <XIcon size={15} /> Cancel
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddEmail} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Add a new email address"
                className="flex-1 h-11 bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={emailBusy || !newEmail}
                className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-60 text-slate-100 font-medium text-sm transition-colors whitespace-nowrap"
              >
                {emailBusy ? "Sending..." : "Add email"}
              </button>
            </form>
          )}
        </Section>

        {/* Security */}
        <Section
          icon={KeyRoundIcon}
          title="Security"
          description={
            user.passwordEnabled
              ? "Update your password. You'll be signed out of other devices."
              : "Set a password for your account."
          }
        >
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            {user.passwordEnabled && (
              <FormField
                label="Current password"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Current password"
                required
              />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="New password"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="New password"
                required
                minLength={8}
              />
              <FormField
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="self-start px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-60 text-slate-900 font-bold text-sm transition-colors"
            >
              {savingPassword ? "Saving..." : user.passwordEnabled ? "Update password" : "Set password"}
            </button>
          </form>
        </Section>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-medium text-sm transition-colors"
        >
          <LogOutIcon size={16} /> Sign out
        </button>

        {/* Danger zone */}
        <div className="bg-panel border border-red-500/20 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-1">
            <Trash2Icon size={18} className="text-red-400" />
            <h2 className="text-lg font-semibold text-white">Danger zone</h2>
          </div>
          <p className="text-sm text-muted mb-6">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="px-6 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 disabled:opacity-60 text-red-400 font-semibold text-sm transition-colors"
          >
            {deleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}
