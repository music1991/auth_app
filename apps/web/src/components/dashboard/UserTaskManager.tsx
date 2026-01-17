"use client";

import { useState, useEffect } from "react";

interface UserTask {
  id: string;
  title: string;
  description: string;
  type: "course" | "report" | "project";
  status: "pending" | "in-progress" | "completed";
  assigned_by: string;
  assigned_by_name: string;
  assigned_date: string;
  due_date: string | null;
  progress: number;
  details: any;
}

export default function UserTaskManager() {
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<UserTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/dashboard/user/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: UserTask["status"]) => {
    try {
      const response = await fetch('/api/dashboard/user/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, status: newStatus });
        }

        if (newStatus === 'completed') {
          await updateTaskProgress(taskId, 100);
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    try {
      const response = await fetch('/api/dashboard/user/tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          progress,
        }),
      });

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, progress } : task
        ));
        if (selectedTask?.id === taskId) {
          setSelectedTask({ ...selectedTask, progress });
        }
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  };

  const getStatusColor = (status: UserTask["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: UserTask["type"]) => {
    switch (type) {
      case "course": return "🎓";
      case "report": return "📄";
      case "project": return "🚀";
      default: return "📌";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">My Tasks</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4 animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-20"></div>
              </div>
              <div className="h-3 bg-gray-300 rounded w-full mb-3"></div>
              <div className="flex justify-between items-center text-sm">
                <div className="h-3 bg-gray-300 rounded w-24"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-gray-300 h-2 rounded-full w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">My Tasks</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedTask?.id === task.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(task.type)}</span>
                  <h3 className="font-semibold">{task.title}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status === "pending" && "Pending"}
                  {task.status === "in-progress" && "In Progress"}
                  {task.status === "completed" && "Completed"}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{task.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Assigned by: {task.assigned_by_name}</span>
                <span>Progress: {task.progress}%</span>
              </div>
              
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>

              <div className="flex gap-2 mt-3">
                {task.status !== "completed" && task.status !== "in-progress" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskStatus(task.id, "in-progress");
                    }}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Start
                  </button>
                )}
                {task.status === "in-progress" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskStatus(task.id, "completed");
                    }}
                    className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl mb-2 block">📋</span>
              <p>No tasks assigned</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          {selectedTask ? (
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Task Details</h3>
                <span className="text-2xl">{getTypeIcon(selectedTask.type)}</span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-gray-900">{selectedTask.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900">{selectedTask.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => updateTaskStatus(selectedTask.id, e.target.value as UserTask["status"])}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Progress</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedTask.progress}
                      onChange={(e) => updateTaskProgress(selectedTask.id, parseInt(e.target.value))}
                      className="mt-1 block w-full"
                    />
                    <span className="text-sm text-gray-600">{selectedTask.progress}%</span>
                  </div>
                </div>

                {selectedTask.details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Details
                    </label>
                    <div className="space-y-2">
                      {selectedTask.details.courseUrl && (
                        <div>
                          <span className="font-medium">Course:</span>
                          <a href={selectedTask.details.courseUrl} target="_blank" rel="noopener noreferrer" 
                             className="ml-2 text-blue-600 hover:underline">
                            Access course
                          </a>
                        </div>
                      )}
                      
                      {selectedTask.details.reportTemplate && (
                        <div>
                          <span className="font-medium">Template:</span>
                          <span className="ml-2 text-gray-600">{selectedTask.details.reportTemplate}</span>
                        </div>
                      )}
                      
                      {selectedTask.details.requirements && (
                        <div>
                          <span className="font-medium">Requirements:</span>
                          <ul className="ml-4 list-disc text-gray-600">
                            {selectedTask.details.requirements.map((req: string, index: number) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl mb-2 block">📋</span>
              <p>Select a task to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}