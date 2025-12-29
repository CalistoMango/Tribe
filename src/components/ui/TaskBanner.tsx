"use client";

import { Lock } from "lucide-react";
import { TaskItem } from "./TaskItem";
import { type TasksCompleted } from "~/lib/mockData";

interface TaskBannerProps {
  tasksCompleted: TasksCompleted;
  onVerifyTask: (task: 'followed' | 'likedRecasted') => void;
}

export function TaskBanner({ tasksCompleted, onVerifyTask }: TaskBannerProps) {
  // Only count the 3 earning tasks (connected, followed, likedRecasted)
  const earningTasks = [tasksCompleted.connected, tasksCompleted.followed, tasksCompleted.likedRecasted];
  const completedCount = earningTasks.filter(v => v).length;
  const allTasksDone = completedCount === 3;

  if (allTasksDone) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border-b border-violet-800/50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-violet-400" />
            <span className="font-medium">Complete tasks to unlock earning</span>
          </div>
          <span className="text-sm text-violet-300">{completedCount}/3</span>
        </div>
        <div className="space-y-2">
          <TaskItem
            done={tasksCompleted.connected}
            label="Connect your Farcaster account"
          />
          <TaskItem
            done={tasksCompleted.followed}
            label="Follow @tribe"
            onClick={() => onVerifyTask('followed')}
            actionLabel="Follow"
          />
          <TaskItem
            done={tasksCompleted.likedRecasted}
            label="Like and recast our launch post"
            onClick={() => onVerifyTask('likedRecasted')}
            actionLabel="Engage"
          />
        </div>
      </div>
    </div>
  );
}
