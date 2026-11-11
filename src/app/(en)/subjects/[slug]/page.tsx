import { notFound } from "next/navigation";

import { SubjectPage } from "@/components/subject/SubjectPage";
import { getSubject, SUBJECT_SLUGS } from "@/content/subjects";
import { buildSubjectMetadata } from "@/lib/metadata";

/** English subject page: /subjects/<slug> */
export const dynamicParams = false;

export function generateStaticParams() {
  return SUBJECT_SLUGS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildSubjectMetadata("en", slug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const subject = getSubject("en", slug);
  if (!subject) notFound();
  return <SubjectPage subject={subject} lang="en" />;
}
