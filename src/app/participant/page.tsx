import type { Metadata } from "next";
import ParticipantForm from "./participant-form";

export const metadata: Metadata = {
  title: "Share Your Voice",
};

export default function ParticipantPage() {
  return <ParticipantForm />;
}
