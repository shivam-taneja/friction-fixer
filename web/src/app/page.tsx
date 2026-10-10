import { HomePage } from "@/components/home/home-page";
import { homeMetadata } from "@/lib/seo";

export const metadata = homeMetadata;

export default function Page() {
  return <HomePage />;
}
