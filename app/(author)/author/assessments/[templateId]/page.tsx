import { WdlTemplateEditor } from "@/components/author/wdl-template-editor";

type Props = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ caseStudyId?: string }>;
};

export default async function AuthorWdlTemplatePage({ params, searchParams }: Props) {
  const { templateId } = await params;
  const sp = await searchParams;
  return (
    <WdlTemplateEditor
      templateId={templateId}
      initialCaseStudyId={sp.caseStudyId}
    />
  );
}
