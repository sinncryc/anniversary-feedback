import type { Metadata } from "next";
import QrBoard from "./qr-board";

export const metadata: Metadata = {
  title: "Scan & Share Your Voice",
};

export default function QrPage() {
  return <QrBoard />;
}
