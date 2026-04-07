/* "use client";

import { useState, useEffect } from "react";

interface WorkSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  active: boolean;
}

export default function UserTimeTracker() {
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession?.active) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [currentSession]);

  const startWorkSession = () => {
    const newSession: WorkSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      active: true,
    };
    setCurrentSession(newSession);
    setElapsedTime(0);
  };

  const endWorkSession = () => {
    if (currentSession) {
      const endedSession: WorkSession = {
        ...currentSession,
        endTime: new Date(),
        duration: elapsedTime,
        active: false,
      };
      
      setSessions(prev => [endedSession, ...prev]);
      setCurrentSession(null);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Seguimiento de Tiempo</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              {currentSession ? "Sesión Activa" : "Sin sesión activa"}
            </h3>
            <p className="text-blue-700">
              {currentSession 
                ? `Iniciada: ${currentSession.startTime.toLocaleTimeString()}`
                : "Presiona iniciar para comenzar a registrar tu tiempo"
              }
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {formatTime(elapsedTime)}
            </div>
            {!currentSession ? (
              <button
                onClick={startWorkSession}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                ▶ Iniciar Jornada
              </button>
            ) : (
              <button
                onClick={endWorkSession}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                ⏹ Detener Jornada
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Historial de Jornadas</h3>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <div key={session.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  {session.startTime.toLocaleDateString()} - {session.startTime.toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-600">
                  Duración: {session.duration ? formatTime(session.duration) : 'N/A'}
                </p>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Completada
              </span>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl mb-2 block">⏰</span>
              <p>No hay sesiones registradas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} */