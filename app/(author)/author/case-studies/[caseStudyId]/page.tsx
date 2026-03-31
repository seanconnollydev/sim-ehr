import { CaseStudyEditor } from "@/components/author/case-study-editor";

type Props = { params: Promise<{ caseStudyId: string }> };

export default async function AuthorCaseStudyEditPage({ params }: Props) {
  const { caseStudyId } = await params;
  return <CaseStudyEditor caseStudyId={caseStudyId} />;
}
