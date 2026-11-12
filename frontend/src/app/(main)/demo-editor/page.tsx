import type { Metadata } from "next";
import { DemoEditorClient } from "./demo-editor-client";

export const metadata: Metadata = {
  title: "Rich Text & Technical Editor Demo | The Fourth Clover",
  description: "Live interactive playground for The Fourth Clover's world-class rich text and technical post editor.",
};

export default function DemoEditorPage() {
  return <DemoEditorClient />;
}
