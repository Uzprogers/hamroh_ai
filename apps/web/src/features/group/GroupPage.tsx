import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bars3D } from "./Bars3D";
import { GrowthChip, GrowthList } from "./GrowthList";
import { MistakeDetailDialog } from "./MistakeDetailDialog";
import { MistakeTallyList } from "./MistakeTallyList";
import { MembersPanel } from "./MembersPanel";
import { Panel } from "../../components/Panel";
import { StudentDetailDialog } from "./StudentDetailDialog";
import { TopicFilter } from "./TopicFilter";
import { StatRing } from "../profile/StatRing";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../i18n/i18n";
import type { GroupAnalytics, GroupMistakeTally, GroupStudentAnalytics } from "./group.types";

const CHART_LIMIT = 8;

function StudentCard({
  student,
  rank,
  onOpen,
}: {
  student: GroupStudentAnalytics;
  rank: number;
  onOpen: () => void;
}) {
  const { t } = useI18n();

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="surface w-full p-4 text-start transition duration-300 hover:-translate-y-0.5 hover:border-teal/50 focus:outline-none focus-visible:border-teal/70"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="chip">
              {t("group.rank")} {rank}
            </span>
            <div className="mt-2 truncate text-start font-display text-base font-extrabold">
              {student.name}
            </div>
          </div>
          <GrowthChip value={student.growth_percent} />
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3">
          <span className="font-mono text-sm">{student.average_percent}%</span>
          <span className="text-start text-xs text-muted">
            {student.submissions} {t("group.submissions")}
          </span>
        </div>

        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-edge">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-teal to-azure transition-[width] duration-700 ease-out"
            style={{ width: `${student.average_percent}%` }}
          />
        </span>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <span className={student.major_mistakes > 0 ? "text-coral" : "text-muted"}>
            {t("teacher.majorMistakes")}: {student.major_mistakes}
          </span>
          <span className="shrink-0 font-semibold text-teal">{t("group.detail")} →</span>
        </div>
      </button>
    </li>
  );
}

export function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<GroupAnalytics | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [openStudent, setOpenStudent] = useState<GroupStudentAnalytics | null>(null);
  const [openMistake, setOpenMistake] = useState<GroupMistakeTally | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const query = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : "";

    setFailed(false);
    setBusy(true);
    api
      .get<GroupAnalytics>(`/groups/${id}/analytics${query}`, token)
      .then((value) => !cancelled && setData(value))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setBusy(false));

    return () => {
      cancelled = true;
    };
  }, [id, token, lessonId]);

  if (failed) {
    return (
      <div className="py-6">
        <Link to="/groups" className="chip hover:border-teal/50 hover:text-teal">
          {t("group.back")}
        </Link>
        <p className="mt-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-start text-sm text-coral">
          {t("profile.failed")}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-6 space-y-4">
        <div className="skeleton h-8 w-28" />
        <div className="skeleton h-40" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  const lessons = data.lessons ?? [];
  const mistakes = data.top_mistakes;
  const mistakeTotal = mistakes.reduce((sum, mistake) => sum + mistake.count, 0);
  const bars = data.students.slice(0, CHART_LIMIT).map((student) => ({
    id: student.student_id,
    label: student.name,
    value: student.average_percent,
  }));

  return (
    <div className="py-6">
      <Link to="/groups" className="chip hover:border-teal/50 hover:text-teal">
        {t("group.back")}
      </Link>

      <header className="surface relative mt-4 overflow-hidden p-6 sm:p-8">
        <span className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-teal/25 to-azure/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="chip border-teal/40 text-teal">{t("group.title")}</span>
            <h2 className="mt-2 text-start font-display text-2xl font-extrabold sm:text-3xl">
              {data.group.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-start text-xs text-muted">
              <span>{data.group.subject}</span>
              <span>
                {data.students.length} {t("group.students")}
              </span>
              <span>
                {data.submissions} {t("group.submissions")}
              </span>
            </div>
          </div>

          <StatRing percent={data.average_percent} label={t("group.average")} />
        </div>
      </header>

      {lessons.length > 0 && (
        <div className="mt-4">
          <TopicFilter lessons={lessons} activeId={lessonId} onSelect={setLessonId} />
        </div>
      )}

      <div className="mt-4">
        <MembersPanel groupId={data.group.id} code={data.group.code} />
      </div>

      <div className={busy ? "opacity-60 transition-opacity" : "transition-opacity"}>
        {data.students.length === 0 ? (
          <p className="mt-4 text-start text-sm text-muted">{t("group.empty")}</p>
        ) : (
          <>
            <div className="mt-4">
              <Panel title={t("group.students")}>
                <Bars3D items={bars} />
              </Panel>
            </div>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.students.map((student, index) => (
                <StudentCard
                  key={student.student_id}
                  student={student}
                  rank={index + 1}
                  onOpen={() => setOpenStudent(student)}
                />
              ))}
            </ul>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Panel title={t("group.growth.leaders")}>
                <GrowthList leaders={data.growth_leaders} />
              </Panel>

              <Panel
                title={t("group.mistakes.top")}
                aside={
                  mistakeTotal > 0 ? (
                    <span className="chip border-coral/40 font-mono text-coral">{mistakeTotal}</span>
                  ) : undefined
                }
              >
                <MistakeTallyList
                  mistakes={mistakes}
                  total={mistakeTotal}
                  onOpen={setOpenMistake}
                />
              </Panel>
            </div>
          </>
        )}
      </div>

      {id && openStudent && (
        <StudentDetailDialog
          groupId={id}
          studentId={openStudent.student_id}
          studentName={openStudent.name}
          onClose={() => setOpenStudent(null)}
        />
      )}

      {openMistake && (
        <MistakeDetailDialog
          mistake={openMistake}
          total={mistakeTotal}
          onClose={() => setOpenMistake(null)}
        />
      )}
    </div>
  );
}
