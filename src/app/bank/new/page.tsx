import { getSubjectsWithTopics } from "@/actions/questions";
import { QuestionEditor } from "@/components/question-editor";

export const dynamic = "force-dynamic";

export default async function NewQuestionPage() {
  const subjects = await getSubjectsWithTopics();

  return <QuestionEditor subjects={subjects} />;
}
