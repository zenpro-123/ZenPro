import type { Metadata } from "next";
import { ProfileView } from "@/components/modules/profile/ProfileView";

export const metadata: Metadata = {
  title: "Profile — ZenPro",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-5xl">
      <ProfileView />
    </div>
  );
}
