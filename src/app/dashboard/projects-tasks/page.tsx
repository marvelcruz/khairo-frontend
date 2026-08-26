"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  FolderPlus,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { api } from "@/lib/api";

type ProjectStatus =
  | "active"
  | "completed";

type TaskStatus =
  | "todo"
  | "in_progress"
  | "done";

type Project = {
  _id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

type Assignee = {
  _id: string;
  name: string;
  email?: string;
  roles?: string[];
};

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueAt?: string;
  completedAt?: string;
  project: {
    _id: string;
    name: string;
    status: ProjectStatus;
  };
  assignedTo?: Assignee | null;
  createdAt: string;
  updatedAt: string;
};

type Overview = {
  success: boolean;
  projects: Project[];
  tasks: Task[];
  assignees: Assignee[];
  stats: {
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
};

const COLUMNS: Array<{
  key: TaskStatus;
  label: string;
}> = [
  {
    key: "todo",
    label: "To do",
  },
  {
    key: "in_progress",
    label: "In progress",
  },
  {
    key: "done",
    label: "Done",
  },
];

function dueLabel(
  value?: string
) {
  if (!value) return "No due date";

  return new Date(
    value
  ).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year:
        new Date(value).getFullYear() !==
        new Date().getFullYear()
          ? "numeric"
          : undefined,
    }
  );
}

function overdue(
  task: Task
) {
  return Boolean(
    task.status !== "done" &&
      task.dueAt &&
      new Date(task.dueAt) <
        new Date()
  );
}

