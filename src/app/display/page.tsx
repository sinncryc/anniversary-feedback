import type { Metadata } from "next";
import DisplayStage from "./display-stage";

export const metadata: Metadata = {
  title: "What Our People Are Saying",
};

export default function DisplayPage() {
  return <DisplayStage />;
}
