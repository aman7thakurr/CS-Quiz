import { redirect } from "next/navigation";

interface PracticeResultPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function PracticeResultPage({
  params,
}: PracticeResultPageProps) {
  const { attemptId } = await params;
  redirect(`/mock/${attemptId}/result`);
}