export default function ProjectsTasksPage() {
  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);

  const [
    tasks,
    setTasks,
  ] = useState<Task[]>([]);

  const [
    assignees,
    setAssignees,
  ] = useState<Assignee[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    projectFilter,
    setProjectFilter,
  ] = useState("all");

  const [
    showProjectForm,
    setShowProjectForm,
  ] = useState(false);

  const [
    showTaskForm,
    setShowTaskForm,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState("");

  const [
    projectDraft,
    setProjectDraft,
  ] = useState({
    name: "",
    description: "",
  });

  const [
    taskDraft,
    setTaskDraft,
  ] = useState({
    title: "",
    description: "",
    project: "",
    assignedTo: "",
    dueLocal: "",
  });

  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await api.get<Overview>(
            "/projects-tasks",
            {
              timeoutMs: 15000,
            }
          );

        setProjects(
          response.projects || []
        );

        setTasks(
          response.tasks || []
        );

        setAssignees(
          response.assignees ||
            []
        );

        setTaskDraft(
          (current) => ({
            ...current,
            project:
              current.project ||
              response.projects?.find(
                (project) =>
                  project.status ===
                  "active"
              )?._id ||
              "",
          })
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load projects and tasks."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return tasks.filter(
        (task) => {
          if (
            projectFilter !==
              "all" &&
            task.project._id !==
              projectFilter
          ) {
            return false;
          }

          if (!q) return true;

          return (
            task.title
              .toLowerCase()
              .includes(q) ||
            task.description
              ?.toLowerCase()
              .includes(q) ||
            task.project.name
              .toLowerCase()
              .includes(q) ||
            task.assignedTo?.name
              ?.toLowerCase()
              .includes(q)
          );
        }
      );
    }, [
      tasks,
      search,
      projectFilter,
    ]);

  const stats =
    useMemo(
      () => ({
        open:
          tasks.filter(
            (task) =>
              task.status !==
              "done"
          ).length,

        inProgress:
          tasks.filter(
            (task) =>
              task.status ===
              "in_progress"
          ).length,

        completed:
          tasks.filter(
            (task) =>
              task.status ===
              "done"
          ).length,

        overdue:
          tasks.filter(
            overdue
          ).length,
      }),
      [tasks]
    );

  const projectCounts =
    useMemo(
      () =>
        new Map(
          projects.map(
            (project) => [
              project._id,
              tasks.filter(
                (task) =>
                  task.project
                    ._id ===
                  project._id
              ).length,
            ]
          )
        ),
      [projects, tasks]
    );

  const activeProjects =
    projects.filter(
      (project) =>
        project.status ===
        "active"
    );

  async function createProject() {
    if (
      !projectDraft.name.trim()
    ) {
      setError(
        "Project name is required."
      );
      return;
    }

    setSaving("project");
    setError("");

    try {
      const response =
        await api.post<{
          project: Project;
        }>(
          "/projects-tasks/projects",
          {
            name:
              projectDraft.name,
            description:
              projectDraft.description,
          }
        );

      setProjectDraft({
        name: "",
        description: "",
      });

      setShowProjectForm(false);

      setTaskDraft(
        (current) => ({
          ...current,
          project:
            current.project ||
            response.project._id,
        })
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create project."
      );
    } finally {
      setSaving("");
    }
  }

  async function createTask() {
    if (
      !taskDraft.title.trim()
    ) {
      setError(
        "Task title is required."
      );
      return;
    }

    if (!taskDraft.project) {
      setError(
        "Choose a project."
      );
      return;
    }

    setSaving("task");
    setError("");

    try {
      await api.post(
        "/projects-tasks/tasks",
        {
          title:
            taskDraft.title,
          description:
            taskDraft.description,
          project:
            taskDraft.project,
          assignedTo:
            taskDraft.assignedTo ||
            null,
          dueAt:
            taskDraft.dueLocal
              ? new Date(
                  taskDraft.dueLocal
                ).toISOString()
              : null,
        }
      );

      setTaskDraft(
        (current) => ({
          title: "",
          description: "",
          project:
            current.project,
          assignedTo: "",
          dueLocal: "",
        })
      );

      setShowTaskForm(false);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create task."
      );
    } finally {
      setSaving("");
    }
  }

  async function updateTaskStatus(
    taskId: string,
    status: TaskStatus
  ) {
    setSaving(taskId);
    setError("");

    try {
      const response =
        await api.patch<{
          task: Task;
        }>(
          `/projects-tasks/tasks/${taskId}`,
          {
            status,
          }
        );

      setTasks(
        (current) =>
          current.map(
            (task) =>
              task._id === taskId
                ? response.task
                : task
          )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update task."
      );
    } finally {
      setSaving("");
    }
  }

  async function updateProjectStatus(
    projectId: string,
    status: ProjectStatus
  ) {
    setSaving(projectId);
    setError("");

    try {
      const response =
        await api.patch<{
          project: Project;
        }>(
          `/projects-tasks/projects/${projectId}`,
          {
            status,
          }
        );

      setProjects(
        (current) =>
          current.map(
            (project) =>
              project._id ===
              projectId
                ? response.project
                : project
          )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update project."
      );
    } finally {
      setSaving("");
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9488]">
              Operations
            </p>

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-600/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              <CheckCircle2
                size={11}
              />
              Connected
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Projects & Tasks
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--theme-text-secondary)]">
            Organize internal
            KhairoDietClinic work, assign
            ownership and track
            progress without mixing
            operational projects with
            CRM follow-up tasks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              void load()
            }
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-white disabled:opacity-40"
          >
            <RefreshCw
              size={13}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              setShowProjectForm(
                (value) => !value
              )
            }
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--theme-border)] px-4 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-white"
          >
            <FolderPlus
              size={14}
            />
            New project
          </button>

          <button
            type="button"
            onClick={() =>
              setShowTaskForm(
                (value) => !value
              )
            }
            disabled={
              activeProjects.length ===
              0
            }
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
            New task
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [
            "Open tasks",
            stats.open,
            FolderKanban,
          ],
          [
            "In progress",
            stats.inProgress,
            Clock3,
          ],
          [
            "Completed",
            stats.completed,
            CheckCircle2,
          ],
          [
            "Overdue",
            stats.overdue,
            AlertTriangle,
          ],
        ].map(
          ([
            label,
            value,
            Icon,
          ]) => {
            const IconComponent =
              Icon as typeof FolderKanban;

            return (
              <div
                key={String(label)}
                className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4"
              >
                <IconComponent
                  size={17}
                  className={
                    label ===
                    "Overdue"
                      ? "text-amber-300"
                      : "text-[#0d9488]"
                  }
                />

                <p className="mt-4 text-2xl font-semibold text-white">
                  {String(value)}
                </p>

                <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
                  {String(label)}
                </p>
              </div>
            );
          }
        )}
      </div>

      {showProjectForm && (
        <section className="rounded-2xl border border-[#0d9488]/20 bg-[#0d9488]/[0.025] p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-white">
              New project
            </h2>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
              Create an internal
              workstream for related
              tasks.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                Project name
              </span>

              <input
                value={
                  projectDraft.name
                }
                onChange={(event) =>
                  setProjectDraft(
                    (current) => ({
                      ...current,
                      name:
                        event.target
                          .value,
                    })
                  )
                }
                className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                Description
              </span>

              <input
                value={
                  projectDraft.description
                }
                onChange={(event) =>
                  setProjectDraft(
                    (current) => ({
                      ...current,
                      description:
                        event.target
                          .value,
                    })
                  )
                }
                className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setShowProjectForm(
                  false
                )
              }
              className="h-9 rounded-full px-4 text-xs font-semibold text-[var(--theme-text-secondary)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void createProject()
              }
              disabled={
                saving ===
                  "project" ||
                !projectDraft.name.trim()
              }
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white disabled:opacity-40"
            >
              {saving ===
              "project" ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <FolderPlus
                  size={13}
                />
              )}
              Create project
            </button>
          </div>
        </section>
      )}

      {showTaskForm && (
        <section className="rounded-2xl border border-[#0d9488]/20 bg-[#0d9488]/[0.025] p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold text-white">
              New task
            </h2>
            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
              Assign internal work to
              an active team member.
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                Task
              </span>

              <input
                value={
                  taskDraft.title
                }
                onChange={(event) =>
                  setTaskDraft(
                    (current) => ({
                      ...current,
                      title:
                        event.target
                          .value,
                    })
                  )
                }
                placeholder="What needs to be done?"
                className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                Project
              </span>

              <select
                value={
                  taskDraft.project
                }
                onChange={(event) =>
                  setTaskDraft(
                    (current) => ({
                      ...current,
                      project:
                        event.target
                          .value,
                    })
                  )
                }
                className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white"
              >
                <option value="">
                  Choose project
                </option>

                {activeProjects.map(
                  (project) => (
                    <option
                      key={
                        project._id
                      }
                      value={
                        project._id
                      }
                    >
                      {project.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                Owner
              </span>

              <select
                value={
                  taskDraft.assignedTo
                }
                onChange={(event) =>
                  setTaskDraft(
                    (current) => ({
                      ...current,
                      assignedTo:
                        event.target
                          .value,
                    })
                  )
                }
                className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white"
              >
                <option value="">
                  Unassigned
                </option>

                {assignees.map(
                  (person) => (
                    <option
                      key={
                        person._id
                      }
                      value={
                        person._id
                      }
                    >
                      {person.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                Due date
              </span>

              <input
                type="datetime-local"
                value={
                  taskDraft.dueLocal
                }
                onChange={(event) =>
                  setTaskDraft(
                    (current) => ({
                      ...current,
                      dueLocal:
                        event.target
                          .value,
                    })
                  )
                }
                className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white"
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-medium text-[var(--theme-text-secondary)]">
                Notes
              </span>

              <input
                value={
                  taskDraft.description
                }
                onChange={(event) =>
                  setTaskDraft(
                    (current) => ({
                      ...current,
                      description:
                        event.target
                          .value,
                    })
                  )
                }
                className="h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() =>
                setShowTaskForm(
                  false
                )
              }
              className="h-9 rounded-full px-4 text-xs font-semibold text-[var(--theme-text-secondary)]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                void createTask()
              }
              disabled={
                saving ===
                  "task" ||
                !taskDraft.title.trim() ||
                !taskDraft.project
              }
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#0d9488] px-4 text-xs font-semibold text-white disabled:opacity-40"
            >
              {saving ===
              "task" ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <Plus size={13} />
              )}
              Create task
            </button>
          </div>
        </section>
      )}

      <section className="min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3">
            <Search
              size={15}
              className="shrink-0 text-[var(--theme-text-muted)]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search tasks, projects or owners"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--theme-text-muted)]"
            />
          </div>

          <select
            value={
              projectFilter
            }
            onChange={(event) =>
              setProjectFilter(
                event.target.value
              )
            }
            className="h-10 min-w-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input)] px-3 text-sm text-white lg:w-64"
          >
            <option value="all">
              All projects
            </option>

            {projects.map(
              (project) => (
                <option
                  key={project._id}
                  value={project._id}
                >
                  {project.name}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Projects
            </h2>

            <p className="mt-1 text-xs text-[var(--theme-text-muted)]">
              CRM follow-up tasks remain
              in CRM and are not
              duplicated here.
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--theme-border)] p-6 text-center">
            <FolderKanban
              size={23}
              className="mx-auto text-[var(--theme-text-muted)]"
            />

            <p className="mt-3 text-sm text-[var(--theme-text-muted)]">
              No internal projects yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map(
              (project) => (
                <article
                  key={project._id}
                  className="min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)] p-4"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-white">
                        {project.name}
                      </p>

                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--theme-text-muted)]">
                          {
                            project.description
                          }
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 rounded-full border border-[var(--theme-border)] px-2 py-1 text-[9px] font-semibold uppercase text-[var(--theme-text-muted)]">
                      {projectCounts.get(
                        project._id
                      ) || 0}{" "}
                      task
                      {(projectCounts.get(
                        project._id
                      ) || 0) === 1
                        ? ""
                        : "s"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setProjectFilter(
                          project._id
                        )
                      }
                      className="text-xs font-semibold text-[#0d9488]"
                    >
                      View tasks
                    </button>

                    <select
                      aria-label={`Status for ${project.name}`}
                      value={
                        project.status
                      }
                      disabled={
                        saving ===
                        project._id
                      }
                      onChange={(event) =>
                        void updateProjectStatus(
                          project._id,
                          event.target
                            .value as ProjectStatus
                        )
                      }
                      className="h-8 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2 text-xs text-[var(--theme-text-secondary)] disabled:opacity-40"
                    >
                      <option value="active">
                        Active
                      </option>
                      <option value="completed">
                        Completed
                      </option>
                    </select>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--theme-text-muted)]">
          <Loader2
            size={15}
            className="animate-spin"
          />
          Loading projects and tasks…
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          {COLUMNS.map(
            (column) => {
              const list =
                filtered.filter(
                  (task) =>
                    task.status ===
                    column.key
                );

              return (
                <section
                  key={
                    column.key
                  }
                  className="min-w-0 overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface-soft)]"
                >
                  <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
                    <h2 className="text-sm font-semibold text-white">
                      {
                        column.label
                      }
                    </h2>

                    <span className="rounded-full bg-[var(--theme-surface-soft)] px-2 py-0.5 text-[10px] text-[var(--theme-text-muted)]">
                      {list.length}
                    </span>
                  </div>

                  <div className="space-y-3 p-3">
                    {list.length ===
                      0 && (
                      <div className="rounded-xl border border-dashed border-[var(--theme-border)] p-5 text-center text-xs text-[var(--theme-text-muted)]">
                        No tasks
                      </div>
                    )}

                    {list.map(
                      (task) => (
                        <article
                          key={
                            task._id
                          }
                          className={`min-w-0 rounded-xl border bg-[var(--theme-input)] p-4 ${
                            overdue(
                              task
                            )
                              ? "border-amber-500/20"
                              : "border-[var(--theme-border)]"
                          }`}
                        >
                          <p className="break-words text-sm font-medium leading-5 text-white">
                            {
                              task.title
                            }
                          </p>

                          <p className="mt-2 break-words text-xs text-[#0d9488]/80">
                            {
                              task
                                .project
                                .name
                            }
                          </p>

                          {task.description && (
                            <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--theme-text-muted)]">
                              {
                                task.description
                              }
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="inline-flex min-w-0 items-center gap-1.5 text-[var(--theme-text-muted)]">
                              <UserRound
                                size={
                                  12
                                }
                                className="shrink-0"
                              />
                              <span className="truncate">
                                {task
                                  .assignedTo
                                  ?.name ||
                                  "Unassigned"}
                              </span>
                            </span>

                            <span
                              className={`inline-flex items-center gap-1.5 ${
                                overdue(
                                  task
                                )
                                  ? "text-amber-300"
                                  : "text-[var(--theme-text-muted)]"
                              }`}
                            >
                              <Clock3
                                size={
                                  12
                                }
                              />
                              {dueLabel(
                                task.dueAt
                              )}
                            </span>
                          </div>

                          <select
                            aria-label={`Status for ${task.title}`}
                            value={
                              task.status
                            }
                            disabled={
                              saving ===
                              task._id
                            }
                            onChange={(event) =>
                              void updateTaskStatus(
                                task._id,
                                event
                                  .target
                                  .value as TaskStatus
                              )
                            }
                            className="mt-4 h-9 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input)] px-2 text-xs font-semibold text-[var(--theme-text-secondary)] outline-none disabled:opacity-40"
                          >
                            <option value="todo">
                              To do
                            </option>

                            <option value="in_progress">
                              In progress
                            </option>

                            <option value="done">
                              Done
                            </option>
                          </select>
                        </article>
                      )
                    )}
                  </div>
                </section>
              );
            }
          )}
        </div>
      )}
    </main>
  );
}
